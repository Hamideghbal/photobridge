-- PhotoBridge v0.17.665 — durable Sofia/Sofia demo catalog ensure
-- This script is intentionally run after migrations on every application start.
-- It is idempotent and only creates/refreshes dedicated SOFIA-DEMO rows.
-- Real inventory is never overwritten.

DROP TABLE IF EXISTS _pb_sofia_demo_target;
CREATE TEMP TABLE _pb_sofia_demo_target(id uuid PRIMARY KEY) ON COMMIT DROP;

INSERT INTO _pb_sofia_demo_target(id)
SELECT s.id
FROM equipment_rental_shops s
WHERE
  s.name ILIKE '%صوفیا%'
  OR s.name ILIKE '%صوفيا%'
  OR s.name ILIKE '%سوفیا%'
  OR s.name ILIKE '%سوفيا%'
  OR s.name ILIKE '%sofia%'
  OR s.name ILIKE '%sophia%'
  OR s.slug ILIKE '%sofia%'
  OR s.slug ILIKE '%sophia%'
ORDER BY s.created_at DESC
LIMIT 1;

WITH target AS (SELECT id FROM _pb_sofia_demo_target), cats(code,name,sort_order) AS (VALUES
 ('camera','دوربین',10),
 ('lens','لنز',20),
 ('light','نور و فلاش',30),
 ('stabilizer','گیمبال و لرزشگیر',40),
 ('accessory','لوازم جانبی',50),
 ('audio','صدا',60),
 ('other','سایر',90)
)
INSERT INTO equipment_catalog_categories(shop_id,code,name,sort_order,deleted_at,updated_at)
SELECT target.id,c.code,c.name,c.sort_order,NULL,now()
FROM target CROSS JOIN cats c
ON CONFLICT(shop_id,code) DO UPDATE SET
  name=EXCLUDED.name,
  sort_order=EXCLUDED.sort_order,
  deleted_at=NULL,
  updated_at=now();

WITH target AS (SELECT id FROM _pb_sofia_demo_target), models(category_code,name,sort_order) AS (VALUES
 ('camera','Sony A7 IV',10),('camera','Sony A7S III',20),('camera','Canon EOS R6 Mark II',30),('camera','Canon EOS R5',40),
 ('lens','Sony FE 24-70mm F2.8 GM II',10),('lens','Sony FE 70-200mm F2.8 GM II',20),('lens','Canon RF 24-70mm F2.8 L',30),('lens','Canon RF 70-200mm F2.8 L',40),
 ('light','Godox AD600 Pro',10),('light','Godox V1',20),('light','Godox XPro II',30),
 ('stabilizer','DJI RS 3 Pro',10),('stabilizer','DJI RS 3 Mini',20),
 ('accessory','SanDisk Extreme Pro 128GB',10),('accessory','SanDisk Extreme Pro 256GB',20)
)
INSERT INTO equipment_catalog_models(shop_id,category_id,name,sort_order,deleted_at,updated_at)
SELECT target.id,c.id,m.name,m.sort_order,NULL,now()
FROM target
JOIN equipment_catalog_categories c ON c.shop_id=target.id
JOIN models m ON m.category_code=c.code
WHERE NOT EXISTS (
  SELECT 1 FROM equipment_catalog_models x
  WHERE x.shop_id=target.id AND x.category_id=c.id AND lower(btrim(x.name))=lower(btrim(m.name)) AND x.deleted_at IS NULL
);

