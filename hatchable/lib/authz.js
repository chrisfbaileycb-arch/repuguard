import { db } from 'hatchable';
import { isUuid } from 'lib/util.js';

/**
 * Resolve a business the signed-in end user belongs to. Writes 404/403 and returns null on failure.
 * Roles: owner > manager > viewer.
 */
export async function requireBusiness(req, res, businessId, minRole = 'viewer') {
  if (!isUuid(businessId)) { res.status(404).json({ error: 'Business not found' }); return null; }
  const r = await db.query(
    `SELECT b.*, m.role FROM businesses b
       JOIN business_members m ON m.business_id = b.id
      WHERE b.id = $1 AND m.user_id = $2`,
    [businessId, req.user.id]
  );
  const biz = r.rows[0];
  if (!biz) { res.status(404).json({ error: 'Business not found' }); return null; }
  const rank = { viewer: 0, manager: 1, owner: 2 };
  if ((rank[biz.role] ?? 0) < (rank[minRole] ?? 0)) {
    res.status(403).json({ error: 'Insufficient role' });
    return null;
  }
  return biz;
}

export async function listBusinessesFor(userId) {
  const r = await db.query(
    `SELECT b.id, b.name, b.industry, b.website, b.created_at, m.role
       FROM businesses b JOIN business_members m ON m.business_id = b.id
      WHERE m.user_id = $1 ORDER BY b.created_at ASC`,
    [userId]
  );
  return r.rows;
}