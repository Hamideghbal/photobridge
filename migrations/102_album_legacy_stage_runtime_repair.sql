-- v0.17.412: canonicalize legacy album stages that can still be created by older approval flows.
UPDATE orders
SET album_stage='completed', updated_at=now()
WHERE mode='album' AND status='completed' AND album_stage IS DISTINCT FROM 'completed';

UPDATE orders
SET album_stage='ready', updated_at=now()
WHERE mode='album' AND status='ready' AND COALESCE(album_stage,'files_received') NOT IN ('ready','completed');

UPDATE orders
SET album_stage='printing', updated_at=now()
WHERE mode='album'
  AND (
    album_stage IN ('designing','awaiting_photographer_approval','approved')
    OR (
      COALESCE(album_stage,'files_received')='files_received'
      AND (downloaded_at IS NOT NULL OR status IN ('downloaded','printing','reviewing','ready_print','printed'))
    )
  );