-- 12 rental demo products total after this migration.
WITH target AS (SELECT id FROM _pb_sofia_demo_target), demo(category,title,brand,model,sku,daily_price,deposit_amount,stock_total,description,image_key,image_name) AS (VALUES
 ('camera','Sony A7 IV','Sony','A7 IV','SOFIA-DEMO-R-001',1800000,45000000,3,'بدنه فول‌فریم حرفه‌ای مناسب مراسم، پرتره و تولید محتوا.','public:/equipment-demo/sony-a7iv.png','sony-a7iv.png'),
 ('camera','Canon EOS R6 Mark II','Canon','EOS R6 Mark II','SOFIA-DEMO-R-002',1700000,42000000,2,'بدنه فول‌فریم سریع و حرفه‌ای برای مراسم و فیلم‌برداری.','public:/equipment-demo/canon-r6ii.png','canon-r6ii.png'),
 ('lens','Sony 24-70mm F2.8 GM II','Sony','FE 24-70mm F2.8 GM II','SOFIA-DEMO-R-003',900000,30000000,3,'لنز زوم استاندارد حرفه‌ای مناسب مراسم و پرتره.','public:/equipment-demo/sony-2470.png','sony-2470.png'),
 ('lens','Canon RF 70-200mm F2.8 L','Canon','RF 70-200mm F2.8 L','SOFIA-DEMO-R-004',950000,32000000,2,'تله‌زوم حرفه‌ای مناسب فضای باز و مراسم.','public:/equipment-demo/canon-70200.png','canon-70200.png'),
 ('light','Godox AD600 Pro','Godox','AD600 Pro','SOFIA-DEMO-R-005',650000,18000000,4,'فلاش پرتابل پرقدرت برای استودیو و لوکیشن.','public:/equipment-demo/godox-ad600.png','godox-ad600.png'),
 ('stabilizer','DJI RS 3 Pro','DJI','RS 3 Pro','SOFIA-DEMO-R-006',700000,22000000,2,'گیمبال سه‌محوره حرفه‌ای برای تولید محتوای ویدیویی.','public:/equipment-demo/dji-rs3pro.png','dji-rs3pro.png'),
 ('camera','Sony A7S III','Sony','A7S III','SOFIA-DEMO-R-007',1950000,48000000,2,'بدنه حرفه‌ای ویدیو و نور کم برای کلیپ، مراسم و تولید محتوای سینمایی.','public:/equipment-demo/sony-a7iv.png','sony-a7iv.png'),
 ('camera','Canon EOS R5','Canon','EOS R5','SOFIA-DEMO-R-008',2050000,52000000,2,'بدنه رزولوشن بالا مناسب فشن، تبلیغات و ویدیوی حرفه‌ای.','public:/equipment-demo/canon-r6ii.png','canon-r6ii.png'),
 ('lens','Sony 70-200mm F2.8 GM II','Sony','FE 70-200mm F2.8 GM II','SOFIA-DEMO-R-009',1000000,34000000,2,'تله‌زوم سریع مناسب مراسم، پرتره و فضای باز.','public:/equipment-demo/sony-2470.png','sony-2470.png'),
 ('lens','Canon RF 24-70mm F2.8 L','Canon','RF 24-70mm F2.8 L','SOFIA-DEMO-R-010',900000,31000000,3,'لنز همه‌کاره حرفه‌ای برای عکاسی و فیلم‌برداری مراسم.','public:/equipment-demo/canon-70200.png','canon-70200.png'),
 ('light','Godox V1 TTL','Godox','V1','SOFIA-DEMO-R-011',320000,8500000,5,'فلاش سبک TTL مناسب عکاسی مراسم و پرتره در لوکیشن.','public:/equipment-demo/godox-v1.png','godox-v1.png'),
 ('stabilizer','DJI RS 3 Mini','DJI','RS 3 Mini','SOFIA-DEMO-R-012',420000,12000000,3,'گیمبال سبک برای دوربین‌های بدون آینه و تولید محتوای روزانه.','public:/equipment-demo/dji-rs3pro.png','dji-rs3pro.png')
)
INSERT INTO equipment_rental_items(id,shop_id,category,title,brand,model,sku,daily_price,deposit_amount,stock_total,active,description,image_object_key,image_name,image_content_type,image_bytes,created_at,updated_at)
SELECT gen_random_uuid(),target.id,d.category,d.title,d.brand,d.model,d.sku,d.daily_price,d.deposit_amount,d.stock_total,true,d.description,d.image_key,d.image_name,'image/png',0,now(),now()
FROM target CROSS JOIN demo d
ON CONFLICT(shop_id,sku) WHERE sku IS NOT NULL AND btrim(sku)<>'' DO UPDATE SET
 title=EXCLUDED.title,category=EXCLUDED.category,brand=EXCLUDED.brand,model=EXCLUDED.model,
 daily_price=EXCLUDED.daily_price,deposit_amount=EXCLUDED.deposit_amount,
 stock_total=GREATEST(equipment_rental_items.stock_total,EXCLUDED.stock_total),
 active=true,description=EXCLUDED.description,image_object_key=EXCLUDED.image_object_key,
 image_name=EXCLUDED.image_name,image_content_type='image/png',deleted_at=NULL,updated_at=now();

