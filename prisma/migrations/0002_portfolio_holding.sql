CREATE TABLE IF NOT EXISTS portfolio_holding (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  symbol       TEXT NOT NULL,
  quantity     DOUBLE PRECISION NOT NULL,
  avg_cost     DOUBLE PRECISION NOT NULL,
  purchased_at DATE,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS portfolio_holding_user_id_idx ON portfolio_holding (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS portfolio_holding_user_symbol_uidx ON portfolio_holding (user_id, symbol);
