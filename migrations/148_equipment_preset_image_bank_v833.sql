-- PhotoBridge v833 — extend the starter preset photo bank for the first/default camera rows.
-- Only empty galleries are filled; any admin-managed images remain authoritative.
WITH targets(brand,model,images) AS (
  VALUES
  ('Sony','Alpha 7R VI','[
    "https://kyma.vn/StoreData/images/Product/sony-alpha-a7r-vi.jpg",
    "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/8803c46a-2217-429d-975e-ec4b9c66ef28.jpg",
    "https://alphauniverseglobal.media.zestyio.com/alpha-universe-ILCE-7RM6_MAIN.jpg"
  ]'::jsonb),
  ('Sony','Alpha 7 V','[
    "https://thecamerastore.com/cdn/shop/files/Sony-a7-V-Body-07_800x.jpg?v=1764695753",
    "https://img1.kakaku.k-img.com/Images/news_icv/900xM900/2025120/20251203093816_456_.jpg"
  ]'::jsonb),
  ('Canon','EOS R6 V','[
    "https://www.outdoorphoto.co.za/cdn/shop/files/canon-eos-r6-v-mirrorless-camera-10.jpg?v=1778751922&width=1946"
  ]'::jsonb),
  ('Sony','Alpha 7 IV','[
    "https://www.capesindia.com/cdn/shop/files/sony-a7-iv-front-back_696015bb-1423-41de-bdb1-56f6a3a7797e.jpg?v=1694752829&width=800",
    "https://www.techspot.com/images2/news/bigimage/2021/10/2021-10-21-image-10.jpg",
    "https://cdn.mos.cms.futurecdn.net/sLdsrnvVtCgyBTRoPjket4.jpg"
  ]'::jsonb),
  ('Sony','Alpha 7R V','[
    "https://www.imax.co.cr/cdn/shop/products/sony_alpha_camera_1731389.jpg?v=1762274788&width=2500",
    "https://store.bandccamera.com/cdn/shop/products/79ab2f53002bcbc85ded3fe5b21de949.png?v=1702423714&width=1024",
    "https://images.crutchfieldonline.com/ImageHandler/trim/869/652/products/2022/43/158/g158A7RV-o_other4.jpg"
  ]'::jsonb),
  ('Sony','Alpha 9 III','[
    "https://staticg.sportskeeda.com/editor/2024/06/e5a06-17196733505682-1920.jpg",
    "https://cameratek.co.za/cdn/shop/files/sony-alpha-a9-iii-mirrorless-camera-camsoila9m3-outdoorphoto-25.jpg?v=1708073264&width=2500",
    "https://www.texasmediasystems.com/assets/images/ILCE-9M3_lcd_horizontal_1.jpg"
  ]'::jsonb),
  ('Canon','EOS R5 Mark II','[
    "https://old.yarkiy.ru/system/uploads/preview/photo_storage/299947/eos-r5-mark-ii_gallery_01_8504542d32ec4b8c99e4437d2fae31ff.jpg",
    "https://cdn11.bigcommerce.com/s-745x53acpn/images/stencil/1280x1280/products/10362/31585/EOSR5MII_2_copy__37892.1771608463.jpg?c=2",
    "https://capes.co/cdn/shop/files/canon-eos-r5-mark-II-front-back-base-image_b8cbb573-b6e4-4983-8921-6b83d0ccc2f7.png?v=1752041836&width=2048"
  ]'::jsonb),
  ('Nikon','Z8','[
    "https://www.bigcamera.com.tw/data/editor_upload/images/Z8%202.jpg",
    "https://images.fonearena.com/blog/wp-content/uploads/2023/05/Nikon-Z8-Mirrorless-Camera.jpg",
    "https://cdn.uniquephoto.com/resources/uniquephoto/images/products/processed/NKD1695.superZoom.d.png"
  ]'::jsonb)
)
UPDATE equipment_global_products p
SET image_urls=t.images, updated_at=now()
FROM targets t
JOIN equipment_global_brands b ON lower(btrim(b.name))=lower(btrim(t.brand)) AND b.deleted_at IS NULL
WHERE p.brand_id=b.id
  AND lower(btrim(COALESCE(NULLIF(p.model,''),p.title)))=lower(btrim(t.model))
  AND p.deleted_at IS NULL
  AND (p.image_urls IS NULL OR jsonb_typeof(p.image_urls)<>'array' OR jsonb_array_length(p.image_urls)=0);
