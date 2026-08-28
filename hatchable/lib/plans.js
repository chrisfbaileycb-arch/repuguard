// One plan, one price, one location.
//
// RepuGuard used to sell three tiers at $69/$109/$179, gated on review volume
// and on features. Neither gate ever existed in code: no route counted a
// business's reviews, and compliance scanning ran for everybody regardless of
// what they paid. The tiers were a price list the product did not implement.
//
// So there is one plan now. A business pays $49 a month and gets all of it.
// An owner with three shops subscribes each one separately at the same rate —
// billing is per business, not per account, which is why no volume tier is
// needed to express it.
//
// The Stripe price ID is NOT hardcoded. It comes from a [[secret]] the owner
// pastes into the Hatchable console, resolved at request time. A baked-in ID
// belongs to whichever Stripe account created it, so a fallback would silently
// point checkout at the wrong account and fail with "No such price".

export const PLAN = {
  id: 'standard',
  name: 'Single location',
  price: 49,
  secret: 'STRIPE_PRICE_STANDARD',
  tagline: 'Everything, for one location.',
  features: [
    'One business location',
    'No monthly review limit',
    'Automatic thank-you replies at 4 stars and up',
    'Three stars and below go to you, never auto-answered',
    'Compliance checks on every reply before it posts',
    'Up to 3 logins — you, plus a manager or two',
  ],
};

// The 6-month minimum commitment the signup flow asks customers to agree to.
export const COMMITMENT_MONTHS = 6;

// A business may use the app when billing is active. 'past_due' keeps access
// while Stripe retries the card — cutting a paying customer off on the first
// failed retry loses more than it protects.
export const ACTIVE_BILLING_STATUSES = ['active', 'past_due'];

export function isEntitled(business) {
  return ACTIVE_BILLING_STATUSES.includes(business?.billing_status);
}