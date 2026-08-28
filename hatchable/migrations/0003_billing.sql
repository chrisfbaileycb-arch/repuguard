-- Subscription billing for RepuGuard.
-- Ported from the RepuShield Express app, which kept plan and Stripe state on
-- its users table. Here the subscription belongs to the BUSINESS, not the
-- person: a user may own several businesses and each is billed separately.

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS commitment_start TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS commitment_end TIMESTAMPTZ;

-- billing_status values: none | pending | active | past_due | canceled
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer ON businesses(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_subscription ON businesses(stripe_subscription_id);

-- Every Stripe event we act on, recorded once. Stripe retries deliveries and
-- can deliver out of order, so the unique event_id is what makes replay safe.
CREATE TABLE IF NOT EXISTS billing_events (
  id           BIGSERIAL PRIMARY KEY,
  event_id     TEXT NOT NULL UNIQUE,
  event_type   TEXT NOT NULL,
  business_id  UUID REFERENCES businesses(id) ON DELETE SET NULL,
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_billing_events_business ON billing_events(business_id, created_at DESC);