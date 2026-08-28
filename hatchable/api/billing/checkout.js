import { config } from 'hatchable';
import { requireBusiness } from 'lib/authz.js';
import { PLAN } from 'lib/plans.js';
import { createCheckoutSession, StripeNotConfigured, StripeError } from 'lib/stripe.js';
import { originOf } from 'lib/urls.js';

export const access = 'user';
export const methods = ['POST'];

export default async function (req, res) {
  const { business_id: businessId } = req.body || {};

  // There is only one plan, so there is nothing to choose and nothing to
  // validate. A `plan` in the body is ignored rather than rejected: old
  // links like /app.html?plan=growth still lead somewhere sensible.
  const plan = PLAN;

  // Only an owner of the business may start a subscription for it.
  const biz = await requireBusiness(req, res, businessId, 'owner');
  if (!biz) return;

  if (biz.billing_status === 'active') {
    return res.status(409).json({ error: 'This business already has an active subscription.' });
  }

  let priceId;
  try {
    priceId = await config.get(plan.secret);
  } catch {
    priceId = null;
  }
  if (!priceId) {
    return res.status(503).json({
      error: `The ${plan.name} plan is not connected to Stripe yet.`,
      code: 'price_not_configured',
      missing: plan.secret,
    });
  }

  const origin = originOf(req);

  try {
    const session = await createCheckoutSession(
      {
        mode: 'subscription',
        customer_email: req.user.email,
        line_items: [{ price: priceId, quantity: 1 }],
        allow_promotion_codes: true,
        // Carried on both the session and the subscription so every webhook
        // that arrives later can be traced back to this business.
        metadata: { business_id: biz.id, plan: plan.id, user_id: req.user.id },
        subscription_data: {
          metadata: { business_id: biz.id, plan: plan.id, user_id: req.user.id },
        },
        success_url: `${origin}/app.html?business=${biz.id}&payment=success`,
        cancel_url: `${origin}/app.html?business=${biz.id}&payment=cancelled`,
      },
      // One in-flight checkout per business; a double-click replays rather
      // than opening a second subscription.
      `checkout:${biz.id}:${plan.id}`
    );

    return res.json({ url: session.url, session_id: session.id });
  } catch (e) {
    if (e instanceof StripeNotConfigured) {
      return res.status(503).json({ error: 'Payments are not set up yet.', code: 'stripe_not_configured', missing: e.which });
    }
    if (e instanceof StripeError) {
      console.error('Stripe checkout failed:', e.code, e.message);
      return res.status(502).json({ error: 'Could not start checkout. Please try again.', code: e.code || 'stripe_error' });
    }
    console.error('Checkout error:', e.message);
    return res.status(500).json({ error: 'Could not start checkout.' });
  }
}