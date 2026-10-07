-- PhotoBridge v0.17.11 — fixed Low quality + automatic output size

ALTER TABLE ai_image_jobs
  DROP CONSTRAINT IF EXISTS ai_image_jobs_requested_size_check;

ALTER TABLE ai_image_jobs
  ADD CONSTRAINT ai_image_jobs_requested_size_check
  CHECK (
    requested_size IS NULL OR
    requested_size = 'auto' OR
    CASE
      WHEN requested_size ~ '^[0-9]{2,4}x[0-9]{2,4}$' THEN
        (split_part(requested_size,'x',1)::int % 16 = 0) AND
        (split_part(requested_size,'x',2)::int % 16 = 0) AND
        greatest(split_part(requested_size,'x',1)::int, split_part(requested_size,'x',2)::int) <= 3840 AND
        least(split_part(requested_size,'x',1)::int, split_part(requested_size,'x',2)::int) > 0 AND
        greatest(split_part(requested_size,'x',1)::numeric, split_part(requested_size,'x',2)::numeric) /
          least(split_part(requested_size,'x',1)::numeric, split_part(requested_size,'x',2)::numeric) <= 3 AND
        (split_part(requested_size,'x',1)::bigint * split_part(requested_size,'x',2)::bigint) BETWEEN 655360 AND 8294400
      ELSE false
    END
  );

ALTER TABLE ai_image_jobs ALTER COLUMN quality SET DEFAULT 'low';

UPDATE platform_services
SET metadata=COALESCE(metadata,'{}'::jsonb)||'{"quality_default":"low","size_default":"auto","resolution_default":"auto"}'::jsonb,
    updated_at=now()
WHERE service_key IN ('ai_restore_colorize','ai_restore_damage','ai_identity_upscale');
