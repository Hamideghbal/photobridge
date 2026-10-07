ALTER TABLE labs ADD COLUMN IF NOT EXISTS province text;
ALTER TABLE labs ADD COLUMN IF NOT EXISTS city text;

CREATE INDEX IF NOT EXISTS idx_labs_province_city ON labs(province, city);
