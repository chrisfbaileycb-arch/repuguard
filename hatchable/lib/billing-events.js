import { db } from 'hatchable';
import { COMMITMENT_MONTHS } from 'lib/plans.js';

// Stripe subscription status -> our billing_status.
// 'past_due' deliberately keeps the customer entitled while Stripe retries the
// card; cutting a paying customer off on the first failed retry loses more
// than it protects. See ACTIVE_BILLING_STATUSES in lib/plans.js.
export function mapStatus(stripeStatus) {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'canceled';
    default:
      return 'pending';
  }
}

export function toTimestamp(unixSeconds) {
  return unixSeconds ? new Date(unixSeconds * 1000).toISOString() : null;
}

export function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString();
}

// Resolve which business an event belongs to. Metadata is the happy path;
// the id lookups cover events Stripe sends without it (invoice failures).
export async function businessIdFor(object) {
  if (object?.metadata?.business_id) return object.metadata.business_id;

  if (object?.customer) {
    const r = await db.query(
      'SELECT id FROM businesses WHERE stripe_customer_id = $1 LIMIT 1',
      [object.customer]
    );
    if (r.rows[0]) return r.rows[0].id;
  }
  if (object?.subscription) {
    const r = await db.query(
      'SELECT id FROM businesses WHERE stripe_subscription_id = $1 LIMIT 1',
      [object.subscription]
    );
    if (r.rows[0]) return r.rows[0].id;
  }
  return null;
}

// Records the event and returns false if we have already processed this
// event id. Stripe retries deliveries, so every handler must be replay-safe.
export async function claimEvent(event, businessId) {
  const r = await db.query(
    `INSERT INTO billing_events (event_id, event_type, business_id, payload, event_created)
     VALUES ($1, $2, $3, $4::jsonb, $5)
     ON CONFLICT (event_id) DO NOTHING
     RETURNING id`,
    [event.id, event.type, businessId, JSON.stringify({ type: event.type, created: event.created }),
     toTimestamp(event.created)]
  );
  return r.rows.length > 0;
}

// Replay-safety and ordering are different problems. claimEvent solves the
// first: the same event id is never applied twice. This solves the second.
//
// Stripe delivers out of order and retries for days, so an older event can
// land after a newer one. If customer.subscription.deleted has already
// cancelled a business, a stale invoice.payment_succeeded arriving afterwards
// carries a fresh event id, passes the duplicate check, and would set the
// account back to active — re-entitling somebody who cancelled.
//
// Compared only against events we actually applied, so an unhandled type
// cannot block a later real one.
export async function isStaleEvent(businessId, event) {
  if (!event?.created) return false;
  const r = await db.query(
    `SELECT max(event_created) AS newest FROM billing_events
      WHERE business_id = $1 AND applied_at IS NOT NULL AND event_id <> $2`,
    [businessId, event.id]
  );
  const newest = r.rows[0]?.newest;
  if (!newest) return false;
  return new Date(event.created * 1000) < new Date(newest);
}

// Marks an event as one whose effect is now reflected in the business row.
// Only these rows take part in the ordering comparison above.
export async function markApplied(eventId) {
  await db.query(
    'UPDATE billing_events SET applied_at = now() WHERE event_id = $1',
    [eventId]
  );
}

export async function activate(businessId, { plan, customerId, subscriptionId }) {
  // commitment_start is set once, on the first activation, so a later plan
  // change does not silently restart the customer's 6-month commitment.
  await db.query(
    `UPDATE businesses
        SET plan = COALESCE($2, plan),
            billing_status = 'active',
            stripe_customer_id = COALESCE($3, stripe_customer_id),
            stripe_subscription_id = COALESCE($4, stripe_subscription_id),
            commitment_start = COALESCE(commitment_start, now()),
            commitment_end = COALESCE(commitment_end, now() + ($5 || ' months')::interval),
            updated_at = now()
      WHERE id = $1`,
    [businessId, plan || null, customerId || null, subscriptionId || null, String(COMMITMENT_MONTHS)]
  );
}

export async function setStatus(businessId, status, periodEnd) {
  await db.query(
    `UPDATE businesses
        SET billing_status = $2,
            current_period_end = COALESCE($3, current_period_end),
            updated_at = now()
      WHERE id = $1`,
    [businessId, status, periodEnd || null]
  );
}