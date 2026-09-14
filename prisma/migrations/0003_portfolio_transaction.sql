CREATE TABLE IF NOT EXISTS portfolio_transaction (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  symbol      TEXT NOT NULL,
  side        TEXT NOT NULL,
  quantity    DOUBLE PRECISION NOT NULL,
  unit_price  DOUBLE PRECISION NOT NULL,
  traded_at   DATE,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS portfolio_transaction_user_id_idx ON portfolio_transaction (user_id);
CREATE INDEX IF NOT EXISTS portfolio_transaction_user_symbol_idx ON portfolio_transaction (user_id, symbol);
