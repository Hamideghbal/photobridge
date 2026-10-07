-- v0.17.410: repair legacy album orders where generic order.status advanced but album_stage stayed at files_received/null.
UPDATE orders
SET album_stage='completed', updated_at=now()
WHERE mode='album' AND status='completed' AND album_stage IS DISTINCT FROM 'completed';

UPDATE orders
SET album_stage='ready', updated_at=now()
WHERE mode='album' AND status='ready' AND COALESCE(album_stage,'files_received') NOT IN ('ready','completed');

UPDATE orders
SET album_stage='printing', updated_at=now()
WHERE mode='album'
  AND COALESCE(album_stage,'files_received')='files_received'
  AND (downloaded_at IS NOT NULL OR status IN ('downloaded','printing','reviewing','ready_print','printed'));
