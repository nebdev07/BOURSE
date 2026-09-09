-- BRVM Analyzer — schéma PostgreSQL (aligné prisma/schema.prisma)

CREATE TABLE IF NOT EXISTS company (
  id            TEXT PRIMARY KEY,
  symbol        TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  sector        TEXT NOT NULL,
  country       TEXT NOT NULL,
  listing_date  TIMESTAMPTZ,
  status        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS data_source (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  type                  TEXT NOT NULL,
  url                   TEXT,
  priority              INT NOT NULL,
  active                BOOLEAN NOT NULL,
  last_successful_sync  TIMESTAMPTZ,
  last_failure          TIMESTAMPTZ,
  scraper_version       TEXT
);

CREATE TABLE IF NOT EXISTS data_source_failure (
  id         TEXT PRIMARY KEY,
  source_id  TEXT NOT NULL,
  timestamp  TIMESTAMPTZ NOT NULL,
  error      TEXT NOT NULL,
  payload    TEXT
);

CREATE TABLE IF NOT EXISTS market_quote (
  id             TEXT PRIMARY KEY,
  symbol         TEXT NOT NULL,
  date           DATE NOT NULL,
  open           DOUBLE PRECISION NOT NULL,
  high           DOUBLE PRECISION NOT NULL,
  low            DOUBLE PRECISION NOT NULL,
  close          DOUBLE PRECISION NOT NULL,
  volume         DOUBLE PRECISION NOT NULL,
  adjusted_close DOUBLE PRECISION NOT NULL,
  source         TEXT NOT NULL,
  source_type    TEXT NOT NULL,
  source_url     TEXT,
  retrieved_at   TIMESTAMPTZ NOT NULL,
  reference_date DATE,
  confidence     INT NOT NULL,
  UNIQUE (symbol, date)
);

CREATE TABLE IF NOT EXISTS market_quote_revision (
  id         TEXT PRIMARY KEY,
  entity_id  TEXT NOT NULL,
  previous   JSONB NOT NULL,
  next       JSONB NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL,
  reason     TEXT,
  source     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dividend (
  id                TEXT PRIMARY KEY,
  company_id        TEXT NOT NULL,
  symbol            TEXT NOT NULL,
  exercise_year     INT NOT NULL,
  gross_amount      DOUBLE PRECISION NOT NULL,
  net_amount        DOUBLE PRECISION NOT NULL,
  currency          TEXT NOT NULL DEFAULT 'XOF',
  announcement_date DATE,
  payment_date      DATE,
  source            TEXT NOT NULL,
  source_type       TEXT NOT NULL,
  source_url        TEXT,
  retrieved_at      TIMESTAMPTZ NOT NULL,
  confidence        INT NOT NULL,
  UNIQUE (symbol, exercise_year)
);

CREATE TABLE IF NOT EXISTS dividend_revision (
  id         TEXT PRIMARY KEY,
  entity_id  TEXT NOT NULL,
  previous   JSONB NOT NULL,
  next       JSONB NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL,
  reason     TEXT,
  source     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS financial_statement (
  id                 TEXT PRIMARY KEY,
  company_id         TEXT NOT NULL,
  symbol             TEXT NOT NULL,
  fiscal_year        INT NOT NULL,
  revenue            DOUBLE PRECISION,
  net_income         DOUBLE PRECISION,
  eps                DOUBLE PRECISION,
  roe                DOUBLE PRECISION,
  debt               DOUBLE PRECISION,
  equity             DOUBLE PRECISION,
  cash_flow          DOUBLE PRECISION,
  shares_outstanding DOUBLE PRECISION,
  source             TEXT NOT NULL,
  source_type        TEXT NOT NULL,
  source_url         TEXT,
  retrieved_at       TIMESTAMPTZ NOT NULL,
  confidence         INT NOT NULL,
  UNIQUE (symbol, fiscal_year)
);

CREATE TABLE IF NOT EXISTS financial_revision (
  id         TEXT PRIMARY KEY,
  entity_id  TEXT NOT NULL,
  previous   JSONB NOT NULL,
  next       JSONB NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL,
  reason     TEXT,
  source     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS analysis_result (
  id      TEXT PRIMARY KEY,
  symbol  TEXT NOT NULL,
  as_of   DATE NOT NULL,
  payload JSONB NOT NULL,
  UNIQUE (symbol, as_of)
);

CREATE TABLE IF NOT EXISTS recommendation_snapshot (
  id                  TEXT PRIMARY KEY,
  date                DATE NOT NULL,
  symbol              TEXT NOT NULL,
  price               DOUBLE PRECISION NOT NULL,
  score               INT NOT NULL,
  confidence          INT NOT NULL,
  data_quality        INT NOT NULL,
  intrinsic_value     DOUBLE PRECISION,
  margin_of_safety    DOUBLE PRECISION,
  status              TEXT NOT NULL,
  rules_version       TEXT NOT NULL,
  reasons             JSONB NOT NULL,
  risks               JSONB NOT NULL,
  target_price        DOUBLE PRECISION,
  ideal_entry_price   DOUBLE PRECISION,
  maximum_entry_price DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS ruleset (
  version    TEXT PRIMARY KEY,
  params     JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "user_account" (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  ruleset       JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_session (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS alert (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  symbol         TEXT,
  type           TEXT NOT NULL,
  threshold      DOUBLE PRECISION,
  recommendation TEXT,
  active         BOOLEAN NOT NULL,
  note           TEXT,
  created_at     TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS alert_user_id_idx ON alert (user_id);

CREATE TABLE IF NOT EXISTS scheduled_report (
  id      TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  run_at  TIMESTAMPTZ NOT NULL,
  type    TEXT NOT NULL,
  email   TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  status  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingestion_run (
  id               TEXT PRIMARY KEY,
  source           TEXT NOT NULL,
  started_at       TIMESTAMPTZ NOT NULL,
  finished_at      TIMESTAMPTZ,
  records_fetched  INT NOT NULL,
  records_inserted INT NOT NULL,
  records_rejected INT NOT NULL,
  errors           JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS index_quote (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  date  DATE NOT NULL,
  close DOUBLE PRECISION NOT NULL,
  UNIQUE (name, date)
);

CREATE TABLE IF NOT EXISTS raw_document (
  id             TEXT PRIMARY KEY,
  kind           TEXT NOT NULL,
  source         TEXT NOT NULL,
  fetched_at     TIMESTAMPTZ NOT NULL,
  content_type   TEXT NOT NULL,
  payload        TEXT NOT NULL,
  parser_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_log (
  id      TEXT PRIMARY KEY,
  sent_at TIMESTAMPTZ NOT NULL,
  "to"    TEXT NOT NULL,
  type    TEXT NOT NULL,
  status  TEXT NOT NULL,
  error   TEXT
);

CREATE TABLE IF NOT EXISTS performance_tracking (
  id              TEXT PRIMARY KEY,
  symbol          TEXT NOT NULL,
  snapshot_date   DATE NOT NULL,
  horizon_days    INT NOT NULL,
  price_return    DOUBLE PRECISION,
  dividend_return DOUBLE PRECISION,
  total_return    DOUBLE PRECISION,
  index_return    DOUBLE PRECISION
);

CREATE TABLE IF NOT EXISTS listing_snapshot (
  id           TEXT PRIMARY KEY,
  as_of        DATE NOT NULL,
  retrieved_at TIMESTAMPTZ NOT NULL,
  source       TEXT NOT NULL,
  source_type  TEXT NOT NULL,
  source_url   TEXT,
  fingerprint  TEXT NOT NULL,
  changed      BOOLEAN NOT NULL,
  item_count   INT NOT NULL
);

CREATE TABLE IF NOT EXISTS listing_snapshot_item (
  id          TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES listing_snapshot(id) ON DELETE CASCADE,
  symbol      TEXT NOT NULL,
  name        TEXT NOT NULL,
  last_close  DOUBLE PRECISION,
  UNIQUE (snapshot_id, symbol)
);

CREATE INDEX IF NOT EXISTS listing_snapshot_as_of_idx ON listing_snapshot (as_of DESC);
