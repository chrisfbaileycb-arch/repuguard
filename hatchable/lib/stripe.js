import { config } from 'hatchable';

// The `stripe` npm package cannot be installed on this runtime, so we talk to
// the REST API directly. That also sidesteps the bug the Express app had, where
// the client pinned an apiVersion the installed SDK did not recognise and every
// call failed: here we simply do not send the header, and Stripe uses the
// account's own default API version.

const API = 'https://api.stripe.com/v1';

export class StripeNotConfigured extends Error {
  constructor(which) {
    super(`Stripe is not configured: ${which} has not been set.`);
    this.name = 'StripeNotConfigured';
    this.which = which;
  }
}

export class StripeError extends Error {
  constructor(message, status, code) {
    super(message);
    this.name = 'StripeError';
    this.status = status;
    this.code = code;
  }
}

export async function secretKey() {
  // config.get throws (gateway 412) when a declared secret has never been set,
  // rather than returning null. Both mean the same thing here.
  let key = null;
  try {
    key = await config.get('STRIPE_SECRET_KEY');
  } catch (e) {
    key = null;
  }
  if (!key) throw new StripeNotConfigured('STRIPE_SECRET_KEY');
  return key;
}

// Stripe takes form-encoded bodies and expresses nesting with bracket notation:
//   { line_items: [{ price: 'x', quantity: 1 }] }
//     -> line_items[0][price]=x&line_items[0][quantity]=1
export function toForm(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (item !== null && typeof item === 'object') toForm(item, `${key}[${i}]`, out);
        else out.append(`${key}[${i}]`, String(item));
      });
    } else if (typeof v === 'object') {
      toForm(v, key, out);
    } else {
      out.append(key, String(v));
    }
  }
  return out;
}

async function call(method, path, params, opts = {}) {
  const key = await secretKey();
  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  // Makes a retried POST safe to replay: Stripe returns the original result
  // rather than creating a second subscription.
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey;

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: method === 'GET' ? undefined : toForm(params || {}).toString(),
    signal: AbortSignal.timeout(20000),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = json.error || {};
    throw new StripeError(e.message || `Stripe request failed (${res.status})`, res.status, e.code);
  }
  return json;
}

export function createCheckoutSession(params, idempotencyKey) {
  return call('POST', '/checkout/sessions', params, { idempotencyKey });
}

export function getSubscription(id) {
  return call('GET', `/subscriptions/${encodeURIComponent(id)}`);
}

export function createBillingPortalSession(params) {
  return call('POST', '/billing_portal/sessions', params);
}