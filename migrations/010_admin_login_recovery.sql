-- PhotoBridge v0.13.2
-- One-time recovery for the platform-admin login on databases that may already
-- contain the v0.13.1 bootstrap marker with stale credentials.
DO $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- Prefer the admin already using the canonical mobile, otherwise reuse the
  -- oldest platform admin so we do not create unnecessary duplicate admins.
  SELECT id INTO v_admin_id
  FROM users
  WHERE platform_role = 'platform_admin'
    AND mobile = '09125678720'
  ORDER BY created_at
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id
    FROM users
    WHERE platform_role = 'platform_admin'
    ORDER BY created_at
    LIMIT 1;
  END IF;

  IF v_admin_id IS NULL THEN
    INSERT INTO users(name, email, mobile, password_hash, platform_role, active)
    VALUES (
      'Platform Admin',
      NULL,
      '09125678720',
      '0a2e766f956a27fe1a1629e159eb8776:728c5cbc760fd7e9b9e5a5dd8d8a97950c31ce3aff044eb0c72e01a42587e4f0415973036e6da1154eb2d58f94fad4f788ab00e68a04105e5cbbf56bf8c5f37e',
      'platform_admin',
      true
    )
    RETURNING id INTO v_admin_id;
  ELSE
    UPDATE users
    SET name = COALESCE(NULLIF(name, ''), 'Platform Admin'),
        mobile = '09125678720',
        password_hash = '0a2e766f956a27fe1a1629e159eb8776:728c5cbc760fd7e9b9e5a5dd8d8a97950c31ce3aff044eb0c72e01a42587e4f0415973036e6da1154eb2d58f94fad4f788ab00e68a04105e5cbbf56bf8c5f37e',
        platform_role = 'platform_admin',
        active = true,
        updated_at = now()
    WHERE id = v_admin_id;
  END IF;

  -- Prevent ambiguity if an older platform-admin row already carries the same
  -- canonical mobile. It remains an admin but must get a different mobile from
  -- the admin panel before it can be used for mobile login.
  UPDATE users
  SET mobile = NULL,
      updated_at = now()
  WHERE platform_role = 'platform_admin'
    AND id <> v_admin_id
    AND mobile = '09125678720';

  -- Force a fresh login after the recovery credentials are applied.
  DELETE FROM sessions WHERE user_id = v_admin_id;
END $$;
