import { db } from 'hatchable';
import { effectiveRules, activeRules, runRegexRules, SEVERITY_RANK } from 'lib/rules.js';
import { pickReply } from 'lib/replies.js';
import { settingsOf, log } from 'lib/util.js';

/**
 * Decide what happens to one review. The rating is the rule:
 *
 *   4 stars and up   -> post a thank-you the owner picked in advance
 *   3 stars and below -> write nothing; raise an alert for the owner
 *   no rating at all  -> treat as the second case
 *
 * The unrated case is deliberate. A review with no stars could say anything,
 * and thanking an unhappy customer automatically is worse than staying quiet.
 *
 * There is no model call anywhere in here, so the app needs no AI key and
 * costs nothing per review. There is no email either — the dashboard alert is
 * the whole notification story.
 */
export async function processReview(business, reviewId, opts = {}) {
  const { actor = 'system' } = opts;
  const settings = settingsOf(business);

  const rv = await db.query('SELECT * FROM reviews WHERE id = $1 AND business_id = $2', [reviewId, business.id]);
  const review = rv.rows[0];
  if (!review) throw new Error('review not found');

  const rules = await effectiveRules(business.id);
  const reviewHits = runRegexRules(activeRules(rules, 'review'), `${review.author_name || ''}\n${review.body}`);

  const threshold = Number(settings.owner_handles_at_or_below) || 3;
  const rating = review.rating;
  const ownerHandles = rating == null || rating <= threshold;

  let responseId = null;
  let responseStatus = null;
  let reviewStatus;

  if (ownerHandles) {
    // Nothing is drafted. Any earlier auto-reply for this review is retired so
    // a stale thank-you cannot sit under a complaint after a re-run.
    await db.query(
      `UPDATE responses SET status = 'superseded', updated_at = now()
        WHERE review_id = $1 AND status IN ('draft','approved','blocked')`,
      [review.id]
    );
    reviewStatus = 'needs_reply';
  } else {
    // How many auto-replies this business has already sent drives the rotation.
    const sent = await db.query(
      `SELECT count(*)::int AS n FROM responses WHERE business_id = $1 AND generated_by = 'template'`,
      [business.id]
    );
    const picked = pickReply(settings, review, business, sent.rows[0].n);

    if (!picked) {
      // Auto-reply is off, or the owner has enabled no usable replies. Not an
      // error: the review is simply left for them, without an alert.
      reviewStatus = 'no_reply_configured';
    } else {
      // Run the reply past the compliance rules before it is posted. These are
      // the owner's own templates, so a hit means their wording needs fixing,
      // and it must not go out in the meantime.
      const responseHits = runRegexRules(activeRules(rules, 'response'), picked.body);
      const blocked = responseHits.some((h) => h.rule.severity === 'block');

      await db.query(
        `UPDATE responses SET status = 'superseded', updated_at = now()
          WHERE review_id = $1 AND status IN ('draft','approved','blocked')`,
        [review.id]
      );

      const ins = await db.query(
        `INSERT INTO responses (business_id, review_id, body, status, generated_by, model, checks, approved_by, approved_at)
         VALUES ($1, $2, $3, $4, 'template', $5, $6::jsonb, $7, $8) RETURNING id`,
        [
          business.id, review.id, picked.body,
          blocked ? 'blocked' : 'approved',
          picked.templateId,
          JSON.stringify({ rule_hits: responseHits.map((h) => h.rule.name) }),
          blocked ? null : 'auto',
          blocked ? null : new Date().toISOString(),
        ]
      );
      responseId = ins.rows[0].id;
      responseStatus = blocked ? 'blocked' : 'approved';

      // A blocked reply is the owner's problem to fix, so it becomes an alert.
      reviewStatus = blocked ? 'needs_reply' : 'approved';

      for (const h of responseHits) {
        await db.query(
          `INSERT INTO flags (business_id, review_id, response_id, rule_id, rule_name, target, severity, detail)
           VALUES ($1,$2,$3,$4,$5,'response',$6,$7)`,
          [business.id, review.id, responseId, h.rule.id, h.rule.name, h.rule.severity, h.detail]
        );
      }
    }
  }

  // Record what the rules noticed in the review text. This is what gives the
  // owner a reason on the alert instead of just a low number.
  await db.query(`DELETE FROM flags WHERE review_id = $1 AND status = 'open' AND target = 'review'`, [review.id]);
  for (const h of reviewHits) {
    await db.query(
      `INSERT INTO flags (business_id, review_id, rule_id, rule_name, target, severity, detail)
       VALUES ($1,$2,$3,$4,'review',$5,$6)`,
      [business.id, review.id, h.rule.id, h.rule.name, h.rule.severity, h.detail]
    );
  }

  const worst = reviewHits.reduce((m, h) => Math.max(m, SEVERITY_RANK[h.rule.severity] ?? 0), -1);
  const riskLevel = worst >= SEVERITY_RANK.block ? 'high'
    : worst >= SEVERITY_RANK.warn ? 'medium'
    : (rating != null && rating <= 2) ? 'medium' : 'low';

  // Never downgrade a review the owner has already dealt with.
  const settled = ['published', 'archived', 'resolved'].includes(review.status);
  const finalStatus = settled && !opts.force ? review.status : reviewStatus;

  await db.query(
    `UPDATE reviews SET status = $2, risk_level = $3, analysis = $4::jsonb, updated_at = now() WHERE id = $1`,
    [review.id, finalStatus, riskLevel, JSON.stringify({
      decided_by: 'rating-rules',
      owner_handles: ownerHandles,
      threshold,
      rule_hits: reviewHits.map((h) => h.rule.name),
      decided_at: new Date().toISOString(),
    })]
  );

  // The alert itself. One open row per review, so re-running never stacks up
  // duplicates in the owner's list.
  let alertId = null;
  if (finalStatus === 'needs_reply') {
    const open = await db.query(
      `SELECT id FROM escalations WHERE review_id = $1 AND status IN ('open','acknowledged') LIMIT 1`,
      [review.id]
    );
    if (open.rows[0]) {
      alertId = open.rows[0].id;
    } else {
      const reasons = [];
      if (rating == null) reasons.push('No star rating — worth reading before it slips past');
      else reasons.push(`${rating}-star review`);
      for (const h of reviewHits) reasons.push(h.rule.name);
      if (responseStatus === 'blocked') reasons.push('Your auto-reply wording was held back by a compliance rule');

      const priority = (worst >= SEVERITY_RANK.warn || (rating != null && rating <= 2)) ? 'high' : 'normal';
      const ins = await db.query(
        `INSERT INTO escalations (business_id, review_id, reason, priority) VALUES ($1,$2,$3,$4) RETURNING id`,
        [business.id, review.id, reasons.join('; '), priority]
      );
      alertId = ins.rows[0].id;
    }
  }

  await log(db, business.id, review.id, actor, 'review.processed', {
    status: finalStatus, response_status: responseStatus, owner_handles: ownerHandles, alert: !!alertId,
  });

  return { reviewId: review.id, status: finalStatus, responseId, responseStatus, alertId, ownerHandles };
}

/**
 * Check a reply the owner wrote or edited themselves, before it is approved.
 * Records any rule hits against the response and returns them.
 */
export async function checkHumanReply(business, review, responseId, body) {
  const rules = await effectiveRules(business.id);
  const hits = runRegexRules(activeRules(rules, 'response'), body);

  await db.query(`DELETE FROM flags WHERE response_id = $1 AND status = 'open'`, [responseId]);
  for (const h of hits) {
    await db.query(
      `INSERT INTO flags (business_id, review_id, response_id, rule_id, rule_name, target, severity, detail)
       VALUES ($1,$2,$3,$4,$5,'response',$6,$7)`,
      [business.id, review.id, responseId, h.rule.id, h.rule.name, h.rule.severity, h.detail]
    );
  }
  return hits;
}