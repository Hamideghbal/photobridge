-- PhotoBridge v0.17.307
-- Admin-level suspension and safe account deletion for photographer accounts.

ALTER TABLE users ADD COLUMN IF NOT EXISTS account_suspended_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_suspended_by uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_deleted_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_deleted_by uuid REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_account_deleted_idx ON users(account_deleted_at) WHERE account_deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_account_suspended_idx ON users(account_suspended_at) WHERE account_suspended_at IS NOT NULL;
