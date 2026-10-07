-- PhotoBridge v0.17.294 — separate album workflow + size-specific cover pricing/samples + invite hard repair

ALTER TABLE lab_album_covers ADD COLUMN IF NOT EXISTS size_id uuid REFERENCES lab_album_sizes(id) ON DELETE CASCADE;
ALTER TABLE lab_album_covers ADD COLUMN IF NOT EXISTS image_data text;
CREATE INDEX IF NOT EXISTS lab_album_covers_size_idx ON lab_album_covers(lab_id,size_id,active,sort_order,created_at);


-- v0.17.293 covers were global. On upgrades, copy each legacy cover to every existing
-- album size of the same lab so no previously configured cover disappears when pricing
-- becomes size-specific. Colors are copied with each clone.
DO $$
DECLARE cover_row record; size_row record; new_cover_id uuid;
BEGIN
  FOR cover_row IN SELECT * FROM lab_album_covers WHERE size_id IS NULL LOOP
    IF EXISTS (SELECT 1 FROM lab_album_sizes s WHERE s.lab_id=cover_row.lab_id) THEN
      FOR size_row IN SELECT id FROM lab_album_sizes WHERE lab_id=cover_row.lab_id ORDER BY sort_order,created_at LOOP
        INSERT INTO lab_album_covers(lab_id,size_id,name,price,image_data,active,sort_order,created_at,updated_at)
        VALUES(cover_row.lab_id,size_row.id,cover_row.name,cover_row.price,cover_row.image_data,cover_row.active,cover_row.sort_order,cover_row.created_at,now())
        RETURNING id INTO new_cover_id;
        INSERT INTO lab_album_cover_colors(cover_id,name,color_value,active,sort_order,created_at,updated_at)
        SELECT new_cover_id,name,color_value,active,sort_order,created_at,now() FROM lab_album_cover_colors WHERE cover_id=cover_row.id;
      END LOOP;
      DELETE FROM lab_album_covers WHERE id=cover_row.id;
    END IF;
  END LOOP;
END $$;

-- Normalize legacy album stages into the operational workflow used by the dedicated Album queue.
UPDATE orders SET album_stage='printing' WHERE mode='album' AND album_stage IN ('designing','awaiting_photographer_approval','approved');
UPDATE orders SET album_stage='ready' WHERE mode='album' AND status='ready' AND album_stage IS DISTINCT FROM 'ready';
UPDATE orders SET album_stage='completed' WHERE mode='album' AND status='completed' AND album_stage IS DISTINCT FROM 'completed';

-- Older installations may contain incompatible CHECK constraints created by partial invite migrations.
-- Drop only CHECK constraints on photographer_invites, normalize data, then restore the canonical checks.
DO $$
DECLARE r record;
BEGIN
  IF to_regclass('public.photographer_invites') IS NOT NULL THEN
    FOR r IN
      SELECT conname FROM pg_constraint
      WHERE conrelid='public.photographer_invites'::regclass AND contype='c'
    LOOP
      EXECUTE format('ALTER TABLE photographer_invites DROP CONSTRAINT IF EXISTS %I',r.conname);
    END LOOP;
  END IF;
END $$;

ALTER TABLE photographer_invites ALTER COLUMN campaign DROP NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN channel DROP NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN target_mobile DROP NOT NULL;
ALTER TABLE photographer_invites ALTER COLUMN issuer_lab_id DROP NOT NULL;
UPDATE photographer_invites SET issuer_type='admin' WHERE issuer_type IS NULL OR issuer_type NOT IN ('admin','lab','photographer');
UPDATE photographer_invites SET uses=0 WHERE uses IS NULL OR uses<0;
UPDATE photographer_invites SET max_uses=NULL WHERE max_uses IS NOT NULL AND max_uses<=0;
ALTER TABLE photographer_invites ALTER COLUMN issuer_type SET NOT NULL;
ALTER TABLE photographer_invites ADD CONSTRAINT photographer_invites_issuer_type_check CHECK (issuer_type IN ('admin','lab','photographer'));
ALTER TABLE photographer_invites ADD CONSTRAINT photographer_invites_max_uses_check CHECK (max_uses IS NULL OR max_uses > 0);
ALTER TABLE photographer_invites ADD CONSTRAINT photographer_invites_uses_check CHECK (uses >= 0);
