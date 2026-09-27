-- Consented, anonymous event counts in the existing isolated PlayLiva database.
CREATE TABLE IF NOT EXISTS playliva_owner.event_sources (
  scope text PRIMARY KEY, started_at timestamptz NOT NULL DEFAULT now(), pruned_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS playliva_owner.event_receipts (
  scope text NOT NULL, id uuid NOT NULL, received_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(scope, id)
);
CREATE INDEX IF NOT EXISTS event_receipts_age ON playliva_owner.event_receipts(received_at);
CREATE TABLE IF NOT EXISTS playliva_owner.event_daily (
  scope text NOT NULL, day date NOT NULL, dimension_key text NOT NULL,
  dimensions jsonb NOT NULL, count bigint NOT NULL DEFAULT 1 CHECK(count > 0),
  PRIMARY KEY(scope, day, dimension_key)
);
CREATE TABLE IF NOT EXISTS playliva_owner.event_budget (
  scope text NOT NULL, day date NOT NULL, attempts integer NOT NULL DEFAULT 1,
  PRIMARY KEY(scope, day)
);
INSERT INTO playliva_owner.schema_migrations(version) VALUES (2) ON CONFLICT DO NOTHING;
