-- PhotoBridge v0.17.638 — isolate photographer identity from public/retouch identity

CREATE TABLE IF NOT EXISTS photographer_profiles (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  studio_name text NOT NULL,
  password_hash text NOT NULL,
  province text,
  city text,
  location_lat double precision,
  location_lng double precision,
  location_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS photographer_profiles_studio_name_idx ON photographer_profiles(lower(studio_name));

-- Existing photographers keep their current photographer credentials/name as a role-specific profile.
INSERT INTO photographer_profiles(user_id,studio_name,password_hash,location_lat,location_lng,location_address,created_at,updated_at)
SELECT u.id,COALESCE(NULLIF(btrim(u.name),''),'عکاسی'),u.password_hash,u.location_lat,u.location_lng,u.location_address,
       COALESCE(u.photographer_joined_at,u.created_at,now()),now()
FROM users u
WHERE u.photographer_enabled=true
ON CONFLICT(user_id) DO UPDATE SET
  studio_name=COALESCE(NULLIF(btrim(photographer_profiles.studio_name),''),EXCLUDED.studio_name),
  password_hash=COALESCE(NULLIF(photographer_profiles.password_hash,''),EXCLUDED.password_hash),
  location_lat=COALESCE(photographer_profiles.location_lat,EXCLUDED.location_lat),
  location_lng=COALESCE(photographer_profiles.location_lng,EXCLUDED.location_lng),
  location_address=COALESCE(NULLIF(photographer_profiles.location_address,''),EXCLUDED.location_address),
  updated_at=now();

-- Every photographer owns an internal standalone membership. A lab/store relationship is additional,
-- so suspending/removing one relationship can never disable the photographer portal globally.
INSERT INTO labs(name,slug,active,active_from,active_until,timezone,resolution_min,resolution_max,resolution_target,service_only)
SELECT 'PhotoBridge · عکاسان مستقل','photobridge-standalone-photographers',true,now(),NULL,'Asia/Tehran',240,360,300,true
WHERE NOT EXISTS (SELECT 1 FROM labs WHERE service_only=true OR slug='photobridge-standalone-photographers');

UPDATE labs
SET service_only=true,active=true,active_from=COALESCE(active_from,now()),active_until=NULL,updated_at=now()
WHERE slug='photobridge-standalone-photographers';

INSERT INTO lab_memberships(lab_id,user_id,role,active)
SELECT l.id,u.id,'customer',true
FROM users u
CROSS JOIN LATERAL (
  SELECT id FROM labs WHERE service_only=true OR slug='photobridge-standalone-photographers'
  ORDER BY (slug='photobridge-standalone-photographers') DESC,created_at LIMIT 1
) l
WHERE u.photographer_enabled=true AND u.account_deleted_at IS NULL
ON CONFLICT(lab_id,user_id) DO UPDATE SET role='customer',active=true;

-- Repair only broken active pointers. Prefer a usable real lab, otherwise the internal standalone lab.
UPDATE users u
SET photographer_active_lab_id=COALESCE(
  (
    SELECT m.lab_id FROM lab_memberships m JOIN labs l ON l.id=m.lab_id
    WHERE m.user_id=u.id AND m.role='customer' AND m.active=true AND l.service_only=false
      AND l.active=true AND (l.active_from IS NULL OR l.active_from<=now()) AND (l.active_until IS NULL OR l.active_until>=now())
    ORDER BY m.created_at LIMIT 1
  ),
  (
    SELECT m.lab_id FROM lab_memberships m JOIN labs l ON l.id=m.lab_id
    WHERE m.user_id=u.id AND m.role='customer' AND m.active=true AND l.service_only=true
    ORDER BY m.created_at LIMIT 1
  )
),updated_at=now()
WHERE u.photographer_enabled=true
  AND (
    u.photographer_active_lab_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM lab_memberships m JOIN labs l ON l.id=m.lab_id
      WHERE m.user_id=u.id AND m.lab_id=u.photographer_active_lab_id AND m.role='customer' AND m.active=true
        AND (l.service_only=true OR (l.active=true AND (l.active_from IS NULL OR l.active_from<=now()) AND (l.active_until IS NULL OR l.active_until>=now())))
    )
  );

-- Legacy admin photographer suspension used to set users.active=false, which unintentionally disabled
-- public-retouch/other roles on the same identity. Convert only those identifiable legacy suspensions
-- into photographer-role suspension while restoring the shared identity.
UPDATE users
SET photographer_enabled=false,
    active=true,
    account_suspended_at=NULL,
    account_suspended_by=NULL,
    updated_at=now()
WHERE photographer_enabled=true
  AND active=false
  AND account_suspended_at IS NOT NULL
  AND account_deleted_at IS NULL;
