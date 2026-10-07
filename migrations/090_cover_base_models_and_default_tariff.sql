-- PhotoBridge v0.17.342 — cover base-model library + corrected default print tariff

ALTER TABLE lab_album_cover_type_catalog
  ADD COLUMN IF NOT EXISTS preview_preset_key text NOT NULL DEFAULT 'simple';

UPDATE lab_album_cover_type_catalog
SET preview_preset_key='simple'
WHERE preview_preset_key IS NULL OR preview_preset_key NOT IN ('simple','photo-window','wood-strip-vertical','wood-plaque');

-- The original project-owner tariff in migration 005 was entered in thousands of toman.
-- Convert only NULL cells or untouched legacy defaults; never overwrite a lab's custom price.
WITH d(size_id,old_luster,new_luster,old_silk,new_silk,old_metallic,new_metallic,old_chassis,new_chassis) AS (VALUES
('10x15',30::bigint,30000::bigint,45::bigint,45000::bigint,NULL::bigint,NULL::bigint,45::bigint,45000::bigint),
('13x18',45,45000,75,75000,NULL,NULL,80,80000),('13x26',55,55000,85,85000,NULL,NULL,NULL,NULL),('16x21',60,60000,90,90000,130,130000,90,90000),
('20x30',130,130000,170,170000,220,220000,130,130000),('30x30',195,195000,255,255000,NULL,NULL,270,270000),('30x40',260,260000,340,340000,500,500000,260,260000),('30x45',290,290000,390,390000,500,500000,315,315000),
('30x60',390,390000,500,500000,660,660000,420,420000),('30x80',520,520000,680,680000,880,880000,520,520000),('40x60',520,520000,650,650000,1100,1100000,600,600000),('40x80',670,670000,840,840000,1480,1480000,650,650000),
('50x70',600,600000,840,840000,1300,1300000,650,650000),('50x80',700,700000,920,920000,1500,1500000,760,760000),('60x90',1200,1200000,1600,1600000,2400,2400000,1200,1200000),('70x100',1400,1400000,1900,1900000,2700,2700000,1400,1400000),
('75x120',1700,1700000,2300,2300000,3200,3200000,2300,2300000),('75x200',2800,2800000,3600,3600000,NULL,NULL,NULL,NULL)
)
UPDATE lab_prices p SET
  luster=CASE WHEN p.luster IS NULL OR p.luster=d.old_luster THEN d.new_luster ELSE p.luster END,
  silk=CASE WHEN p.silk IS NULL OR p.silk=d.old_silk THEN d.new_silk ELSE p.silk END,
  metallic=CASE WHEN d.new_metallic IS NULL THEN p.metallic WHEN p.metallic IS NULL OR p.metallic=d.old_metallic THEN d.new_metallic ELSE p.metallic END,
  chassis=CASE WHEN d.new_chassis IS NULL THEN p.chassis WHEN p.chassis IS NULL OR p.chassis=d.old_chassis THEN d.new_chassis ELSE p.chassis END,
  updated_at=now()
FROM d WHERE p.size_id=d.size_id;

-- Labs that have no row yet receive the corrected defaults too.
INSERT INTO lab_prices(lab_id,size_id,luster,silk,metallic,chassis,updated_at)
SELECT l.id,d.size_id,d.luster,d.silk,d.metallic,d.chassis,now()
FROM labs l CROSS JOIN (VALUES
('10x15',30000::bigint,45000::bigint,NULL::bigint,45000::bigint),
('13x18',45000,75000,NULL,80000),('13x26',55000,85000,NULL,NULL),('16x21',60000,90000,130000,90000),
('20x30',130000,170000,220000,130000),('30x30',195000,255000,NULL,270000),('30x40',260000,340000,500000,260000),('30x45',290000,390000,500000,315000),
('30x60',390000,500000,660000,420000),('30x80',520000,680000,880000,520000),('40x60',520000,650000,1100000,600000),('40x80',670000,840000,1480000,650000),
('50x70',600000,840000,1300000,650000),('50x80',700000,920000,1500000,760000),('60x90',1200000,1600000,2400000,1200000),('70x100',1400000,1900000,2700000,1400000),
('75x120',1700000,2300000,3200000,2300000),('75x200',2800000,3600000,NULL,NULL)
) AS d(size_id,luster,silk,metallic,chassis)
WHERE COALESCE(l.service_only,false)=false
ON CONFLICT(lab_id,size_id) DO NOTHING;

COMMENT ON COLUMN lab_album_cover_type_catalog.preview_preset_key IS 'Built-in PhotoBridge base preview: simple, photo-window, wood-strip-vertical, wood-plaque. Custom image_data overrides it.';
