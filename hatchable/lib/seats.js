import { db } from 'hatchable';

// Three logins per account: the owner plus two more.
export const MAX_SEATS = 3;

export const ROLES = ['owner', 'manager', 'viewer'];

/** A seat is taken by someone who has signed in, or held by an unclaimed invite. */
export async function seatsUsed(businessId) {
  const r = await db.query(
    `SELECT (SELECT count(*)::int FROM business_members WHERE business_id = $1) AS members,
            (SELECT count(*)::int FROM business_invites WHERE business_id = $1) AS pending`,
    [businessId]
  );
  const { members, pending } = r.rows[0];
  return {
    members,
    pending,
    used: members + pending,
    remaining: Math.max(0, MAX_SEATS - members - pending),
    max: MAX_SEATS,
  };
}

/**
 * Turn any invites addressed to this user into real memberships.
 *
 * Called on every /api/me, which is what makes an invited person a member the
 * first time they sign in. The membership row is inserted by that user for
 * themselves, which is the only insert the write = "own" rule permits.
 *
 * Returns how many were claimed.
 */
export async function claimInvites(user) {
  const email = String(user.email || '').trim().toLowerCase();
  if (!email) return 0;

  const invites = await db.query(
    'SELECT * FROM business_invites WHERE lower(email) = $1',
    [email]
  );
  if (!invites.rows.length) return 0;

  let claimed = 0;
  for (const invite of invites.rows) {
    // Re-check the cap at claim time. Between invite and sign-in the owner may
    // have filled the seats another way, and the invite must not overfill them.
    const seats = await db.query(
      'SELECT count(*)::int AS n FROM business_members WHERE business_id = $1',
      [invite.business_id]
    );
    if (seats.rows[0].n >= MAX_SEATS) continue;

    const role = ROLES.includes(invite.role) && invite.role !== 'owner' ? invite.role : 'manager';
    await db.query(
      `INSERT INTO business_members (business_id, user_id, role)
       VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
      [invite.business_id, String(user.id), role]
    );
    await db.query('DELETE FROM business_invites WHERE id = $1', [invite.id]);
    claimed++;
  }
  return claimed;
}