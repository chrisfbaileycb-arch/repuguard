// An app answers on its {slug}.hatchable.site subdomain and on any custom
// domain the owner adds later. Deriving the origin from the request keeps
// Stripe's success/cancel redirects on whichever host the customer actually
// used, instead of bouncing them to a different one mid-checkout.
export function originOf(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').split(',')[0].trim();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  return host ? `${proto}://${host}` : '';
}