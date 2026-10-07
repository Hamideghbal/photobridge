-- PhotoBridge v0.17.27
-- Finalize photographer client galleries as pay-as-you-go instead of prototype/trial access.

ALTER TABLE photographer_gallery_access
  ALTER COLUMN plan_code SET DEFAULT 'payg',
  ALTER COLUMN plan_status SET DEFAULT 'active';

UPDATE photographer_gallery_access
SET plan_code='payg', plan_status='active', enabled=true, updated_at=now()
WHERE plan_code='prototype' OR plan_status='trial';
