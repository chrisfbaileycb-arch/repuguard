import { requireBusiness } from 'lib/authz.js';
import { isEntitled } from 'lib/plans.js';

/**
 * Resolve a business the caller belongs to AND that has live billing.
 * Writes 402 and returns null when the subscription is not active, so the
 * frontend can send them to checkout.
 *
 * Read-only surfaces (the dashboard shell, billing status) deliberately do
 * NOT use this — a lapsed customer must still be able to sign in, see why
 * they are locked out, and pay.
 */
export async function requireEntitled(req, res, businessId, minRole = 'viewer') {
  const biz = await requireBusiness(req, res, businessId, minRole);
  if (!biz) return null;
  if (!isEntitled(biz)) {
    res.status(402).json({
      error: 'This business does not have an active subscription.',
      code: 'payment_required',
      billing_status: biz.billing_status || 'none',
    });
    return null;
  }
  return biz;
}