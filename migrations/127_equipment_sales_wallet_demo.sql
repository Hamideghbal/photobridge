-- PhotoBridge v0.17.658 — sales wallet + Sofia demo storefront

ALTER TABLE service_wallet_gateway_payments
  ADD COLUMN IF NOT EXISTS return_path text;

ALTER TABLE equipment_sale_orders
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS buyer_wallet_transaction_id uuid REFERENCES photographer_service_wallet_transactions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shop_wallet_transaction_id uuid,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz;

DO $$ BEGIN
  ALTER TABLE equipment_sale_orders DROP CONSTRAINT IF EXISTS equipment_sale_orders_payment_status_check;
  ALTER TABLE equipment_sale_orders ADD CONSTRAINT equipment_sale_orders_payment_status_check
    CHECK (payment_status IN ('unpaid','paid','refunded'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS equipment_sale_wallets (
  shop_id uuid PRIMARY KEY REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  balance bigint NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO equipment_sale_wallets(shop_id,balance)
SELECT id,0 FROM equipment_rental_shops ON CONFLICT(shop_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS equipment_sale_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES equipment_rental_shops(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('credit','debit','refund','adjustment')),
  amount bigint NOT NULL CHECK (amount > 0),
  balance_after bigint NOT NULL CHECK (balance_after >= 0),
  reference_type text,
  reference_id text,
  reference_key text,
  note text,
  buyer_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_sale_wallet_tx_shop_idx ON equipment_sale_wallet_transactions(shop_id,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_sale_wallet_tx_ref_uidx ON equipment_sale_wallet_transactions(shop_id,reference_key) WHERE reference_key IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE equipment_sale_orders
    ADD CONSTRAINT equipment_sale_orders_shop_wallet_transaction_fk
    FOREIGN KEY (shop_wallet_transaction_id) REFERENCES equipment_sale_wallet_transactions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Demo catalog for the existing Sofia / صوفیا shop only. Safe to run repeatedly.
-- Give the existing Sofia demo shop presentation-ready copy without overwriting real profile data.
UPDATE equipment_rental_shops
SET description=COALESCE(NULLIF(btrim(description),''),'فروش و اجاره تجهیزات حرفه‌ای عکاسی و فیلم‌برداری؛ دوربین، لنز، نور و تجهیزات تولید محتوا.'),
    deposit_policy=COALESCE(NULLIF(btrim(deposit_policy),''),'مبلغ یا مدرک ضمانت هر تجهیز هنگام ثبت آفیش مشخص می‌شود و پس از تحویل سالم عودت داده خواهد شد.'),
    updated_at=now()
WHERE (lower(btrim(name)) IN ('صوفیا','sofia') OR name ILIKE '%صوفیا%' OR name ILIKE '%sofia%');

WITH target AS (
  SELECT id FROM equipment_rental_shops
  WHERE lower(btrim(name)) IN ('صوفیا','sofia') OR name ILIKE '%صوفیا%' OR name ILIKE '%sofia%'
  ORDER BY created_at DESC LIMIT 1
)
INSERT INTO equipment_catalog_categories(shop_id,code,name,sort_order)
SELECT target.id,v.code,v.name,v.sort_order FROM target CROSS JOIN (VALUES
 ('camera','دوربین',10),('lens','لنز',20),('light','نور',30),('stabilizer','گیمبال/استابلایزر',40),('accessory','لوازم جانبی',50)
) v(code,name,sort_order)
ON CONFLICT(shop_id,code) DO UPDATE SET name=EXCLUDED.name,deleted_at=NULL,sort_order=EXCLUDED.sort_order,updated_at=now();

WITH target AS (
  SELECT id FROM equipment_rental_shops
  WHERE lower(btrim(name)) IN ('صوفیا','sofia') OR name ILIKE '%صوفیا%' OR name ILIKE '%sofia%'
  ORDER BY created_at DESC LIMIT 1
), defs(category_code,model_name,sort_order) AS (VALUES
 ('camera','A7 IV',10),('camera','EOS R6 Mark II',20),('lens','FE 24-70mm F2.8 GM II',10),('lens','RF 70-200mm F2.8 L',20),('light','AD600 Pro',10),('light','V1',20),('stabilizer','RS 3 Pro',10),('accessory','Extreme Pro 128GB',10)
)
INSERT INTO equipment_catalog_models(shop_id,category_id,name,sort_order)
SELECT target.id,c.id,d.model_name,d.sort_order FROM target JOIN equipment_catalog_categories c ON c.shop_id=target.id JOIN defs d ON d.category_code=c.code
WHERE NOT EXISTS (SELECT 1 FROM equipment_catalog_models m WHERE m.shop_id=target.id AND m.category_id=c.id AND lower(m.name)=lower(d.model_name) AND m.deleted_at IS NULL);

WITH target AS (
  SELECT id FROM equipment_rental_shops
  WHERE lower(btrim(name)) IN ('صوفیا','sofia') OR name ILIKE '%صوفیا%' OR name ILIKE '%sofia%'
  ORDER BY created_at DESC LIMIT 1
), demo(category,title,brand,model,sku,daily_price,deposit_amount,stock_total,description,image_key,image_name) AS (VALUES
 ('camera','Sony A7 IV','Sony','A7 IV','SOFIA-DEMO-R-001',1800000,45000000,3,'بدنه فول‌فریم حرفه‌ای مناسب عروسی، پرتره و تولید محتوا.','public:/equipment-demo/sony-a7iv.png','sony-a7iv.png'),
 ('camera','Canon EOS R6 Mark II','Canon','EOS R6 Mark II','SOFIA-DEMO-R-002',1700000,42000000,2,'بدنه فول‌فریم سریع با فوکوس خودکار مناسب مراسم و پروژه‌های حرفه‌ای.','public:/equipment-demo/canon-r6ii.png','canon-r6ii.png'),
 ('lens','Sony 24-70mm F2.8 GM II','Sony','FE 24-70mm F2.8 GM II','SOFIA-DEMO-R-003',900000,30000000,3,'لنز زوم استاندارد حرفه‌ای برای مراسم، پرتره و تولید محتوای تجاری.','public:/equipment-demo/sony-2470.png','sony-2470.png'),
 ('lens','Canon RF 70-200mm F2.8 L','Canon','RF 70-200mm F2.8 L','SOFIA-DEMO-R-004',950000,32000000,2,'تله‌زوم روشن مناسب مراسم، پرتره و عکاسی فضای باز.','public:/equipment-demo/canon-70200.png','canon-70200.png'),
 ('light','Godox AD600 Pro','Godox','AD600 Pro','SOFIA-DEMO-R-005',650000,18000000,4,'فلاش پرتابل قدرتمند برای لوکیشن و استودیو همراه با باتری.','public:/equipment-demo/godox-ad600.png','godox-ad600.png'),
 ('stabilizer','DJI RS 3 Pro','DJI','RS 3 Pro','SOFIA-DEMO-R-006',700000,22000000,2,'گیمبال حرفه‌ای سه‌محوره برای دوربین‌های بدون آینه و سینمایی سبک.','public:/equipment-demo/dji-rs3pro.png','dji-rs3pro.png')
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
 ('camera','Sony A7 IV Body','Sony','A7 IV','SOFIA-DEMO-S-001',112000000,2,'بدنه نو با گارانتی و متعلقات کامل؛ مناسب عکاسی و فیلم‌برداری حرفه‌ای.','public:/equipment-demo/sony-a7iv.png','sony-a7iv.png'),
 ('lens','Sony 24-70mm F2.8 GM II','Sony','FE 24-70mm F2.8 GM II','SOFIA-DEMO-S-002',98000000,2,'لنز حرفه‌ای سری G Master با دیافراگم ثابت ۲.۸.','public:/equipment-demo/sony-2470.png','sony-2470.png'),
 ('light','Godox V1 Flash','Godox','V1','SOFIA-DEMO-S-003',18500000,5,'فلاش گرد قابل حمل مناسب عکاسی پرتره و مراسم.','public:/equipment-demo/godox-v1.png','godox-v1.png'),
 ('accessory','SanDisk Extreme Pro 128GB','SanDisk','Extreme Pro 128GB','SOFIA-DEMO-S-004',4200000,8,'کارت حافظه پرسرعت مناسب دوربین‌های حرفه‌ای.','public:/equipment-demo/sandisk-128.png','sandisk-128.png'),
 ('stabilizer','DJI RS 3 Pro Combo','DJI','RS 3 Pro','SOFIA-DEMO-S-005',62000000,2,'پکیج کامل گیمبال حرفه‌ای برای تولید محتوای ویدیویی.','public:/equipment-demo/dji-rs3pro.png','dji-rs3pro.png')
)
INSERT INTO equipment_sale_items(shop_id,category,title,brand,model,sku,sale_price,stock_total,active,description,image_object_key,image_name,image_content_type,image_bytes,created_at,updated_at)
SELECT target.id,d.category,d.title,d.brand,d.model,d.sku,d.sale_price,d.stock_total,true,d.description,d.image_key,d.image_name,'image/png',0,now(),now()
FROM target CROSS JOIN demo d
ON CONFLICT(shop_id,sku) WHERE deleted_at IS NULL AND sku IS NOT NULL AND btrim(sku)<>'' DO UPDATE SET title=EXCLUDED.title,category=EXCLUDED.category,brand=EXCLUDED.brand,model=EXCLUDED.model,sale_price=EXCLUDED.sale_price,stock_total=GREATEST(equipment_sale_items.stock_total,EXCLUDED.stock_total),active=true,description=EXCLUDED.description,image_object_key=EXCLUDED.image_object_key,image_name=EXCLUDED.image_name,image_content_type='image/png',deleted_at=NULL,updated_at=now();
