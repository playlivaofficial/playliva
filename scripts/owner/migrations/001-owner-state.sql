-- Isolated PlayLiva schema. Never reads or changes another product's tables.
CREATE SCHEMA IF NOT EXISTS playliva_owner;
CREATE TABLE IF NOT EXISTS playliva_owner.schema_migrations (
  version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS playliva_owner.state (
  id text PRIMARY KEY CHECK (id ~ '^owner(-[a-z0-9-]+)?$'),
  revision bigint NOT NULL DEFAULT 0,
  document jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO playliva_owner.schema_migrations(version) VALUES (1) ON CONFLICT DO NOTHING;
