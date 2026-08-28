import { db, webhooks, config } from 'hatchable';
import { log } from 'lib/util.js';
import {
  mapStatus, toTimestamp, businessIdFor, claimEvent, activate, setStatus,
  isStaleEvent, markApplied,
} from 'lib/billing-events.js';

// The event types that move a business between billing states. Only these are
// order-sensitive, and only these are recorded as applied.
const HANDLED = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
  'invoice.payment_succeeded',
]);

// Senders have no session — the signature is the authentication.
export const access = 'public';
export const methods = ['POST'];

export default async function (req, res) {
  // A declared-but-unset secret makes config.get throw (gateway 412), it does
  // not return null. Treat both as "not configured" so the endpoint answers
  // 503 rather than a bare 500.
  let secret = null;
  try {
    secret = await config.get('STRIPE_WEBHOOK_SECRET');
  } catch (e) {
    secret = null;
  }
  if (!secret) {
    // Refuse rather than pretending to accept. Silently 200-ing an unverified
    // webhook would let anyone activate any subscription by POSTing here.
    console.error('STRIPE_WEBHOOK_SECRET is not set; rejecting webhook.');
    return res.status(503).json({ error: 'Webhook endpoint is not configured.' });
  }

  const parts = Object.fromEntries(
    (req.headers['stripe-signature'] || '')
      .split(',')
      .map((kv) => kv.split('=').map((s) => s.trim()))
  );

  // Verified against the exact signed bytes; re-serialising req.body would
  // change whitespace and key order and never match.
  let ok = false;
  try {
    ok = await webhooks.verifyHmac({
      raw: `${parts.t}.${req.rawBody}`,
      signature: parts.v1,
      secret,
      timestamp: parts.t,
    });
  } catch (e) {
    console.error('Webhook verification threw:', e.message);
  }
  if (!ok) return res.status(400).json({ error: 'Invalid signature.' });

  const event = req.body;
  const object = event?.data?.object || {};
  const businessId = await businessIdFor(object);

  // Unknown business: acknowledge so Stripe stops retrying, but do nothing.
  if (!businessId) {
    console.warn(`Stripe ${event.type}: no matching business.`);
    return res.json({ received: true, matched: false });
  }

  // Stripe retries; process each event id once.
  const fresh = await claimEvent(event, businessId);
  if (!fresh) return res.json({ received: true, duplicate: true });

  // Stripe also delivers out of order, which the id check does not cover. An
  // event created before one already applied is stale: acting on it would undo
  // a newer decision, e.g. reactivating an account that has since cancelled.
  if (HANDLED.has(event.type) && await isStaleEvent(businessId, event)) {
    console.warn(`Stripe ${event.type} ${event.id} is older than an event already applied; skipping.`);
    return res.json({ received: true, stale: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await activate(businessId, {
          plan: object.metadata?.plan,
          customerId: object.customer,
          subscriptionId: object.subscription,
        });
        await log(db, businessId, null, 'stripe', 'billing.activated', {
          plan: object.metadata?.plan || null,
        });
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const status = mapStatus(object.status);
        if (status === 'active') {
          await activate(businessId, {
            plan: object.metadata?.plan,
            customerId: object.customer,
            subscriptionId: object.id,
          });
        }
        await setStatus(businessId, status, toTimestamp(object.current_period_end));
        await log(db, businessId, null, 'stripe', 'billing.status_changed', { status });
        break;
      }

      case 'customer.subscription.deleted':
        await setStatus(businessId, 'canceled', toTimestamp(object.ended_at));
        await log(db, businessId, null, 'stripe', 'billing.canceled', {});
        break;

      case 'invoice.payment_failed':
        await setStatus(businessId, 'past_due', null);
        await log(db, businessId, null, 'stripe', 'billing.payment_failed', {
          invoice: object.id || null,
        });
        break;

      case 'invoice.payment_succeeded':
        await setStatus(businessId, 'active', toTimestamp(object.period_end));
        break;

      default:
        // Acknowledged and recorded, but not acted on.
        break;
    }
    if (HANDLED.has(event.type)) await markApplied(event.id);
  } catch (e) {
    console.error(`Webhook handler failed for ${event.type}:`, e.message);
    // 500 asks Stripe to retry. The billing_events row is already committed,
    // so remove it or the retry would be discarded as a duplicate.
    await db.query('DELETE FROM billing_events WHERE event_id = $1', [event.id]).catch(() => {});
    return res.status(500).json({ error: 'Handler failed.' });
  }

  return res.json({ received: true });
}