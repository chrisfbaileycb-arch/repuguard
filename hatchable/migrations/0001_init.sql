-- RepuGuard core schema

CREATE TABLE IF NOT EXISTS businesses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  industry      TEXT,
  website       TEXT,
  owner_user_id TEXT NOT NULL,
  ingest_token  TEXT NOT NULL UNIQUE,
  settings      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS business_members (
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'owner',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (business_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id);

CREATE TABLE IF NOT EXISTS connectors (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform       TEXT NOT NULL,
  external_ref   TEXT,
  status         TEXT NOT NULL DEFAULT 'not_configured',
  config         JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  last_error     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, platform)
);

CREATE TABLE IF NOT EXISTS reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL,
  external_id     TEXT NOT NULL,
  author_name     TEXT,
  rating          INTEGER CHECK (rating BETWEEN 1 AND 5),
  body            TEXT NOT NULL DEFAULT '',
  review_url      TEXT,
  reviewed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          TEXT NOT NULL DEFAULT 'new',
  sentiment       TEXT,
  sentiment_score NUMERIC(4,3),
  risk_level      TEXT,
  topics          JSONB NOT NULL DEFAULT '[]'::jsonb,
  analysis        JSONB NOT NULL DEFAULT '{}'::jsonb,
  source          TEXT NOT NULL DEFAULT 'manual',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, platform, external_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_business_created ON reviews(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_business_status ON reviews(business_id, status);

CREATE TABLE IF NOT EXISTS responses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  review_id    UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  body         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft',
  generated_by TEXT NOT NULL DEFAULT 'ai',
  model        TEXT,
  checks       JSONB NOT NULL DEFAULT '{}'::jsonb,
  approved_by  TEXT,
  approved_at  TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_responses_review ON responses(review_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_responses_business_status ON responses(business_id, status);

CREATE TABLE IF NOT EXISTS compliance_rules (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  kind        TEXT NOT NULL DEFAULT 'regex',
  pattern     TEXT,
  applies_to  TEXT NOT NULL DEFAULT 'response',
  severity    TEXT NOT NULL DEFAULT 'warn',
  action      TEXT NOT NULL DEFAULT 'flag',
  category    TEXT NOT NULL DEFAULT 'general',
  enabled     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rules_business ON compliance_rules(business_id);

CREATE TABLE IF NOT EXISTS rule_overrides (
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  rule_id     UUID NOT NULL REFERENCES compliance_rules(id) ON DELETE CASCADE,
  enabled     BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (business_id, rule_id)
);

CREATE TABLE IF NOT EXISTS flags (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  review_id   UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
  rule_id     UUID,
  rule_name   TEXT NOT NULL,
  target      TEXT NOT NULL DEFAULT 'review',
  severity    TEXT NOT NULL DEFAULT 'warn',
  detail      TEXT,
  status      TEXT NOT NULL DEFAULT 'open',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_flags_business_status ON flags(business_id, status);
CREATE INDEX IF NOT EXISTS idx_flags_review ON flags(review_id);

CREATE TABLE IF NOT EXISTS escalations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  review_id   UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  priority    TEXT NOT NULL DEFAULT 'normal',
  status      TEXT NOT NULL DEFAULT 'open',
  notified_at TIMESTAMPTZ,
  notify_error TEXT,
  resolved_by TEXT,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_escalations_business_status ON escalations(business_id, status);

CREATE TABLE IF NOT EXISTS activity_log (
  id          BIGSERIAL PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  review_id   UUID REFERENCES reviews(id) ON DELETE CASCADE,
  actor       TEXT NOT NULL DEFAULT 'system',
  action      TEXT NOT NULL,
  detail      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_business ON activity_log(business_id, created_at DESC);