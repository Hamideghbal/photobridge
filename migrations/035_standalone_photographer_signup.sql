ALTER TABLE labs ADD COLUMN IF NOT EXISTS service_only boolean NOT NULL DEFAULT false;

INSERT INTO labs(name,slug,active,active_from,active_until,timezone,resolution_min,resolution_max,resolution_target,service_only)
SELECT 'PhotoBridge · عکاسان مستقل','photobridge-standalone-photographers',true,now(),NULL,'Asia/Tehran',240,360,300,true
WHERE NOT EXISTS (SELECT 1 FROM labs WHERE service_only=true OR slug='photobridge-standalone-photographers');

UPDATE labs SET service_only=true WHERE slug='photobridge-standalone-photographers';
CREATE INDEX IF NOT EXISTS labs_service_only_idx ON labs(service_only);
