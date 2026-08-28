// One plan, one price, one location.
//
// RepuShield used to list three tiers at $69/$109/$179, separated by review
// volume and by features. Neither separation existed in the code: no route
// ever counted a customer's reviews, and nothing was gated on the plan name.
// The tiers were a price list the product did not implement.
//
// So there is one plan. A business pays $49 a month and gets all of it. An
// owner with several locations signs each one up separately at the same rate,
// which is why no volume tier is needed to express it.
export const PLAN = {
  id: 'standard',
  name: 'Single location',
  price: 49,
  tagline: 'Everything, for one location.',
  features: [
    'One business location',
    'No monthly review limit',
    'Automatic thank-you replies at 4 stars and up',
    'Three stars and below go to you, never auto-answered',
    'Compliance checks on every reply before it posts',
    'Up to 3 logins — you, plus a manager or two',
  ]
}

// The marketing and signup pages render a grid, so they keep a list to map
// over. It has one entry.
export const PLANS = [PLAN]
