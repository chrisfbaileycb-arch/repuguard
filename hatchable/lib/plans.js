// Plan catalogue — the single source of truth shared by the API and the UI.
// Ported from src/constants/plans.js in the RepuShield repo.
//
// Stripe price IDs are NOT hardcoded here. In the Express app they had baked-in
// fallbacks that belonged to one specific Stripe account, which silently
// pointed checkout at the wrong account and failed with "No such price".
// They come from [[secret]] values the owner pastes, resolved at request time.

export const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 69,
    secret: 'STRIPE_PRICE_BASIC',
    popular: false,
    features: [
      'Up to 50 reviews/mo',
      'Google + Yelp monitoring',
      'Automatic thank-you replies',
      'In-app notifications',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 109,
    secret: 'STRIPE_PRICE_GROWTH',
    popular: true,
    features: [
      'Up to 150 reviews/mo',
      'Everything in Basic',
      'Compliance scanning',
      'Violation flagging',
      'Priority escalation',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 179,
    secret: 'STRIPE_PRICE_PRO',
    popular: false,
    features: [
      'Unlimited reviews',
      'Everything in Growth',
      'Dedicated account manager',
      'Custom response templates',
      'Monthly strategy call',
    ],
  },
];

export const PLAN_IDS = PLANS.map((p) => p.id);

export function planById(id) {
  return PLANS.find((p) => p.id === id) || null;
}

// The 6-month minimum commitment the signup flow asks customers to agree to.
export const COMMITMENT_MONTHS = 6;

// A business may use the app when billing is active. 'past_due' keeps access
// while Stripe retries the card — cutting a paying customer off on the first
// failed retry loses more than it protects.
export const ACTIVE_BILLING_STATUSES = ['active', 'past_due'];

export function isEntitled(business) {
  return ACTIVE_BILLING_STATUSES.includes(business?.billing_status);
}