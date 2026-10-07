-- PhotoBridge v0.17.667 — durable first-invitation origin for photographer lab discovery scope

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS photographer_origin_invite_type text;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_photographer_origin_invite_type_check;
ALTER TABLE users ADD CONSTRAINT users_photographer_origin_invite_type_check
  CHECK (photographer_origin_invite_type IS NULL OR photographer_origin_invite_type IN ('admin','lab','photographer','rental'));

-- Backfill only invitation events that coincide with creation of the photographer role.
-- A later lab invitation accepted by an already-existing photographer must not turn that
-- account into a lab-scoped account.
WITH candidates AS (
  SELECT r.user_id,
         i.issuer_type::text AS origin_type,
         r.redeemed_at AS event_at,
         1 AS priority
  FROM photographer_invite_redemptions r
  JOIN photographer_invites i ON i.id=r.invite_id
  JOIN users u ON u.id=r.user_id
  WHERE u.photographer_enabled=true
    AND i.issuer_type IN ('admin','lab','photographer','rental')
    AND lower(COALESCE(r.metadata->>'wasPhotographer','false')) NOT IN ('true','1','yes')
    AND (u.photographer_joined_at IS NULL OR r.redeemed_at<=u.photographer_joined_at+interval '15 minutes')

  UNION ALL

  SELECT u.id,
         'lab'::text,
         a.created_at,
         2
  FROM audit_log a
  JOIN users u ON u.id::text=a.entity_id::text
  WHERE u.photographer_enabled=true
    AND a.entity_type='user'
    AND a.entity_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND a.action='invitation.register'
    AND a.lab_id IS NOT NULL
    AND lower(COALESCE(a.data->>'reusedExistingCustomer','false')) NOT IN ('true','1','yes')
    AND (u.photographer_joined_at IS NULL OR a.created_at<=u.photographer_joined_at+interval '15 minutes')

  UNION ALL

  SELECT u.id,
         CASE WHEN a.data->>'issuerType' IN ('admin','lab','photographer','rental') THEN a.data->>'issuerType'
              WHEN a.lab_id IS NOT NULL THEN 'lab' ELSE NULL END,
         a.created_at,
         3
  FROM audit_log a
  JOIN users u ON u.id::text=a.entity_id::text
  WHERE u.photographer_enabled=true
    AND a.entity_type='user'
    AND a.entity_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND a.action='photographer.invite_redeem'
    AND lower(COALESCE(a.data->>'reusedExisting','false')) NOT IN ('true','1','yes')
    AND (u.photographer_joined_at IS NULL OR a.created_at<=u.photographer_joined_at+interval '15 minutes')
), ranked AS (
  SELECT user_id,origin_type,
         row_number() OVER (PARTITION BY user_id ORDER BY event_at ASC,priority ASC) AS rn
  FROM candidates
  WHERE origin_type IN ('admin','lab','photographer','rental')
)
UPDATE users u
SET photographer_origin_invite_type=r.origin_type,
    updated_at=now()
FROM ranked r
WHERE r.user_id=u.id AND r.rn=1 AND u.photographer_origin_invite_type IS NULL;

CREATE INDEX IF NOT EXISTS users_photographer_origin_invite_type_idx
  ON users(photographer_origin_invite_type)
  WHERE photographer_enabled=true;
