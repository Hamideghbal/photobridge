-- PhotoBridge v836 — complete the built-in Sony/Canon/Nikon professional lens preset photo bank.
-- Only empty galleries are seeded so admin-managed galleries remain authoritative.
WITH targets(brand,model,images) AS (
  VALUES
  ('Sony','FE 24-70mm F2.8 GM II','["https://cdn2.cellphones.com.vn/x/media/catalog/product/s/s/ssss_2__1_6.png"]'::jsonb),
  ('Sony','FE 70-200mm F2.8 GM OSS II','["https://www.districtcamera.com/cdn/shop/files/027242923768_2.jpg?v=1727676612&width=1200"]'::jsonb),
  ('Sony','FE 16-35mm F2.8 GM II','["https://www.jpckemang.com/assets/img/products/Sony_FE_16-35mm_F2_8_GM_II_3.jpg"]'::jsonb),
  ('Sony','FE 85mm F1.4 GM II','["https://besenicar.si/40611-thickbox_default/sony-objektiv-fe-85mm-f14-gm-ii-sel85f14gm2b.jpg"]'::jsonb),
  ('Sony','FE 50mm F1.2 GM','["https://www.glazerscamera.com/cdn/shop/files/SEL50F12GM_C_68976_700x700.jpg?v=1770667820"]'::jsonb),
  ('Sony','FE 35mm F1.4 GM','["https://static.cmra.nu/173/1733836515_357.jpg"]'::jsonb),
  ('Canon','RF 24-70mm F2.8 L IS USM','["https://abfoto.pl/userdata/public/gfx/7731/Canon-RF-24-70-mm-f2.8-L-IS-USM.webp"]'::jsonb),
  ('Canon','RF 70-200mm F2.8 L IS USM Z','["https://www.ashtonlittle.com/acatalog/CanonRF70-200mmf28LISUSMZ-1.jpg"]'::jsonb),
  ('Canon','RF 15-35mm F2.8 L IS USM','["https://images.squarespace-cdn.com/content/v1/53ab534be4b0e7d61404f70e/1603581658459-R9C5FB3AQJQZJFOB454W/RF%2B15-35%2BF2.8L%2BIS.jpg"]'::jsonb),
  ('Canon','RF 50mm F1.2 L USM','["https://dslr.pk/wp-content/uploads/2025/02/1-Canon-RF-50mm-F1.2-L-USM.jpg"]'::jsonb),
  ('Canon','RF 85mm F1.2 L USM','["https://cameraservice.it/cdn/shop/files/3447c005aa_rf-85mm-f1-2l-usm_04.jpg?v=1739357644"]'::jsonb),
  ('Canon','RF 35mm F1.4 L VCM','["https://www.e-trend.co.jp/item_data/01/27/84/01278459/images/01278459_01.jpg"]'::jsonb),
  ('Nikon','NIKKOR Z 24-70mm f/2.8 S II','["https://www.castlecameras.co.uk/images/products/large/23719.jpg"]'::jsonb),
  ('Nikon','NIKKOR Z 70-200mm f/2.8 VR S','["https://www.nikon.com.au/media/wysiwyg/NIKKORZ70200mmf28VRS/V2-z-mount-nikkor-z-70-20mm-f2.8-mirrorless-lens-nikon-cameras-lenses-accessories.png"]'::jsonb),
  ('Nikon','NIKKOR Z 14-24mm f/2.8 S','["https://cdn11.bigcommerce.com/s-b8f2f/images/stencil/1280x1280/products/1114/5560/z1424f2801__17468.1748792242.jpg?c=2"]'::jsonb),
  ('Nikon','NIKKOR Z 50mm f/1.2 S','["https://fotocuratolo.it/prodotti/3235/XXL/3235foto.jpg"]'::jsonb),
  ('Nikon','NIKKOR Z 85mm f/1.2 S','["https://static.wixstatic.com/media/ddb924_3e01c737b0ac44cd8f0f49d22c77707c~mv2.jpg/v1/fill/w_980%2Ch_1369%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/ddb924_3e01c737b0ac44cd8f0f49d22c77707c~mv2.jpg"]'::jsonb),
  ('Nikon','NIKKOR Z 135mm f/1.8 S Plena','["https://img.vistek.net/prodimg/xlarge/461781.jpg"]'::jsonb)
)
UPDATE equipment_global_products p
SET image_urls=t.images, updated_at=now()
FROM targets t
JOIN equipment_global_brands b
  ON lower(btrim(b.name))=lower(btrim(t.brand))
 AND b.deleted_at IS NULL
WHERE p.brand_id=b.id
  AND lower(btrim(COALESCE(NULLIF(p.model,''),p.title)))=lower(btrim(t.model))
  AND p.deleted_at IS NULL
  AND (p.image_urls IS NULL OR jsonb_typeof(p.image_urls)<>'array' OR jsonb_array_length(p.image_urls)=0);
