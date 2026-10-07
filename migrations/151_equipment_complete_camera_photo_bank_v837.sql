-- PhotoBridge v837 — fill every remaining EMPTY built-in camera preset gallery.
-- Admin-managed galleries stay authoritative and are never overwritten.
WITH targets(brand,model,images) AS (
  VALUES
  ('Sony','Alpha 1 II','["https://commons.wikimedia.org/wiki/Special:Redirect/file/Sony_a1_II.jpg"]'::jsonb),
  ('Sony','Alpha 7C II','["https://commons.wikimedia.org/wiki/Special:Redirect/file/Sony_A7C_II_by_Henry_S%C3%B6derlund.jpg"]'::jsonb),
  ('Sony','Alpha 7CR','["https://commons.wikimedia.org/wiki/Special:Redirect/file/Sony_A7CR_by_Henry_S%C3%B6derlund.jpg"]'::jsonb),
  ('Sony','FX2','["https://www.photura.com/cdn/shop/files/ILMEFX2BODY_Sony_Web_001.jpg?v=1756760795&width=1000"]'::jsonb),
  ('Canon','EOS R6 Mark III','["https://commons.wikimedia.org/wiki/Special:Redirect/file/Canon_EOS_R6_Mark_III_26_nov_2025c.jpg"]'::jsonb),
  ('Canon','EOS R1','["https://commons.wikimedia.org/wiki/Special:Redirect/file/Canon_EOS_R1_12_apr_2025e.jpg"]'::jsonb),
  ('Canon','EOS R8','["https://commons.wikimedia.org/wiki/Special:Redirect/file/Canon_EOS_R8_(52853735946).jpg"]'::jsonb),
  ('Canon','EOS R10','["https://iglm.store/cdn/shop/files/379032.jpg?v=1767666572&width=1500"]'::jsonb),
  ('Canon','EOS R50 V','["https://cdn.awsli.com.br/800x800/2607/2607202/produto/358684109/canon-eos-r50-v-kit-01-07qenzgo0l.jpg"]'::jsonb),
  ('Nikon','Z5IIC','["/equipment-fallback/camera.svg"]'::jsonb),
  ('Nikon','Z9','["https://commons.wikimedia.org/wiki/Special:Redirect/file/Nikon_Z9.jpg"]'::jsonb),
  ('Nikon','Z6III','["https://commons.wikimedia.org/wiki/Special:Redirect/file/Nikon_Z6III_13_jul_2024e.jpg"]'::jsonb),
  ('Nikon','Z5II','["https://shopping.jreast.co.jp/media/shop/S490/product/S490-Z5II-BODY/z5ii-body.jpg"]'::jsonb),
  ('Nikon','Zf','["https://storage.ghost.io/c/0b/89/0b891f84-2f36-4046-96b4-24790c248bde/content/images/size/w960/2024/12/Nikon-ZF.png"]'::jsonb),
  ('Nikon','Z50II','["https://www.nikon-mea.com/media/catalog/product/0/3/03_z50ii_front.png?canvas=%3A&fit=bounds&format=jpeg&height=&optimize=high&width="]'::jsonb)
)
UPDATE equipment_global_products p
SET image_urls=t.images, updated_at=now()
FROM targets t
JOIN equipment_global_brands b ON lower(btrim(b.name))=lower(btrim(t.brand)) AND b.deleted_at IS NULL
WHERE p.brand_id=b.id
  AND lower(btrim(COALESCE(NULLIF(p.model,''),p.title)))=lower(btrim(t.model))
  AND p.deleted_at IS NULL
  AND (p.image_urls IS NULL OR jsonb_typeof(p.image_urls)<>'array' OR jsonb_array_length(p.image_urls)=0);
