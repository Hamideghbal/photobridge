ALTER TABLE users
  ADD COLUMN IF NOT EXISTS force_password_change boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS users_force_password_change_idx
  ON users(force_password_change)
  WHERE force_password_change = true;
