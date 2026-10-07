-- PhotoBridge v835 — fill additional empty camera preset galleries with verified product-image URLs.
-- Only empty galleries are updated; admin-managed images always remain authoritative.
WITH targets(brand,model,images) AS (
  VALUES
  ('Sony','Alpha 6700','["https://prophotosupply.com/cdn/shop/files/ILCE-6700_front-3000px.png?v=1689180592&width=1445"]'::jsonb),
  ('Canon','EOS R7','["https://nextdaydeal.co.uk/cdn/shop/products/f.jpg?v=1656670690"]'::jsonb),
  ('Canon','EOS R3','["https://paylessphotolb.com/cdn/shop/files/Canon_EOS_R3_Mirrorless_Camera_Body.png?v=1779892629"]'::jsonb),
  ('Canon','EOS R50','["https://promart.vteximg.com.br/arquivos/ids/10067420-700-700/1748810-REG.jpg?v=639054713668400000"]'::jsonb),
  ('Nikon','ZR','["https://www.orfoteknik.com/idea/rq/53/myassets/products/371/image-1950.webp?revision=1776684021"]'::jsonb),
  ('Nikon','Z30','["https://i5.walmartimages.com/seo/Nikon-Z30-Mirrorless-Camera-Body-Only_938084fd-f000-4d3e-b359-ec51b2e8ef2b.1d5201e8a0964c2c6ff3e4ad0e9a689b.jpeg"]'::jsonb),
  ('Nikon','Z7II','["https://www.fujiya-camera.co.jp/img/goods/L/C4960759905697_5acbc4e8b345431e8abb2c778c9953dc.jpg"]'::jsonb)
)
UPDATE equipment_global_products p
SET image_urls=t.images, updated_at=now()
FROM targets t
JOIN equipment_global_brands b ON lower(btrim(b.name))=lower(btrim(t.brand)) AND b.deleted_at IS NULL
WHERE p.brand_id=b.id
  AND lower(btrim(COALESCE(NULLIF(p.model,''),p.title)))=lower(btrim(t.model))
  AND p.deleted_at IS NULL
  AND (p.image_urls IS NULL OR jsonb_typeof(p.image_urls)<>'array' OR jsonb_array_length(p.image_urls)=0);
