-- Add the shared-account recovery purpose. No credentials or role data are migrated.
DO $$
DECLARE item record;
BEGIN
 FOR item IN SELECT conname FROM pg_constraint WHERE conrelid='password_reset_challenges'::regclass AND contype='c' AND pg_get_constraintdef(oid) LIKE '%portal%'
 LOOP EXECUTE format('ALTER TABLE password_reset_challenges DROP CONSTRAINT %I',item.conname); END LOOP;
 ALTER TABLE password_reset_challenges ADD CONSTRAINT password_reset_challenges_portal_check CHECK(portal IN ('admin','lab','photographer','rental','account'));
END $$;
