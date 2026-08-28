import { db } from 'hatchable';
import { requireEntitled } from 'lib/entitle.js';
import { checkHumanReply } from 'lib/pipeline.js';
import { isUuid, log } from 'lib/util.js';

export const access = 'user';
export const methods = ['POST'];

// Approve, edit, or reject a drafted reply.
// Body: { action: 'approve' | 'edit' | 'reject' | 'publish', body?: string }
export default async function (req, res) {
  const biz = await requireEntitled(req, res, req.params.id, 'manager');
  if (!biz) return;

  const responseId = req.params.responseId;
  if (!isUuid(responseId)) return res.status(404).json({ error: 'Response not found' });

  const r = await db.query(
    `SELECT resp.*, rv.id AS review_id
       FROM responses resp JOIN reviews rv ON rv.id = resp.review_id
      WHERE resp.id = $1 AND resp.business_id = $2`,
    [responseId, biz.id]
  );
  const response = r.rows[0];
  if (!response) return res.status(404).json({ error: 'Response not found' });

  const action = req.body?.action;
  const actor = req.user.email || req.user.id;

  if (action === 'reject') {
    await db.query(
      `UPDATE responses SET status = 'rejected', updated_at = now() WHERE id = $1`,
      [responseId]
    );
    await log(db, biz.id, response.review_id, actor, 'response.rejected', {});
    return res.json({ ok: true, status: 'rejected' });
  }

  if (action === 'edit' || action === 'approve') {
    let body = response.body;

    if (action === 'edit') {
      const edited = String(req.body?.body || '').trim();
      if (edited.length < 2) return res.status(400).json({ error: 'Reply text is required' });
      if (edited.length > 4000) return res.status(400).json({ error: 'Reply is too long' });
      body = edited;
      await db.query(
        `UPDATE responses SET body = $2, generated_by = 'human', updated_at = now() WHERE id = $1`,
        [responseId, body]
      );
    }

    // Re-run compliance on whatever is about to be approved. An edited reply
    // has never been checked, and approving without re-checking is exactly how
    // a non-compliant reply reaches a public review page.
    const review = await db.query('SELECT * FROM reviews WHERE id = $1', [response.review_id]);
    const hits = await checkHumanReply(biz, review.rows[0], responseId, body);
    const blocking = hits.filter((h) => h.rule.severity === 'block');

    if (blocking.length) {
      await db.query(`UPDATE responses SET status = 'blocked', updated_at = now() WHERE id = $1`, [responseId]);
      return res.status(422).json({
        error: 'This reply violates a blocking compliance rule.',
        code: 'compliance_blocked',
        violations: blocking.map((h) => ({ rule: h.rule.name, detail: h.detail })),
      });
    }

    if (action === 'approve') {
      await db.query(
        `UPDATE responses SET status = 'approved', approved_by = $2, approved_at = now(), updated_at = now() WHERE id = $1`,
        [responseId, actor]
      );
      await db.query(`UPDATE reviews SET status = 'approved', updated_at = now() WHERE id = $1`, [response.review_id]);
      await log(db, biz.id, response.review_id, actor, 'response.approved', {});
      return res.json({ ok: true, status: 'approved', warnings: hits.map((h) => h.rule.name) });
    }

    return res.json({ ok: true, status: 'draft', warnings: hits.map((h) => h.rule.name) });
  }

  if (action === 'publish') {
    if (response.status !== 'approved') {
      return res.status(409).json({ error: 'Approve the reply before publishing it.' });
    }
    // Posting back to Google/Yelp needs write credentials the connectors do
    // not have yet, so this records the decision rather than pretending the
    // reply went live on the platform.
    await db.query(
      `UPDATE responses SET status = 'published', published_at = now(), updated_at = now() WHERE id = $1`,
      [responseId]
    );
    await db.query(`UPDATE reviews SET status = 'published', updated_at = now() WHERE id = $1`, [response.review_id]);
    await log(db, biz.id, response.review_id, actor, 'response.published', { note: 'marked published in RepuGuard' });
    return res.json({ ok: true, status: 'published', posted_to_platform: false });
  }

  return res.status(400).json({ error: "action must be one of: approve, edit, reject, publish" });
}