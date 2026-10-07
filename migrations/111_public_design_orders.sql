-- PhotoBridge v0.17.574: public album / Instagram design orders
CREATE TABLE IF NOT EXISTS public_design_orders (
  id uuid PRIMARY KEY,
  access_token text NOT NULL UNIQUE,
  service_key text NOT NULL,
  amount_toman bigint NOT NULL DEFAULT 0,
  gateway_amount bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'awaiting_payment',
  payment_provider text,
  payment_track_id text,
  payment_ref_number text,
  payment_result integer,
  payment_message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  payment_requested_at timestamptz,
  callback_at timestamptz,
  paid_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS public_design_orders_track_idx ON public_design_orders(payment_track_id) WHERE payment_track_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS public_design_orders_created_idx ON public_design_orders(created_at DESC);
