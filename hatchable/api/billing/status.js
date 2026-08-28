import { requireBusiness } from 'lib/authz.js';
import { PLANS, planById, isEntitled, COMMITMENT_MONTHS } from 'lib/plans.js';

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

  const plan = planById(biz.plan);

  res.json({
    business_id: biz.id,
    plan: biz.plan,
    plan_name: plan ? plan.name : null,
    plan_price: plan ? plan.price : null,
    status: biz.billing_status || 'none',
    entitled: isEntitled(biz),
    customer_id: biz.stripe_customer_id,
    subscription_id: biz.stripe_subscription_id,
    current_period_end: biz.current_period_end,
    commitment_start: biz.commitment_start,
    commitment_end: biz.commitment_end,
    commitment_months: COMMITMENT_MONTHS,
    catalogue: PLANS.map(({ secret, ...rest }) => rest),
  });
}