-- 12 sale demo products total after this migration.
WITH target AS (SELECT id FROM _pb_sofia_demo_target), demo(category,title,brand,model,sku,sale_price,stock_total,description,image_key,image_name) AS (VALUES
 ('camera','Sony A7 IV Body','Sony','A7 IV','SOFIA-DEMO-S-001',112000000,2,'بدنه نو با متعلقات کامل؛ مناسب عکاسی و فیلم‌برداری حرفه‌ای.','public:/equipment-demo/sony-a7iv.png','sony-a7iv.png'),
 ('lens','Sony 24-70mm F2.8 GM II','Sony','FE 24-70mm F2.8 GM II','SOFIA-DEMO-S-002',98000000,2,'لنز حرفه‌ای سری G Master با دیافراگم ثابت ۲.۸.','public:/equipment-demo/sony-2470.png','sony-2470.png'),
 ('light','Godox V1 Flash','Godox','V1','SOFIA-DEMO-S-003',18500000,5,'فلاش گرد قابل حمل مناسب عکاسی پرتره و مراسم.','public:/equipment-demo/godox-v1.png','godox-v1.png'),
 ('accessory','SanDisk Extreme Pro 128GB','SanDisk','Extreme Pro 128GB','SOFIA-DEMO-S-004',4200000,8,'کارت حافظه پرسرعت مناسب دوربین‌های حرفه‌ای.','public:/equipment-demo/sandisk-128.png','sandisk-128.png'),
 ('stabilizer','DJI RS 3 Pro Combo','DJI','RS 3 Pro','SOFIA-DEMO-S-005',62000000,2,'پکیج گیمبال حرفه‌ای برای تولید محتوای ویدیویی.','public:/equipment-demo/dji-rs3pro.png','dji-rs3pro.png'),
 ('camera','Canon EOS R6 Mark II Body','Canon','EOS R6 Mark II','SOFIA-DEMO-S-006',108000000,2,'بدنه فول‌فریم سریع مناسب مراسم، ورزشی و تولید محتوا.','public:/equipment-demo/canon-r6ii.png','canon-r6ii.png'),
 ('camera','Sony A7C II Body','Sony','A7C II','SOFIA-DEMO-S-007',89000000,2,'بدنه سبک فول‌فریم برای تولید محتوا، سفر و عکاسی روزمره حرفه‌ای.','public:/equipment-demo/sony-a7iv.png','sony-a7iv.png'),
 ('lens','Canon RF 70-200mm F2.8 L','Canon','RF 70-200mm F2.8 L','SOFIA-DEMO-S-008',118000000,2,'تله‌زوم حرفه‌ای سری L برای مراسم، پرتره و فضای باز.','public:/equipment-demo/canon-70200.png','canon-70200.png'),
 ('lens','Canon RF 24-70mm F2.8 L','Canon','RF 24-70mm F2.8 L','SOFIA-DEMO-S-009',105000000,2,'زوم استاندارد حرفه‌ای با دیافراگم ثابت مناسب عکس و ویدیو.','public:/equipment-demo/canon-70200.png','canon-70200.png'),
 ('light','Godox AD600 Pro','Godox','AD600 Pro','SOFIA-DEMO-S-010',57500000,3,'فلاش استودیویی پرتابل با توان بالا برای لوکیشن و آتلیه.','public:/equipment-demo/godox-ad600.png','godox-ad600.png'),
 ('light','Godox XPro II Trigger','Godox','XPro II','SOFIA-DEMO-S-011',8900000,5,'تریگر بی‌سیم حرفه‌ای برای کنترل فلاش‌های Godox در پروژه‌های عکاسی.','public:/equipment-demo/godox-v1.png','godox-v1.png'),
 ('accessory','SanDisk Extreme Pro 256GB','SanDisk','Extreme Pro 256GB','SOFIA-DEMO-S-012',7200000,8,'کارت حافظه پرظرفیت و پرسرعت مناسب عکس RAW و ویدیوی با بیت‌ریت بالا.','public:/equipment-demo/sandisk-128.png','sandisk-128.png')
)
INSERT INTO equipment_sale_items(shop_id,category,title,brand,model,sku,sale_price,stock_total,active,description,image_object_key,image_name,image_content_type,image_bytes,created_at,updated_at)
SELECT target.id,d.category,d.title,d.brand,d.model,d.sku,d.sale_price,d.stock_total,true,d.description,d.image_key,d.image_name,'image/png',0,now(),now()
FROM target CROSS JOIN demo d
ON CONFLICT(shop_id,sku) WHERE deleted_at IS NULL AND sku IS NOT NULL AND btrim(sku)<>'' DO UPDATE SET
 title=EXCLUDED.title,category=EXCLUDED.category,brand=EXCLUDED.brand,model=EXCLUDED.model,
 sale_price=EXCLUDED.sale_price,stock_total=GREATEST(equipment_sale_items.stock_total,EXCLUDED.stock_total),
 active=true,description=EXCLUDED.description,image_object_key=EXCLUDED.image_object_key,
 image_name=EXCLUDED.image_name,image_content_type='image/png',deleted_at=NULL,updated_at=now();
