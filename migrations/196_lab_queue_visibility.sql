-- R1921: hide a legacy order from the lab work queue without deleting the order,
-- issued invoice, payments, status history, photos, or other accounting records.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS lab_queue_hidden_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_orders_lab_queue_newest ON orders(lab_id,mode,created_at DESC,id DESC)
 WHERE lab_queue_hidden_at IS NULL AND status NOT IN ('uploading','cancelled');
