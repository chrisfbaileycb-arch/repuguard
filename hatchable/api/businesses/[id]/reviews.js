import { db } from 'hatchable';
import { requireBusiness } from 'lib/authz.js';
import { clampInt, PLATFORMS } from 'lib/util.js';

export const access = 'user';
export const methods = ['GET'];

const STATUSES = ['new', 'pending', 'approved', 'escalated', 'published', 'archived'];

export default async function (req, res) {
  const biz = await requireBusiness(req, res, req.params.id);
  if (!biz) return;

  const where = ['r.business_id = $1'];
  const params = [biz.id];

  if (req.query.platform && PLATFORMS.includes(req.query.platform)) {
    params.push(req.query.platform);
    where.push(`r.platform = $${params.length}`);
  }
  if (req.query.status && STATUSES.includes(req.query.status)) {
    params.push(req.query.status);
    where.push(`r.status = $${params.length}`);
  }
  if (req.query.rating) {
    const rating = clampInt(req.query.rating, 1, 5, null);
    if (rating) {
      params.push(rating);
      where.push(`r.rating = $${params.length}`);
    }
  }

  const limit = clampInt(req.query.limit, 1, 100, 50);
  params.push(limit);

  const { rows } = await db.query(
    `SELECT r.id, r.platform, r.external_id, r.author_name, r.rating, r.body,
            r.review_url, r.reviewed_at, r.status, r.sentiment, r.sentiment_score,
            r.risk_level, r.topics, r.analysis, r.created_at,
            resp.id AS response_id, resp.body AS response_body, resp.status AS response_status,
            (SELECT count(*)::int FROM flags f WHERE f.review_id = r.id AND f.status = 'open') AS open_flags
       FROM reviews r
       LEFT JOIN LATERAL (
         SELECT id, body, status FROM responses
          WHERE review_id = r.id AND status <> 'superseded'
          ORDER BY created_at DESC LIMIT 1
       ) resp ON true
      WHERE ${where.join(' AND ')}
      ORDER BY r.reviewed_at DESC
      LIMIT $${params.length}`,
    params
  );

  res.json({ reviews: rows });
}