-- PhotoBridge v827 — central equipment catalog + multi-image galleries
CREATE TABLE IF NOT EXISTS equipment_global_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS equipment_global_brands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS equipment_global_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES equipment_global_categories(id) ON DELETE RESTRICT,
  brand_id uuid REFERENCES equipment_global_brands(id) ON DELETE SET NULL,
  title text NOT NULL,
  model text,
  description text,
  specs jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  source_url text,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS equipment_global_products_category_idx ON equipment_global_products(category_id,active,sort_order,title);
CREATE INDEX IF NOT EXISTS equipment_global_products_brand_idx ON equipment_global_products(brand_id,active,sort_order,title);
CREATE UNIQUE INDEX IF NOT EXISTS equipment_global_products_identity_uidx
  ON equipment_global_products(category_id,COALESCE(brand_id,'00000000-0000-0000-0000-000000000000'::uuid),lower(title))
  WHERE deleted_at IS NULL;

ALTER TABLE equipment_rental_items
  ADD COLUMN IF NOT EXISTS catalog_product_id uuid REFERENCES equipment_global_products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE equipment_sale_items
  ADD COLUMN IF NOT EXISTS catalog_product_id uuid REFERENCES equipment_global_products(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO equipment_global_categories(code,name,sort_order,active)
VALUES ('camera','دوربین',10,true),('lens','لنز',20,true),('photo_gear','تجهیزات عکاسی',30,true),('video_gear','تجهیزات فیلم‌برداری',40,true)
ON CONFLICT(code) DO UPDATE SET name=EXCLUDED.name,sort_order=EXCLUDED.sort_order,active=true,deleted_at=NULL,updated_at=now();

INSERT INTO equipment_global_brands(name,sort_order,active)
VALUES ('Sony',10,true),('Canon',20,true),('Nikon',30,true)
ON CONFLICT(name) DO UPDATE SET sort_order=EXCLUDED.sort_order,active=true,deleted_at=NULL,updated_at=now();

-- Current/professional camera starter bank. Product images are intentionally managed as URLs/admin uploads,
-- so deployments are not coupled to external hotlinked image assets.
WITH c AS (SELECT id FROM equipment_global_categories WHERE code='camera'),
     b AS (SELECT id,name FROM equipment_global_brands)
INSERT INTO equipment_global_products(category_id,brand_id,title,model,description,specs,source_url,sort_order)
SELECT c.id,b.id,v.title,v.model,v.description,v.specs::jsonb,v.source_url,v.sort_order
FROM c CROSS JOIN b
JOIN (VALUES
 ('Sony','Sony Alpha 7R VI','Alpha 7R VI','بدنه بدون‌آینه فول‌فریم حرفه‌ای سونی؛ مناسب عکاسی با جزئیات بالا و کار استودیویی.','{"type":"Mirrorless","sensor":"Full-frame","use":"Photo / Studio"}','https://electronics.sony.com/imaging/interchangeable-lens-cameras',10),
 ('Sony','Sony Alpha 7 V','Alpha 7 V','بدنه هیبرید فول‌فریم نسل جدید سونی برای عکاسی و ویدئو حرفه‌ای.','{"type":"Mirrorless","sensor":"Full-frame","use":"Hybrid"}','https://electronics.sony.com/imaging/interchangeable-lens-cameras',20),
 ('Sony','Sony Alpha 1 II','Alpha 1 II','بدنه پرچم‌دار فول‌فریم سونی برای پروژه‌های حرفه‌ای سریع، تبلیغاتی و خبری.','{"type":"Mirrorless","sensor":"Full-frame","tier":"Flagship"}','https://electronics.sony.com/imaging/interchangeable-lens-cameras',30),
 ('Sony','Sony Alpha 9 III','Alpha 9 III','بدنه حرفه‌ای سرعت‌بالا برای اکشن، عروسی و رویداد.','{"type":"Mirrorless","sensor":"Full-frame","use":"Sports / Event"}','https://electronics.sony.com/imaging/interchangeable-lens-cameras',40),
 ('Sony','Sony Alpha 7R V','Alpha 7R V','بدنه فول‌فریم رزولوشن‌بالا برای پرتره، فشن و تبلیغات.','{"type":"Mirrorless","sensor":"Full-frame","use":"Portrait / Commercial"}','https://electronics.sony.com/imaging/interchangeable-lens-cameras',50),
 ('Sony','Sony Alpha 7C II','Alpha 7C II','بدنه فول‌فریم کامپکت مناسب پروژه‌های سبک و تولید محتوا.','{"type":"Mirrorless","sensor":"Full-frame","use":"Hybrid / Travel"}','https://electronics.sony.com/imaging/interchangeable-lens-cameras',60),
 ('Sony','Sony Alpha 7CR','Alpha 7CR','بدنه فول‌فریم کامپکت رزولوشن‌بالا برای عکاسی حرفه‌ای سبک.','{"type":"Mirrorless","sensor":"Full-frame","use":"High resolution"}','https://electronics.sony.com/imaging/interchangeable-lens-cameras',70),
 ('Sony','Sony Alpha 7 IV','Alpha 7 IV','بدنه هیبرید فول‌فریم محبوب برای عروسی، پرتره و ویدئو.','{"type":"Mirrorless","sensor":"Full-frame","use":"Wedding / Hybrid"}','https://electronics.sony.com/imaging/interchangeable-lens-cameras',80),
 ('Sony','Sony Alpha 6700','Alpha 6700','بدنه APS-C حرفه‌ای و سبک برای عکاسی و ویدئو.','{"type":"Mirrorless","sensor":"APS-C","use":"Hybrid"}','https://electronics.sony.com/imaging/interchangeable-lens-cameras',90),
 ('Sony','Sony FX2','FX2','دوربین سینمایی کامپکت سری Cinema Line برای تولید ویدئو حرفه‌ای.','{"type":"Cinema","sensor":"Full-frame","use":"Video / Cinema"}','https://electronics.sony.com/imaging/cinema-line-cameras',100),
 ('Canon','Canon EOS R6 V','EOS R6 V','بدنه فول‌فریم هیبرید جدید کانن برای عکاسی و ویدئو حرفه‌ای.','{"type":"Mirrorless","sensor":"Full-frame","use":"Hybrid"}','https://www.usa.canon.com/shop/cameras/mirrorless-cameras',10),
 ('Canon','Canon EOS R6 Mark III','EOS R6 Mark III','بدنه فول‌فریم حرفه‌ای نسل جدید سری R6 برای عروسی و رویداد.','{"type":"Mirrorless","sensor":"Full-frame","use":"Wedding / Event"}','https://www.usa.canon.com/shop/cameras/mirrorless-cameras',20),
 ('Canon','Canon EOS R1','EOS R1','بدنه پرچم‌دار فول‌فریم کانن برای ورزش، خبر و پروژه‌های حرفه‌ای.','{"type":"Mirrorless","sensor":"Full-frame","tier":"Flagship"}','https://www.usa.canon.com/shop/cameras/mirrorless-cameras',30),
 ('Canon','Canon EOS R5 Mark II','EOS R5 Mark II','بدنه فول‌فریم رزولوشن‌بالا و هیبرید برای عکس و فیلم حرفه‌ای.','{"type":"Mirrorless","sensor":"Full-frame","use":"Commercial / Hybrid"}','https://www.usa.canon.com/shop/cameras/mirrorless-cameras',40),
 ('Canon','Canon EOS R3','EOS R3','بدنه فول‌فریم سرعت‌بالا برای عکاسی رویداد و اکشن.','{"type":"Mirrorless","sensor":"Full-frame","use":"Sports / Event"}','https://www.usa.canon.com/shop/cameras/mirrorless-cameras',50),
 ('Canon','Canon EOS R8','EOS R8','بدنه فول‌فریم سبک برای عکاسی و تولید محتوای حرفه‌ای سبک.','{"type":"Mirrorless","sensor":"Full-frame","use":"Hybrid / Travel"}','https://www.usa.canon.com/shop/cameras/mirrorless-cameras',60),
 ('Canon','Canon EOS R7','EOS R7','بدنه APS-C پیشرفته برای عکاسی سریع و ویدئو.','{"type":"Mirrorless","sensor":"APS-C","use":"Sports / Hybrid"}','https://www.usa.canon.com/shop/cameras/mirrorless-cameras',70),
 ('Canon','Canon EOS R10','EOS R10','بدنه APS-C سبک و سریع برای عکاسی و ویدئو.','{"type":"Mirrorless","sensor":"APS-C","use":"Hybrid"}','https://www.usa.canon.com/shop/cameras/mirrorless-cameras',80),
 ('Canon','Canon EOS R50 V','EOS R50 V','بدنه APS-C ویدئومحور برای تولید محتوا و ویدئو.','{"type":"Mirrorless","sensor":"APS-C","use":"Video / Creator"}','https://www.usa.canon.com/shop/cameras/mirrorless-cameras',90),
 ('Canon','Canon EOS R50','EOS R50','بدنه APS-C کامپکت برای عکاسی و تولید محتوا.','{"type":"Mirrorless","sensor":"APS-C","use":"Creator"}','https://www.usa.canon.com/shop/cameras/mirrorless-cameras',100),
 ('Nikon','Nikon Z5IIC','Z5IIC','بدنه فول‌فریم جدید نیکون با طراحی جمع‌وجور و قابلیت‌های هیبرید.','{"type":"Mirrorless","sensor":"Full-frame","use":"Hybrid"}','https://www.nikonusa.com/c/cameras/mirrorless-cameras/overview',10),
 ('Nikon','Nikon ZR','ZR','دوربین ویدئومحور سری Z برای تولید حرفه‌ای تصویر متحرک.','{"type":"Mirrorless / Cinema","use":"Video / Cinema"}','https://www.nikonusa.com/c/cameras/mirrorless-cameras/overview',20),
 ('Nikon','Nikon Z9','Z9','بدنه پرچم‌دار فول‌فریم نیکون برای ورزش، خبر و پروژه‌های سنگین.','{"type":"Mirrorless","sensor":"Full-frame","tier":"Flagship"}','https://www.nikonusa.com/c/cameras/mirrorless-cameras/overview',30),
 ('Nikon','Nikon Z8','Z8','بدنه فول‌فریم حرفه‌ای رزولوشن و سرعت بالا برای عکس و فیلم.','{"type":"Mirrorless","sensor":"Full-frame","use":"Commercial / Hybrid"}','https://www.nikonusa.com/c/cameras/mirrorless-cameras/overview',40),
 ('Nikon','Nikon Z6III','Z6III','بدنه فول‌فریم هیبرید حرفه‌ای مناسب عروسی، پرتره و ویدئو.','{"type":"Mirrorless","sensor":"Full-frame","use":"Wedding / Hybrid"}','https://www.nikonusa.com/c/cameras/mirrorless-cameras/overview',50),
 ('Nikon','Nikon Z5II','Z5II','بدنه فول‌فریم میان‌رده پیشرفته برای عکاسی و ویدئو.','{"type":"Mirrorless","sensor":"Full-frame","use":"Hybrid"}','https://www.nikonusa.com/c/cameras/mirrorless-cameras/overview',60),
 ('Nikon','Nikon Zf','Zf','بدنه فول‌فریم با طراحی کلاسیک و امکانات مدرن عکاسی/ویدئو.','{"type":"Mirrorless","sensor":"Full-frame","use":"Portrait / Hybrid"}','https://www.nikonusa.com/c/cameras/mirrorless-cameras/overview',70),
 ('Nikon','Nikon Z50II','Z50II','بدنه APS-C جدید و سبک برای عکاسی، سفر و تولید محتوا.','{"type":"Mirrorless","sensor":"APS-C","use":"Hybrid / Creator"}','https://www.nikonusa.com/c/cameras/mirrorless-cameras/overview',80),
 ('Nikon','Nikon Z30','Z30','بدنه APS-C کامپکت و ویدئومحور برای تولید محتوا.','{"type":"Mirrorless","sensor":"APS-C","use":"Creator / Video"}','https://www.nikonusa.com/cameras/mirrorless-cameras',90),
 ('Nikon','Nikon Z7II','Z7II','بدنه فول‌فریم رزولوشن‌بالا مناسب منظره، پرتره و استودیو.','{"type":"Mirrorless","sensor":"Full-frame","use":"High resolution"}','https://www.nikonusa.com/cameras/mirrorless-cameras',100)
) AS v(brand,title,model,description,specs,source_url,sort_order) ON v.brand=b.name
ON CONFLICT DO NOTHING;

-- Lens starter bank
WITH c AS (SELECT id FROM equipment_global_categories WHERE code='lens'),
     b AS (SELECT id,name FROM equipment_global_brands)
INSERT INTO equipment_global_products(category_id,brand_id,title,model,description,specs,source_url,sort_order)
SELECT c.id,b.id,v.title,v.model,v.description,v.specs::jsonb,v.source_url,v.sort_order
FROM c CROSS JOIN b
JOIN (VALUES
 ('Sony','Sony FE 24-70mm F2.8 GM II','FE 24-70mm F2.8 GM II','زوم استاندارد حرفه‌ای برای عروسی، پرتره و رویداد.','{"mount":"Sony E","type":"Zoom","aperture":"f/2.8"}','https://electronics.sony.com/imaging/lenses',110),
 ('Sony','Sony FE 70-200mm F2.8 GM OSS II','FE 70-200mm F2.8 GM OSS II','تله‌زوم حرفه‌ای سریع برای عروسی، پرتره و رویداد.','{"mount":"Sony E","type":"Zoom","aperture":"f/2.8"}','https://electronics.sony.com/imaging/lenses',120),
 ('Sony','Sony FE 16-35mm F2.8 GM II','FE 16-35mm F2.8 GM II','وایدزوم حرفه‌ای برای معماری، مراسم و ویدئو.','{"mount":"Sony E","type":"Zoom","aperture":"f/2.8"}','https://electronics.sony.com/imaging/lenses',130),
 ('Sony','Sony FE 85mm F1.4 GM II','FE 85mm F1.4 GM II','پرایم پرتره حرفه‌ای با دیافراگم باز.','{"mount":"Sony E","type":"Prime","aperture":"f/1.4"}','https://electronics.sony.com/imaging/lenses',140),
 ('Sony','Sony FE 50mm F1.2 GM','FE 50mm F1.2 GM','پرایم نرمال بسیار سریع برای پرتره و نور کم.','{"mount":"Sony E","type":"Prime","aperture":"f/1.2"}','https://electronics.sony.com/imaging/lenses',150),
 ('Sony','Sony FE 35mm F1.4 GM','FE 35mm F1.4 GM','پرایم واید/نرمال برای مستند، عروسی و ویدئو.','{"mount":"Sony E","type":"Prime","aperture":"f/1.4"}','https://electronics.sony.com/imaging/lenses',160),
 ('Canon','Canon RF 24-70mm F2.8 L IS USM','RF 24-70mm F2.8 L IS USM','زوم استاندارد حرفه‌ای سری L برای مراسم و پرتره.','{"mount":"Canon RF","type":"Zoom","aperture":"f/2.8"}','https://www.usa.canon.com/shop/lenses',110),
 ('Canon','Canon RF 70-200mm F2.8 L IS USM Z','RF 70-200mm F2.8 L IS USM Z','تله‌زوم حرفه‌ای سری L مناسب رویداد و ویدئو.','{"mount":"Canon RF","type":"Zoom","aperture":"f/2.8"}','https://www.usa.canon.com/shop/lenses',120),
 ('Canon','Canon RF 15-35mm F2.8 L IS USM','RF 15-35mm F2.8 L IS USM','وایدزوم حرفه‌ای برای معماری، مراسم و تولید ویدئو.','{"mount":"Canon RF","type":"Zoom","aperture":"f/2.8"}','https://www.usa.canon.com/shop/lenses',130),
 ('Canon','Canon RF 50mm F1.2 L USM','RF 50mm F1.2 L USM','پرایم نرمال سریع برای پرتره و نور کم.','{"mount":"Canon RF","type":"Prime","aperture":"f/1.2"}','https://www.usa.canon.com/shop/lenses',140),
 ('Canon','Canon RF 85mm F1.2 L USM','RF 85mm F1.2 L USM','پرایم تخصصی پرتره با دیافراگم بسیار باز.','{"mount":"Canon RF","type":"Prime","aperture":"f/1.2"}','https://www.usa.canon.com/shop/lenses',150),
 ('Canon','Canon RF 35mm F1.4 L VCM','RF 35mm F1.4 L VCM','پرایم هیبرید حرفه‌ای برای عکس و ویدئو.','{"mount":"Canon RF","type":"Prime","aperture":"f/1.4"}','https://www.usa.canon.com/shop/lenses',160),
 ('Nikon','NIKKOR Z 24-70mm f/2.8 S II','NIKKOR Z 24-70mm f/2.8 S II','زوم استاندارد حرفه‌ای سری S برای پروژه‌های عروسی و تجاری.','{"mount":"Nikon Z","type":"Zoom","aperture":"f/2.8"}','https://www.nikonusa.com/c/lenses/mirrorless-lenses/overview',110),
 ('Nikon','NIKKOR Z 70-200mm f/2.8 VR S','NIKKOR Z 70-200mm f/2.8 VR S','تله‌زوم حرفه‌ای سری S برای پرتره و رویداد.','{"mount":"Nikon Z","type":"Zoom","aperture":"f/2.8"}','https://www.nikonusa.com/c/lenses/mirrorless-lenses/overview',120),
 ('Nikon','NIKKOR Z 14-24mm f/2.8 S','NIKKOR Z 14-24mm f/2.8 S','اولتراوایدزوم حرفه‌ای برای معماری، مراسم و ویدئو.','{"mount":"Nikon Z","type":"Zoom","aperture":"f/2.8"}','https://www.nikonusa.com/c/lenses/mirrorless-lenses/overview',130),
 ('Nikon','NIKKOR Z 50mm f/1.2 S','NIKKOR Z 50mm f/1.2 S','پرایم نرمال حرفه‌ای برای پرتره و نور کم.','{"mount":"Nikon Z","type":"Prime","aperture":"f/1.2"}','https://www.nikonusa.com/c/lenses/mirrorless-lenses/overview',140),
 ('Nikon','NIKKOR Z 85mm f/1.2 S','NIKKOR Z 85mm f/1.2 S','پرایم تخصصی پرتره سری S با دیافراگم باز.','{"mount":"Nikon Z","type":"Prime","aperture":"f/1.2"}','https://www.nikonusa.com/c/lenses/mirrorless-lenses/overview',150),
 ('Nikon','NIKKOR Z 135mm f/1.8 S Plena','NIKKOR Z 135mm f/1.8 S Plena','پرایم تله پرتره حرفه‌ای برای بوکه و جداسازی سوژه.','{"mount":"Nikon Z","type":"Prime","aperture":"f/1.8"}','https://www.nikonusa.com/c/lenses/mirrorless-lenses/overview',160)
) AS v(brand,title,model,description,specs,source_url,sort_order) ON v.brand=b.name
ON CONFLICT DO NOTHING;

-- Generic photo/video gear templates (brand-free, fully editable by admin)
WITH c AS (SELECT id,code FROM equipment_global_categories WHERE code IN ('photo_gear','video_gear'))
INSERT INTO equipment_global_products(category_id,brand_id,title,model,description,specs,sort_order)
SELECT c.id,NULL,v.title,NULL,v.description,'{}'::jsonb,v.sort_order
FROM c JOIN (VALUES
 ('photo_gear','فلاش اکسترنال','فلاش روی دوربین برای مراسم، پرتره و نور مکمل.',10),
 ('photo_gear','فلاش استودیویی','فلاش پرقدرت استودیویی برای پرتره و تبلیغات.',20),
 ('photo_gear','تریگر بی‌سیم فلاش','فرستنده/گیرنده برای کنترل و همگام‌سازی فلاش‌ها.',30),
 ('photo_gear','سافت‌باکس','شکل‌دهنده نور نرم برای پرتره و محصول.',40),
 ('photo_gear','چتر نور','اصلاح‌کننده نور سبک و سریع برای استودیو و لوکیشن.',50),
 ('photo_gear','رفلکتور ۵کاره','رفلکتور چندسطحی برای کنترل نور در پرتره.',60),
 ('photo_gear','سه‌پایه عکاسی','سه‌پایه پایدار برای عکاسی استودیو، محصول و لانگ‌اکسپوژر.',70),
 ('photo_gear','مونوپاد','ساپورت سبک و سریع برای دوربین و لنز تله.',80),
 ('photo_gear','پایه نور','پایه قابل تنظیم برای فلاش، LED و اصلاح‌کننده‌های نور.',90),
 ('photo_gear','کیت بک‌گراند و پایه','پایه و نگهدارنده بک‌گراند برای عکاسی استودیویی.',100),
 ('photo_gear','کارت حافظه پرسرعت','کارت حافظه مناسب عکاسی پیاپی و فایل‌های حجیم.',110),
 ('photo_gear','باتری یدک دوربین','باتری اضافه برای پروژه‌های طولانی و مراسم.',120),
 ('photo_gear','فیلتر ND / پلاریزه','فیلتر کنترل نور یا بازتاب برای عکس و ویدئو.',130),
 ('video_gear','گیمبال سه‌محوره','تثبیت‌کننده حرکتی برای فیلم‌برداری روان.',10),
 ('video_gear','میکروفون بی‌سیم دوفرستنده','سیستم میکروفون بی‌سیم برای مصاحبه و مراسم.',20),
 ('video_gear','میکروفون شاتگان','میکروفون جهت‌دار برای دوربین، بوم و ضبط لوکیشن.',30),
 ('video_gear','رکوردر صدا','ضبط‌کننده مستقل صدا برای تولید حرفه‌ای.',40),
 ('video_gear','مانیتور رکوردر','مانیتور خارجی با قابلیت پایش و ضبط ویدئو.',50),
 ('video_gear','مانیتور روی دوربین','نمایشگر خارجی برای کادربندی و فوکوس دقیق.',60),
 ('video_gear','نور COB ویدئویی','نور پیوسته پرقدرت برای فیلم‌برداری و استودیو.',70),
 ('video_gear','پنل LED','نور پیوسته سبک و قابل حمل برای مصاحبه و لوکیشن.',80),
 ('video_gear','سه‌پایه ویدیویی هد فلوید','سه‌پایه با هد روان برای پن و تیلت ویدئویی.',90),
 ('video_gear','ویدئو ترنسمیتر بی‌سیم','انتقال بی‌سیم تصویر به مانیتور یا کارگردان.',100),
 ('video_gear','فالو فوکوس','کنترل دقیق فوکوس برای فیلم‌برداری سینمایی.',110),
 ('video_gear','تله‌پرامپتر','نمایش متن جلوی لنز برای اجرا و تولید محتوا.',120),
 ('video_gear','کپچرکارت HDMI','ورودی تصویر دوربین برای استریم یا ضبط روی کامپیوتر.',130)
) AS v(code,title,description,sort_order) ON v.code=c.code
ON CONFLICT DO NOTHING;
