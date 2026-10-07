-- PhotoBridge v0.17.661 — refresh/ensure Sofia demo equipment for presentation
-- Safe and idempotent. Existing real rows are not overwritten unless they use the dedicated SOFIA-DEMO SKU.
WITH target AS (
  SELECT id FROM equipment_rental_shops
  WHERE lower(btrim(name)) IN ('صوفیا','sofia') OR name ILIKE '%صوفیا%' OR name ILIKE '%sofia%'
  ORDER BY created_at DESC LIMIT 1
), demo(category,title,brand,model,sku,daily_price,deposit_amount,stock_total,description,image_key,image_name) AS (VALUES
 ('camera','Sony A7 IV','Sony','A7 IV','SOFIA-DEMO-R-001',1800000,45000000,3,'بدنه فول‌فریم حرفه‌ای مناسب عروسی، پرتره و تولید محتوا.','public:/equipment-demo/sony-a7iv.png','sony-a7iv.png'),
 ('camera','Canon EOS R6 Mark II','Canon','EOS R6 Mark II','SOFIA-DEMO-R-002',1700000,42000000,2,'بدنه فول‌فریم سریع و حرفه‌ای برای مراسم و فیلم‌برداری.','public:/equipment-demo/canon-r6ii.png','canon-r6ii.png'),
 ('lens','Sony 24-70mm F2.8 GM II','Sony','FE 24-70mm F2.8 GM II','SOFIA-DEMO-R-003',900000,30000000,3,'لنز زوم استاندارد حرفه‌ای مناسب مراسم و پرتره.','public:/equipment-demo/sony-2470.png','sony-2470.png'),
 ('lens','Canon RF 70-200mm F2.8 L','Canon','RF 70-200mm F2.8 L','SOFIA-DEMO-R-004',950000,32000000,2,'تله‌زوم حرفه‌ای مناسب فضای باز و مراسم.','public:/equipment-demo/canon-70200.png','canon-70200.png'),
 ('light','Godox AD600 Pro','Godox','AD600 Pro','SOFIA-DEMO-R-005',650000,18000000,4,'فلاش پرتابل پرقدرت برای استودیو و لوکیشن.','public:/equipment-demo/godox-ad600.png','godox-ad600.png'),
 ('stabilizer','DJI RS 3 Pro','DJI','RS 3 Pro','SOFIA-DEMO-R-006',700000,22000000,2,'گیمبال سه‌محوره حرفه‌ای برای تولید محتوای ویدیویی.','public:/equipment-demo/dji-rs3pro.png','dji-rs3pro.png')
)
INSERT INTO equipment_rental_items(id,shop_id,category,title,brand,model,sku,daily_price,deposit_amount,stock_total,active,description,image_object_key,image_name,image_content_type,image_bytes,created_at,updated_at)
SELECT gen_random_uuid(),target.id,d.category,d.title,d.brand,d.model,d.sku,d.daily_price,d.deposit_amount,d.stock_total,true,d.description,d.image_key,d.image_name,'image/png',0,now(),now()
FROM target CROSS JOIN demo d
ON CONFLICT(shop_id,sku) WHERE sku IS NOT NULL AND btrim(sku)<>'' DO UPDATE SET title=EXCLUDED.title,category=EXCLUDED.category,brand=EXCLUDED.brand,model=EXCLUDED.model,daily_price=EXCLUDED.daily_price,deposit_amount=EXCLUDED.deposit_amount,stock_total=GREATEST(equipment_rental_items.stock_total,EXCLUDED.stock_total),active=true,description=EXCLUDED.description,image_object_key=EXCLUDED.image_object_key,image_name=EXCLUDED.image_name,image_content_type='image/png',deleted_at=NULL,updated_at=now();

WITH target AS (
  SELECT id FROM equipment_rental_shops
  WHERE lower(btrim(name)) IN ('صوفیا','sofia') OR name ILIKE '%صوفیا%' OR name ILIKE '%sofia%'
  ORDER BY created_at DESC LIMIT 1
), demo(category,title,brand,model,sku,sale_price,stock_total,description,image_key,image_name) AS (VALUES
 ('camera','Sony A7 IV Body','Sony','A7 IV','SOFIA-DEMO-S-001',112000000,2,'بدنه نو با متعلقات کامل؛ مناسب عکاسی و فیلم‌برداری حرفه‌ای.','public:/equipment-demo/sony-a7iv.png','sony-a7iv.png'),
 ('lens','Sony 24-70mm F2.8 GM II','Sony','FE 24-70mm F2.8 GM II','SOFIA-DEMO-S-002',98000000,2,'لنز حرفه‌ای سری G Master با دیافراگم ثابت ۲.۸.','public:/equipment-demo/sony-2470.png','sony-2470.png'),
 ('light','Godox V1 Flash','Godox','V1','SOFIA-DEMO-S-003',18500000,5,'فلاش گرد قابل حمل مناسب عکاسی پرتره و مراسم.','public:/equipment-demo/godox-v1.png','godox-v1.png'),
 ('accessory','SanDisk Extreme Pro 128GB','SanDisk','Extreme Pro 128GB','SOFIA-DEMO-S-004',4200000,8,'کارت حافظه پرسرعت مناسب دوربین‌های حرفه‌ای.','public:/equipment-demo/sandisk-128.png','sandisk-128.png'),
 ('stabilizer','DJI RS 3 Pro Combo','DJI','RS 3 Pro','SOFIA-DEMO-S-005',62000000,2,'پکیج گیمبال حرفه‌ای برای تولید محتوای ویدیویی.','public:/equipment-demo/dji-rs3pro.png','dji-rs3pro.png')
)
INSERT INTO equipment_sale_items(shop_id,category,title,brand,model,sku,sale_price,stock_total,active,description,image_object_key,image_name,image_content_type,image_bytes,created_at,updated_at)
SELECT target.id,d.category,d.title,d.brand,d.model,d.sku,d.sale_price,d.stock_total,true,d.description,d.image_key,d.image_name,'image/png',0,now(),now()
FROM target CROSS JOIN demo d
ON CONFLICT(shop_id,sku) WHERE deleted_at IS NULL AND sku IS NOT NULL AND btrim(sku)<>'' DO UPDATE SET title=EXCLUDED.title,category=EXCLUDED.category,brand=EXCLUDED.brand,model=EXCLUDED.model,sale_price=EXCLUDED.sale_price,stock_total=GREATEST(equipment_sale_items.stock_total,EXCLUDED.stock_total),active=true,description=EXCLUDED.description,image_object_key=EXCLUDED.image_object_key,image_name=EXCLUDED.image_name,image_content_type='image/png',deleted_at=NULL,updated_at=now();
