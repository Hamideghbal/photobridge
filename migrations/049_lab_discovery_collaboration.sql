-- PhotoBridge v0.17.62 — laboratory discovery, collaboration requests and active-lab selection

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS photographer_active_lab_id uuid REFERENCES labs(id) ON DELETE SET NULL;

ALTER TABLE labs
  ADD COLUMN IF NOT EXISTS photographer_discovery_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS photographer_join_discount_percent numeric(5,2) NOT NULL DEFAULT 0
    CHECK (photographer_join_discount_percent >= 0 AND photographer_join_discount_percent <= 100);

CREATE TABLE IF NOT EXISTS lab_collaboration_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_id uuid NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
  photographer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  offer_discount_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (offer_discount_percent >= 0 AND offer_discount_percent <= 100),
  note text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lab_id, photographer_id)
);
CREATE INDEX IF NOT EXISTS lab_collaboration_requests_lab_status_idx
  ON lab_collaboration_requests(lab_id,status,requested_at DESC);
CREATE INDEX IF NOT EXISTS lab_collaboration_requests_photographer_idx
  ON lab_collaboration_requests(photographer_id,status,requested_at DESC);

-- Preserve current behavior while preferring a real laboratory over the internal
-- service-only account whenever the photographer already belongs to one.
UPDATE users u
SET photographer_active_lab_id = COALESCE(
  (
    SELECT m.lab_id
    FROM lab_memberships m
    JOIN labs l ON l.id=m.lab_id
    WHERE m.user_id=u.id AND m.role='customer' AND m.active=true AND l.service_only=false
    ORDER BY m.created_at
    LIMIT 1
  ),
  (
    SELECT m.lab_id
    FROM lab_memberships m
    WHERE m.user_id=u.id AND m.role='customer' AND m.active=true
    ORDER BY m.created_at
    LIMIT 1
  )
)
WHERE u.photographer_active_lab_id IS NULL
  AND EXISTS (SELECT 1 FROM lab_memberships m WHERE m.user_id=u.id AND m.role='customer' AND m.active=true);
