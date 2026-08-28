import { db } from 'hatchable';
import { requireBusiness } from 'lib/authz.js';
import { clampInt, isUuid, log } from 'lib/util.js';

export const access = 'user';
export const methods = ['GET', 'POST'];

export default async function (req, res) {
  // Everyone on the account sees the alerts — that is the point of the three
  // logins: the owner, a manager and, say, a partner all watching for the bad
  // ones. But clearing an alert says "this has been handled", so it takes a
  // manager. A viewer looks; they do not mark someone else's work done.
  const biz = await requireBusiness(req, res, req.params.id, req.method === 'GET' ? 'viewer' : 'manager');
  if (!biz) return;

  if (req.method === 'GET') {
    const limit = clampInt(req.query.limit, 1, 100, 25);
    const { rows } = await db.query(
      `SELECT e.id, e.reason, e.priority, e.status, e.created_at, e.resolved_at, e.notified_at,
              r.id AS review_id, r.platform, r.rating, r.author_name, left(r.body, 240) AS excerpt
         FROM escalations e JOIN reviews r ON r.id = e.review_id
        WHERE e.business_id = $1
        ORDER BY (e.status IN ('open','acknowledged')) DESC, e.created_at DESC
        LIMIT $2`,
      [biz.id, limit]
    );
    return res.json({ escalations: rows });
  }

  // POST { escalation_id, action: 'acknowledge' | 'resolve' }
  const { escalation_id: escalationId, action } = req.body || {};
  if (!isUuid(escalationId)) return res.status(400).json({ error: 'escalation_id is required' });
  if (!['acknowledge', 'resolve'].includes(action)) {
    return res.status(400).json({ error: "action must be 'acknowledge' or 'resolve'" });
  }

  const status = action === 'resolve' ? 'resolved' : 'acknowledged';
  const actor = req.user.email || req.user.id;

  const upd = await db.query(
    `UPDATE escalations
        SET status = $3,
            resolved_by = CASE WHEN $3 = 'resolved' THEN $4 ELSE resolved_by END,
            resolved_at = CASE WHEN $3 = 'resolved' THEN now() ELSE resolved_at END
      WHERE id = $1 AND business_id = $2
      RETURNING id, status`,
    [escalationId, biz.id, status, actor]
  );
  if (!upd.rows[0]) return res.status(404).json({ error: 'Escalation not found' });

  await log(db, biz.id, null, actor, `escalation.${action}d`, { escalation_id: escalationId });
  res.json({ ok: true, status: upd.rows[0].status });
}