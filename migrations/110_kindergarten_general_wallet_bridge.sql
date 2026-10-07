CREATE TABLE IF NOT EXISTS kindergarten_wallet_gateway_payments (
  id text PRIMARY KEY,
  request_id text NOT NULL UNIQUE,
  external_kindergarten_id text NOT NULL,
  kindergarten_name text NOT NULL,
  manager_id text,
  manager_phone text,
  amount_toman bigint NOT NULL CHECK (amount_toman > 0),
  provider text NOT NULL DEFAULT 'zibal',
  status text NOT NULL DEFAULT 'payment_pending'
    CHECK (status IN ('payment_pending','payment_failed','paid','credit_pending','credited')),
  gateway_amount bigint NOT NULL CHECK (gateway_amount > 0),
  gateway_track_id text,
  gateway_ref_number text,
  gateway_result integer,
  gateway_message text,
  return_url text NOT NULL,
  webhook_attempts integer NOT NULL DEFAULT 0,
  webhook_last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz,
  credited_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_kindergarten_wallet_gateway_track
  ON kindergarten_wallet_gateway_payments(gateway_track_id)
  WHERE gateway_track_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kindergarten_wallet_gateway_status
  ON kindergarten_wallet_gateway_payments(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_kindergarten_wallet_gateway_kindergarten
  ON kindergarten_wallet_gateway_payments(external_kindergarten_id, created_at DESC);
