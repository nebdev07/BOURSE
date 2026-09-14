CREATE TABLE IF NOT EXISTS portfolio_transaction (
  id          VARCHAR(64) PRIMARY KEY,
  user_id     VARCHAR(64) NOT NULL,
  symbol      VARCHAR(32) NOT NULL,
  side        VARCHAR(8) NOT NULL,
  quantity    DOUBLE NOT NULL,
  unit_price  DOUBLE NOT NULL,
  traded_at   DATE NULL,
  note        TEXT NULL,
  created_at  DATETIME(3) NOT NULL,
  KEY portfolio_transaction_user_id_idx (user_id),
  KEY portfolio_transaction_user_symbol_idx (user_id, symbol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
