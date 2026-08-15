// Single source of truth for plan data — imported everywhere
export const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 69,
    popular: false,
    features: ['Up to 50 reviews/mo', 'Google + Yelp monitoring', 'Auto-responses', 'In-app notifications']
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 109,
    popular: true,
    features: ['Up to 150 reviews/mo', 'Everything in Basic', 'Compliance scanning', 'Violation flagging', 'Priority escalation']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 179,
    popular: false,
    features: ['Unlimited reviews', 'Everything in Growth', 'Dedicated account manager', 'Custom response templates', 'Monthly strategy call']
  }
]

export const PLAN_PRICES = { basic: 69, growth: 109, pro: 179 }
export const PLAN_NAMES = { basic: 'Basic', growth: 'Growth', pro: 'Pro' }
