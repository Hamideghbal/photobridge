-- PhotoBridge v0.10.6 — tracked chassis/frame inventory and frame option
ALTER TABLE lab_prices ADD COLUMN IF NOT EXISTS chassis_stock integer;
ALTER TABLE lab_prices ADD COLUMN IF NOT EXISTS frame bigint;
ALTER TABLE lab_prices ADD COLUMN IF NOT EXISTS frame_stock integer;
ALTER TABLE order_files ADD COLUMN IF NOT EXISTS frame boolean NOT NULL DEFAULT false;

-- NULL stock means inventory tracking has not been enabled for that item yet.
-- 0 means unavailable, positive values are decremented atomically when an order is submitted.
