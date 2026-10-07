-- PhotoBridge v0.17.634
-- Emergency platform maintenance switch. The first deployment intentionally
-- starts in maintenance mode so the owner can validate the print/lab repair
-- before reopening the site. Later deploys do not overwrite the admin choice.
INSERT INTO platform_settings(key,value,updated_at)
VALUES (
  'maintenance_mode',
  jsonb_build_object(
    'enabled', true,
    'message', 'سایت در حال به‌روزرسانی است. لطفاً کمی بعد دوباره مراجعه کنید.',
    'enabledAt', now()::text,
    'disabledAt', NULL,
    'bypassUserId', NULL
  ),
  now()
)
ON CONFLICT (key) DO NOTHING;
