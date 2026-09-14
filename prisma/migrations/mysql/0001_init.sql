-- BRVM Analyzer — schéma MySQL 8 (db_bourse)

CREATE TABLE IF NOT EXISTS company (
  id            VARCHAR(64) PRIMARY KEY,
  symbol        VARCHAR(32) NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  sector        VARCHAR(128) NOT NULL,
  country       VARCHAR(64) NOT NULL,
  listing_date  DATETIME(3) NULL,
  status        VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS data_source (
  id                    VARCHAR(64) PRIMARY KEY,
  name                  VARCHAR(255) NOT NULL,
  type                  VARCHAR(64) NOT NULL,
  url                   TEXT NULL,
  priority              INT NOT NULL,
  active                BOOLEAN NOT NULL,
  last_successful_sync  DATETIME(3) NULL,
  last_failure          DATETIME(3) NULL,
  scraper_version       VARCHAR(64) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS data_source_failure (
  id         VARCHAR(64) PRIMARY KEY,
  source_id  VARCHAR(64) NOT NULL,
  timestamp  DATETIME(3) NOT NULL,
  error      TEXT NOT NULL,
  payload    TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS market_quote (
  id             VARCHAR(64) PRIMARY KEY,
  symbol         VARCHAR(32) NOT NULL,
  date           DATE NOT NULL,
  open           DOUBLE NOT NULL,
  high           DOUBLE NOT NULL,
  low            DOUBLE NOT NULL,
  close          DOUBLE NOT NULL,
  volume         DOUBLE NOT NULL,
  adjusted_close DOUBLE NOT NULL,
  source         VARCHAR(128) NOT NULL,
  source_type    VARCHAR(64) NOT NULL,
  source_url     TEXT NULL,
  retrieved_at   DATETIME(3) NOT NULL,
  reference_date DATE NULL,
  confidence     INT NOT NULL,
  UNIQUE KEY market_quote_symbol_date_uidx (symbol, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS market_quote_revision (
  id         VARCHAR(64) PRIMARY KEY,
  entity_id  VARCHAR(64) NOT NULL,
  previous   JSON NOT NULL,
  next       JSON NOT NULL,
  changed_at DATETIME(3) NOT NULL,
  reason     TEXT NULL,
  source     VARCHAR(128) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dividend (
  id                VARCHAR(64) PRIMARY KEY,
  company_id        VARCHAR(64) NOT NULL,
  symbol            VARCHAR(32) NOT NULL,
  exercise_year     INT NOT NULL,
  gross_amount      DOUBLE NOT NULL,
  net_amount        DOUBLE NOT NULL,
  currency          VARCHAR(8) NOT NULL DEFAULT 'XOF',
  announcement_date DATE NULL,
  payment_date      DATE NULL,
  source            VARCHAR(128) NOT NULL,
  source_type       VARCHAR(64) NOT NULL,
  source_url        TEXT NULL,
  retrieved_at      DATETIME(3) NOT NULL,
  confidence        INT NOT NULL,
  UNIQUE KEY dividend_symbol_year_uidx (symbol, exercise_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS dividend_revision (
  id         VARCHAR(64) PRIMARY KEY,
  entity_id  VARCHAR(64) NOT NULL,
  previous   JSON NOT NULL,
  next       JSON NOT NULL,
  changed_at DATETIME(3) NOT NULL,
  reason     TEXT NULL,
  source     VARCHAR(128) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS financial_statement (
  id                 VARCHAR(64) PRIMARY KEY,
  company_id         VARCHAR(64) NOT NULL,
  symbol             VARCHAR(32) NOT NULL,
  fiscal_year        INT NOT NULL,
  revenue            DOUBLE NULL,
  net_income         DOUBLE NULL,
  eps                DOUBLE NULL,
  roe                DOUBLE NULL,
  debt               DOUBLE NULL,
  equity             DOUBLE NULL,
  cash_flow          DOUBLE NULL,
  shares_outstanding DOUBLE NULL,
  source             VARCHAR(128) NOT NULL,
  source_type        VARCHAR(64) NOT NULL,
  source_url         TEXT NULL,
  retrieved_at       DATETIME(3) NOT NULL,
  confidence         INT NOT NULL,
  UNIQUE KEY financial_symbol_year_uidx (symbol, fiscal_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS financial_revision (
  id         VARCHAR(64) PRIMARY KEY,
  entity_id  VARCHAR(64) NOT NULL,
  previous   JSON NOT NULL,
  next       JSON NOT NULL,
  changed_at DATETIME(3) NOT NULL,
  reason     TEXT NULL,
  source     VARCHAR(128) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS analysis_result (
  id      VARCHAR(64) PRIMARY KEY,
  symbol  VARCHAR(32) NOT NULL,
  as_of   DATE NOT NULL,
  payload JSON NOT NULL,
  UNIQUE KEY analysis_symbol_asof_uidx (symbol, as_of)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS recommendation_snapshot (
  id                  VARCHAR(64) PRIMARY KEY,
  date                DATE NOT NULL,
  symbol              VARCHAR(32) NOT NULL,
  price               DOUBLE NOT NULL,
  score               INT NOT NULL,
  confidence          INT NOT NULL,
  data_quality        INT NOT NULL,
  intrinsic_value     DOUBLE NULL,
  margin_of_safety    DOUBLE NULL,
  status              VARCHAR(32) NOT NULL,
  rules_version       VARCHAR(64) NOT NULL,
  reasons             JSON NOT NULL,
  risks               JSON NOT NULL,
  target_price        DOUBLE NULL,
  ideal_entry_price   DOUBLE NULL,
  maximum_entry_price DOUBLE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ruleset (
  version    VARCHAR(64) PRIMARY KEY,
  params     JSON NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_account (
  id            VARCHAR(64) PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  name          VARCHAR(255) NOT NULL,
  role          VARCHAR(32) NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  ruleset       JSON NOT NULL,
  created_at    DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS auth_session (
  id         VARCHAR(64) PRIMARY KEY,
  user_id    VARCHAR(64) NOT NULL,
  token_hash VARCHAR(128) NOT NULL,
  expires_at DATETIME(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS alert (
  id             VARCHAR(64) PRIMARY KEY,
  user_id        VARCHAR(64) NOT NULL,
  symbol         VARCHAR(32) NULL,
  type           VARCHAR(64) NOT NULL,
  threshold      DOUBLE NULL,
  recommendation VARCHAR(64) NULL,
  active         BOOLEAN NOT NULL,
  note           TEXT NULL,
  created_at     DATETIME(3) NOT NULL,
  KEY alert_user_id_idx (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS scheduled_report (
  id      VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  run_at  DATETIME(3) NOT NULL,
  type    VARCHAR(64) NOT NULL,
  email   VARCHAR(255) NOT NULL,
  sent_at DATETIME(3) NULL,
  status  VARCHAR(32) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ingestion_run (
  id               VARCHAR(64) PRIMARY KEY,
  source           VARCHAR(128) NOT NULL,
  started_at       DATETIME(3) NOT NULL,
  finished_at      DATETIME(3) NULL,
  records_fetched  INT NOT NULL,
  records_inserted INT NOT NULL,
  records_rejected INT NOT NULL,
  errors           JSON NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS index_quote (
  id    VARCHAR(64) PRIMARY KEY,
  name  VARCHAR(128) NOT NULL,
  date  DATE NOT NULL,
  close DOUBLE NOT NULL,
  UNIQUE KEY index_quote_name_date_uidx (name, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS raw_document (
  id             VARCHAR(64) PRIMARY KEY,
  kind           VARCHAR(64) NOT NULL,
  source         VARCHAR(128) NOT NULL,
  fetched_at     DATETIME(3) NOT NULL,
  content_type   VARCHAR(128) NOT NULL,
  payload        LONGTEXT NOT NULL,
  parser_version VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS email_log (
  id      VARCHAR(64) PRIMARY KEY,
  sent_at DATETIME(3) NOT NULL,
  `to`    VARCHAR(255) NOT NULL,
  type    VARCHAR(64) NOT NULL,
  status  VARCHAR(32) NOT NULL,
  error   TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS performance_tracking (
  id              VARCHAR(64) PRIMARY KEY,
  symbol          VARCHAR(32) NOT NULL,
  snapshot_date   DATE NOT NULL,
  horizon_days    INT NOT NULL,
  price_return    DOUBLE NULL,
  dividend_return DOUBLE NULL,
  total_return    DOUBLE NULL,
  index_return    DOUBLE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS listing_snapshot (
  id           VARCHAR(64) PRIMARY KEY,
  as_of        DATE NOT NULL,
  retrieved_at DATETIME(3) NOT NULL,
  source       VARCHAR(128) NOT NULL,
  source_type  VARCHAR(64) NOT NULL,
  source_url   TEXT NULL,
  fingerprint  TEXT NOT NULL,
  changed      BOOLEAN NOT NULL,
  item_count   INT NOT NULL,
  KEY listing_snapshot_as_of_idx (as_of)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS listing_snapshot_item (
  id          VARCHAR(64) PRIMARY KEY,
  snapshot_id VARCHAR(64) NOT NULL,
  symbol      VARCHAR(32) NOT NULL,
  name        VARCHAR(255) NOT NULL,
  last_close  DOUBLE NULL,
  UNIQUE KEY listing_item_snapshot_symbol_uidx (snapshot_id, symbol),
  CONSTRAINT listing_item_snapshot_fk FOREIGN KEY (snapshot_id) REFERENCES listing_snapshot(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
