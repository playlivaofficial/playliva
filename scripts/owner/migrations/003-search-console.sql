-- Additive SEO storage, separate from owner sessions, videos and affiliate events.
CREATE TABLE IF NOT EXISTS playliva_owner.seo_state (
  scope text PRIMARY KEY, revision integer NOT NULL DEFAULT 0, document jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS playliva_owner.search_daily (
  scope text NOT NULL, day date NOT NULL, grain text NOT NULL, dimension_key text NOT NULL,
  fact jsonb NOT NULL, PRIMARY KEY(scope, day, grain, dimension_key)
);
CREATE TABLE IF NOT EXISTS playliva_owner.search_runs (
  scope text NOT NULL, day date NOT NULL, document jsonb NOT NULL, PRIMARY KEY(scope, day)
);
INSERT INTO playliva_owner.schema_migrations(version) VALUES (3) ON CONFLICT DO NOTHING;
