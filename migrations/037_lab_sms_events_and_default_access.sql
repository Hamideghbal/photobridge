-- PhotoBridge v0.17.26 — lab-controlled customer SMS events + default access

-- Customer SMS is now available to labs by default; platform admin can still disable it later per lab if needed.
ALTER TABLE labs
  ALTER COLUMN sms_customer_notifications_allowed SET DEFAULT true;

UPDATE labs
SET sms_customer_notifications_allowed=true
WHERE sms_customer_notifications_allowed=false;

ALTER TABLE lab_sms_settings
  ADD COLUMN IF NOT EXISTS order_submitted_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS order_received_enabled boolean NOT NULL DEFAULT false;
