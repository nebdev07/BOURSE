CREATE TABLE IF NOT EXISTS portfolio_holding (
  id           VARCHAR(64) PRIMARY KEY,
  user_id      VARCHAR(64) NOT NULL,
  symbol       VARCHAR(32) NOT NULL,
  quantity     DOUBLE NOT NULL,
  avg_cost     DOUBLE NOT NULL,
  purchased_at DATE NULL,
  note         TEXT NULL,
  created_at   DATETIME(3) NOT NULL,
  updated_at   DATETIME(3) NOT NULL,
  KEY portfolio_holding_user_id_idx (user_id),
  UNIQUE KEY portfolio_holding_user_symbol_uidx (user_id, symbol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
