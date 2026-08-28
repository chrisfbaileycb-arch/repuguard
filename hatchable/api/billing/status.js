import { requireBusiness } from 'lib/authz.js';
import { PLAN, isEntitled, COMMITMENT_MONTHS } from 'lib/plans.js';

export const access = 'user';
export const methods = ['GET'];

// The frontend gate reads this before deciding whether to show the dashboard
// or the payment wall. In the Express app the equivalent check trusted a value
// cached in localStorage, so a customer returning from Stripe Checkout — whose
// account the webhook had already activated — was bounced back to the payment
// page forever. The gate must ask the server.
export default async function (req, res) {
  const biz = await requireBusiness(req, res, req.query.business_id);
  if (!biz) return;

  res.json({
    business_id: biz.id,
    // There is one plan, so what a business is "on" is never in question. The
    // stored biz.plan is kept for the record but is not what the UI reads.
    plan: PLAN.id,
    plan_name: PLAN.name,
    plan_price: PLAN.price,
    status: biz.billing_status || 'none',
    entitled: isEntitled(biz),
    customer_id: biz.stripe_customer_id,
    subscription_id: biz.stripe_subscription_id,
    current_period_end: biz.current_period_end,
    commitment_start: biz.commitment_start,
    commitment_end: biz.commitment_end,
    commitment_months: COMMITMENT_MONTHS,
    // The price the payment wall quotes, minus the Stripe secret name.
    plan_detail: { id: PLAN.id, name: PLAN.name, price: PLAN.price,
                   tagline: PLAN.tagline, features: PLAN.features },
  });
}