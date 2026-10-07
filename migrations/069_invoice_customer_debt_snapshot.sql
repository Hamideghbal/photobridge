-- PhotoBridge v0.17.291 — stable customer debt snapshot on issued invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS account_balance_at_issue bigint;
