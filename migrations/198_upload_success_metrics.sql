-- One durable success per order, committed atomically with its first 'sent' event.
-- No FK cascades: deleting operational order/file rows must not erase the totals.
CREATE TABLE IF NOT EXISTS upload_success_metrics (
  order_id uuid PRIMARY KEY,
  lab_id uuid NOT NULL,
  lab_name text NOT NULL,
  mode text NOT NULL,
  sent_at timestamptz NOT NULL,
  file_count bigint NOT NULL CHECK (file_count >= 0),
  original_bytes bigint NOT NULL CHECK (original_bytes >= 0),
  unknown_size_files bigint NOT NULL CHECK (unknown_size_files >= 0),
  historical_snapshot boolean NOT NULL DEFAULT false,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS upload_success_metrics_day_lab_idx ON upload_success_metrics(sent_at, lab_id);
CREATE OR REPLACE FUNCTION record_upload_success_metric() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'sent' THEN
    INSERT INTO upload_success_metrics(order_id,lab_id,lab_name,mode,sent_at,file_count,original_bytes,unknown_size_files)
    SELECT o.id,o.lab_id,l.name,o.mode,NEW.created_at,
      count(f.id),COALESCE(sum(GREATEST(f.bytes,0)),0),count(f.id) FILTER (WHERE f.bytes IS NULL)
    FROM orders o JOIN labs l ON l.id=o.lab_id
    LEFT JOIN order_files f ON f.order_id=o.id AND f.original_state IN ('active','ready_for_deletion','deleted')
    WHERE o.id=NEW.order_id
    GROUP BY o.id,o.lab_id,l.name,o.mode HAVING count(f.id)>0
    ON CONFLICT (order_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS upload_success_metric_trigger ON order_status_events;
CREATE TRIGGER upload_success_metric_trigger AFTER INSERT ON order_status_events
  FOR EACH ROW EXECUTE FUNCTION record_upload_success_metric();

-- Historical figures reflect surviving file metadata; explicitly label that limit.
INSERT INTO upload_success_metrics(order_id,lab_id,lab_name,mode,sent_at,file_count,original_bytes,unknown_size_files,historical_snapshot)
SELECT o.id,o.lab_id,l.name,o.mode,s.sent_at,
  count(f.id),COALESCE(sum(GREATEST(f.bytes,0)),0),count(f.id) FILTER (WHERE f.bytes IS NULL),true
FROM (SELECT order_id,min(created_at) sent_at FROM order_status_events WHERE status='sent' GROUP BY order_id) s
JOIN orders o ON o.id=s.order_id JOIN labs l ON l.id=o.lab_id
LEFT JOIN order_files f ON f.order_id=o.id AND f.original_state IN ('active','ready_for_deletion','deleted')
GROUP BY o.id,o.lab_id,l.name,o.mode,s.sent_at HAVING count(f.id)>0
ON CONFLICT (order_id) DO NOTHING;

-- Error records are mirrored here; the local outbox still works during DB outage.
CREATE TABLE IF NOT EXISTS application_error_incidents (
  id text PRIMARY KEY CHECK (id ~ '^PB-[A-F0-9]{16}$'),
  last_at timestamptz NOT NULL,
  payload jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS application_error_incidents_recent_idx ON application_error_incidents(last_at DESC);
