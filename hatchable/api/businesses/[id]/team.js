import { db } from 'hatchable';
import { requireBusiness } from 'lib/authz.js';
import { seatsUsed, MAX_SEATS, ROLES } from 'lib/seats.js';
import { isUuid, log } from 'lib/util.js';

export const access = 'user';
export const methods = ['GET', 'POST', 'DELETE'];

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Up to three people per account. Anyone on the team can see who is on it;
// only the owner can change it.
export default async function (req, res) {
  const biz = await requireBusiness(req, res, req.params.id, req.method === 'GET' ? 'viewer' : 'owner');
  if (!biz) return;

  if (req.method === 'GET') {
    const [members, invites, seats] = await Promise.all([
      db.query(
        `SELECT user_id, role, created_at FROM business_members
          WHERE business_id = $1 ORDER BY created_at`,
        [biz.id]
      ),
      db.query(
        `SELECT id, email, role, created_at FROM business_invites
          WHERE business_id = $1 ORDER BY created_at`,
        [biz.id]
      ),
      seatsUsed(biz.id),
    ]);

    return res.json({
      seats,
      // The owner sees who holds each seat; everyone else sees the shape of the
      // team without other people's ids.
      members: members.rows.map((m) => ({
        role: m.role,
        joined: m.created_at,
        is_you: String(m.user_id) === String(req.user.id),
        user_id: biz.role === 'owner' ? m.user_id : undefined,
      })),
      invites: invites.rows,
    });
  }

  if (req.method === 'POST') {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const role = ROLES.includes(req.body?.role) && req.body.role !== 'owner' ? req.body.role : 'manager';

    if (!EMAIL.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (email === String(req.user.email || '').toLowerCase()) {
      return res.status(400).json({ error: 'You are already on this account.' });
    }

    const seats = await seatsUsed(biz.id);
    if (seats.remaining <= 0) {
      return res.status(409).json({
        error: `This account is limited to ${MAX_SEATS} logins. Remove someone first.`,
        code: 'seat_limit',
        seats,
      });
    }

    await db.query(
      `INSERT INTO business_invites (business_id, email, role, invited_by)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (business_id, email) DO UPDATE SET role = EXCLUDED.role`,
      [biz.id, email, role, req.user.email || req.user.id]
    );
    await log(db, biz.id, null, req.user.email, 'team.invited', { role });

    return res.status(201).json({
      ok: true,
      // There is no invitation email: they sign in at the normal page with this
      // address and the account is simply there.
      instructions: `Ask them to sign in with ${email}. They will have access straight away.`,
      seats: await seatsUsed(biz.id),
    });
  }

  // DELETE — withdraw a pending invite, or remove a member.
  const { invite_id: inviteId, user_id: userId } = req.body || {};

  if (inviteId) {
    if (!isUuid(inviteId)) return res.status(400).json({ error: 'Unknown invite.' });
    const del = await db.query(
      'DELETE FROM business_invites WHERE id = $1 AND business_id = $2 RETURNING id',
      [inviteId, biz.id]
    );
    if (!del.rows.length) return res.status(404).json({ error: 'Unknown invite.' });
    await log(db, biz.id, null, req.user.email, 'team.invite_withdrawn', {});
    return res.json({ ok: true, seats: await seatsUsed(biz.id) });
  }

  if (!userId) return res.status(400).json({ error: 'Pass invite_id or user_id.' });
  if (String(userId) === String(req.user.id)) {
    return res.status(400).json({ error: 'You cannot remove yourself from your own account.' });
  }

  const del = await db.query(
    `DELETE FROM business_members
      WHERE business_id = $1 AND user_id = $2 AND role <> 'owner' RETURNING user_id`,
    [biz.id, String(userId)]
  );
  if (!del.rows.length) return res.status(404).json({ error: 'Not on this account, or is the owner.' });

  await log(db, biz.id, null, req.user.email, 'team.removed', {});
  res.json({ ok: true, seats: await seatsUsed(biz.id) });
}