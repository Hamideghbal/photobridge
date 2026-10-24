-- Preserve identities and existing memberships; allow one independent row per role.
DO $$
DECLARE old_constraint record;
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='lab_memberships'::regclass AND conname='lab_memberships_lab_user_role_key') THEN
  ALTER TABLE lab_memberships ADD CONSTRAINT lab_memberships_lab_user_role_key UNIQUE(lab_id,user_id,role);
 END IF;
 FOR old_constraint IN
  SELECT c.conname FROM pg_constraint c
  WHERE c.conrelid='lab_memberships'::regclass AND c.contype='u'
    AND cardinality(c.conkey)=2
    AND (SELECT array_agg(a.attname::text ORDER BY a.attname) FROM pg_attribute a WHERE a.attrelid=c.conrelid AND a.attnum=ANY(c.conkey))=ARRAY['lab_id','user_id']::text[]
 LOOP
  EXECUTE format('ALTER TABLE lab_memberships DROP CONSTRAINT %I',old_constraint.conname);
 END LOOP;
END $$;
