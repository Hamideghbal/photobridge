-- PhotoBridge v0.17.290 — professional retouch pricing by face count + real AI calls
-- Keep the legacy fixed-per-region behavior as the safe default for existing installs:
--   base = old fixed price, extra AI call = old fixed price, extra face = 0.
-- Admin can then set a separate extra-face surcharge without changing existing prices unexpectedly.

UPDATE platform_services
SET metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
  'customer_retouch_base_price', COALESCE(NULLIF(metadata->>'customer_retouch_base_price','')::bigint, NULLIF(metadata->>'customer_fixed_price','')::bigint, 0),
  'customer_retouch_extra_face_price', COALESCE(NULLIF(metadata->>'customer_retouch_extra_face_price','')::bigint, 0),
  'customer_retouch_extra_ai_call_price', COALESCE(NULLIF(metadata->>'customer_retouch_extra_ai_call_price','')::bigint, NULLIF(metadata->>'customer_fixed_price','')::bigint, 0),
  'lab_retouch_base_price', COALESCE(NULLIF(metadata->>'lab_retouch_base_price','')::bigint, NULLIF(metadata->>'lab_fixed_price','')::bigint, 0),
  'lab_retouch_extra_face_price', COALESCE(NULLIF(metadata->>'lab_retouch_extra_face_price','')::bigint, 0),
  'lab_retouch_extra_ai_call_price', COALESCE(NULLIF(metadata->>'lab_retouch_extra_ai_call_price','')::bigint, NULLIF(metadata->>'lab_fixed_price','')::bigint, 0),
  'retouch_pricing_version', 'face-call-v1',
  'retouch_base_included_faces', 2,
  'retouch_base_included_ai_calls', 1
),
updated_at=now()
WHERE service_key='ai_skin_retouch';
