-- Sale Pipeline snapshots pushed by Apps Script (NTL / XVNT).
CREATE TABLE IF NOT EXISTS "wewin_sale_snapshot" (
  "branch" TEXT NOT NULL,
  "read_at" TIMESTAMPTZ NOT NULL,
  "payload" JSONB NOT NULL,
  CONSTRAINT "wewin_sale_snapshot_pkey" PRIMARY KEY ("branch"),
  CONSTRAINT "wewin_sale_snapshot_branch_check" CHECK ("branch" IN ('NTL', 'XVNT'))
);

ALTER TABLE "wewin_sale_snapshot" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "wewin_sale_snapshot" FROM PUBLIC;
