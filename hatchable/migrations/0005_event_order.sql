-- Stripe does not guarantee delivery order, and retries can arrive days after
-- the event was created. billing_events.event_id already makes replay safe —
-- the same event is never applied twice — but a unique id says nothing about
-- sequence. An invoice.payment_succeeded created before a
-- customer.subscription.deleted, but delivered after it, would set a cancelled
-- business back to active and re-entitle the account.
--
-- These two columns make the ordering decidable: event_created is Stripe's own
-- timestamp for the event, and applied_at marks the rows we actually acted on,
-- so an unhandled event type can never block a later real one.
ALTER TABLE billing_events ADD COLUMN IF NOT EXISTS event_created TIMESTAMPTZ;
ALTER TABLE billing_events ADD COLUMN IF NOT EXISTS applied_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_billing_events_order
  ON billing_events(business_id, event_created DESC)
  WHERE applied_at IS NOT NULL;