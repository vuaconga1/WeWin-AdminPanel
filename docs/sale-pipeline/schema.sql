CREATE TABLE IF NOT EXISTS wewin_sale_snapshot (
  branch text PRIMARY KEY CHECK (branch IN ('NTL','XVNT')),
  read_at timestamptz NOT NULL,
  payload jsonb NOT NULL
);
-- Run as the private backend table owner. Other database roles have no row policy.
ALTER TABLE wewin_sale_snapshot ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON wewin_sale_snapshot FROM PUBLIC;
