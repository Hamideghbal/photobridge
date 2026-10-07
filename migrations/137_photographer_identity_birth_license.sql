-- Identity details belong to the photographer, not a particular store relationship.
ALTER TABLE photographer_profiles
  ADD COLUMN IF NOT EXISTS birth_jalali text,
  ADD COLUMN IF NOT EXISTS business_license_no text;

-- Preserve details previously collected by rental stores when a photographer has
-- not yet provided them on the core account.
UPDATE photographer_profiles p SET
  birth_jalali=COALESCE(NULLIF(p.birth_jalali,''),m.birth_jalali),
  business_license_no=COALESCE(NULLIF(p.business_license_no,''),m.business_license_no)
FROM equipment_rental_shop_memberships m
WHERE m.user_id=p.user_id AND m.role='photographer'
  AND (NULLIF(p.birth_jalali,'') IS NULL OR NULLIF(p.business_license_no,'') IS NULL)
  AND m.shop_id=(SELECT m2.shop_id FROM equipment_rental_shop_memberships m2
    WHERE m2.user_id=p.user_id AND m2.role='photographer'
      AND (m2.birth_jalali IS NOT NULL OR m2.business_license_no IS NOT NULL)
    ORDER BY m2.created_at LIMIT 1);
