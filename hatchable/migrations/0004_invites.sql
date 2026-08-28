-- Three logins per account.
--
-- The owner cannot insert a business_members row for someone else: that table
-- is declared write = "own", so Postgres only accepts a row whose user_id is
-- the caller. An invite is therefore recorded here by email, and the member
-- row is created by the invited person themselves on their first sign-in.
--
-- That ordering is also better behaviour: a seat is only truly consumed by
-- someone who turned up, and a typo can be withdrawn before it costs anything.

CREATE TABLE IF NOT EXISTS business_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'manager',
  invited_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, email)
);

-- Claiming looks an invite up by email alone, across businesses.
CREATE INDEX IF NOT EXISTS idx_business_invites_email ON business_invites(email);