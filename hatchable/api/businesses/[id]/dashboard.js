import { db } from 'hatchable';
import { requireBusiness } from 'lib/authz.js';

export const access = 'user';
export const methods = ['GET'];

export default async function (req, res) {
  const biz = await requireBusiness(req, res, req.params.id);
  if (!biz) return;
  const id = biz.id;

  const [totals, byStatus, byPlatform, queue, escalations, flags, recent, trend] = await Promise.all([
    db.query(`SELECT count(*)::int AS reviews, round(avg(rating)::numeric, 2) AS avg_rating,
                     count(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS last_30,
                     round(avg(rating) FILTER (WHERE created_at > now() - interval '30 days')::numeric, 2) AS avg_30
                FROM reviews WHERE business_id = $1`, [id]),
    db.query(`SELECT status, count(*)::int AS n FROM reviews WHERE business_id = $1 GROUP BY status`, [id]),
    db.query(`SELECT platform, count(*)::int AS n, round(avg(rating)::numeric, 2) AS avg_rating FROM reviews WHERE business_id = $1 GROUP BY platform ORDER BY n DESC`, [id]),
    db.query(`SELECT count(*)::int AS n FROM responses WHERE business_id = $1 AND status IN ('draft','blocked')`, [id]),
    db.query(`SELECT count(*)::int AS n FROM escalations WHERE business_id = $1 AND status = 'open'`, [id]),
    db.query(`SELECT severity, count(*)::int AS n FROM flags WHERE business_id = $1 AND status = 'open' GROUP BY severity`, [id]),
    db.query(`SELECT r.id, r.platform, r.author_name, r.rating, left(r.body, 160) AS excerpt, r.status, r.risk_level, r.sentiment, r.reviewed_at
                FROM reviews r WHERE r.business_id = $1 ORDER BY r.created_at DESC LIMIT 8`, [id]),
    db.query(`SELECT to_char(date_trunc('week', reviewed_at), 'YYYY-MM-DD') AS week, count(*)::int AS n, round(avg(rating)::numeric, 2) AS avg_rating
                FROM reviews WHERE business_id = $1 AND reviewed_at > now() - interval '12 weeks'
               GROUP BY 1 ORDER BY 1`, [id]),
  ]);

  const ratingDist = await db.query(`SELECT rating, count(*)::int AS n FROM reviews WHERE business_id = $1 AND rating IS NOT NULL GROUP BY rating ORDER BY rating`, [id]);

  // How much of what is on screen is placeholder. The frontend uses this to
  // label the numbers as sample and to drop that label the moment the count
  // reaches zero — which happens on its own when real reviews arrive.
  const sample = await db.query(
    `SELECT count(*)::int AS n FROM reviews WHERE business_id = $1 AND source = 'sample'`,
    [id]
  );

  // The reviews the owner has to answer personally: everything at or below
  // their threshold, plus anything that arrived with no rating at all.
  const needsReply = await db.query(
    `SELECT r.id, r.platform, r.author_name, r.rating, r.body, r.reviewed_at, r.risk_level,
            e.id AS alert_id, e.reason, e.priority, e.status AS alert_status,
            (SELECT count(*)::int FROM flags f WHERE f.review_id = r.id AND f.status = 'open') AS flags
       FROM reviews r
       JOIN escalations e ON e.review_id = r.id AND e.status IN ('open','acknowledged')
      WHERE r.business_id = $1
      ORDER BY (e.priority = 'high') DESC, r.reviewed_at DESC
      LIMIT 25`,
    [id]
  );

  res.json({
    sample_reviews: sample.rows[0].n,
    is_sample_only: sample.rows[0].n > 0 && sample.rows[0].n === Number(totals.rows[0].reviews),
    needs_reply: needsReply.rows,
    needs_reply_count: needsReply.rows.filter((r) => r.alert_status === 'open').length,
    totals: totals.rows[0],
    by_status: Object.fromEntries(byStatus.rows.map(r => [r.status, r.n])),
    by_platform: byPlatform.rows,
    rating_distribution: Object.fromEntries([1, 2, 3, 4, 5].map(n => [n, 0]).concat(ratingDist.rows.map(r => [r.rating, r.n]))),
    approval_queue: queue.rows[0].n,
    open_escalations: escalations.rows[0].n,
    open_flags: Object.fromEntries(flags.rows.map(r => [r.severity, r.n])),
    recent: recent.rows,
    trend: trend.rows,
  });
}