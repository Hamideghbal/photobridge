-- PhotoBridge v0.17.53 — web panel presence for single-source print alerts
ALTER TABLE lab_print_alert_agents
  ADD COLUMN IF NOT EXISTS web_panel_last_seen_at timestamptz;
CREATE INDEX IF NOT EXISTS lab_print_alert_agents_web_presence_idx
  ON lab_print_alert_agents(web_panel_last_seen_at DESC);
