import { listBusinessesFor } from 'lib/authz.js';
import { claimInvites } from 'lib/seats.js';

export const access = 'user';
export const methods = ['GET'];

export default async function (req, res) {
  // An invite is stored against an email address; it becomes a real membership
  // here, the first time that person signs in. It has to happen on their own
  // request because business_members is write = "own" — nobody can create a
  // membership row on someone else's behalf.
  let claimed = 0;
  try {
    claimed = await claimInvites(req.user);
  } catch (e) {
    // A failed claim must not block sign-in; they simply see no businesses yet
    // and it retries on the next load.
    console.error('claimInvites failed', e.message);
  }

  const businesses = await listBusinessesFor(req.user.id);
  res.json({
    user: { id: req.user.id, email: req.user.email, name: req.user.name || null },
    businesses,
    joined: claimed,
  });
}