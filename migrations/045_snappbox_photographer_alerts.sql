-- PhotoBridge v0.17.41 — SnappBox payer responsibility + photographer courier alerts

ALTER TABLE order_courier_shipments
  ADD COLUMN IF NOT EXISTS payer text NOT NULL DEFAULT 'lab',
  ADD COLUMN IF NOT EXISTS provider_payment_type text NOT NULL DEFAULT 'prepaid',
  ADD COLUMN IF NOT EXISTS driver_name text,
  ADD COLUMN IF NOT EXISTS driver_phone text,
  ADD COLUMN IF NOT EXISTS vehicle_plate text,
  ADD COLUMN IF NOT EXISTS driver_image_url text,
  ADD COLUMN IF NOT EXISTS driver_details_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS photographer_alert_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS photographer_alert_ack_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='order_courier_shipments_payer_chk'
  ) THEN
    ALTER TABLE order_courier_shipments
      ADD CONSTRAINT order_courier_shipments_payer_chk CHECK (payer IN ('lab','photographer'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS order_courier_shipments_active_alert_idx
  ON order_courier_shipments(lab_id, photographer_alert_ack_at, updated_at DESC)
  WHERE provider='snappbox' AND provider_order_id IS NOT NULL;
