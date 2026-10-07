-- PhotoBridge v831 — starter real-product image galleries for central camera presets.
-- Images are stored as remote URLs in the central admin-managed bank. This migration only fills empty galleries
-- so later admin edits/uploads are never overwritten by deployment.

WITH targets(brand,model,images) AS (
  VALUES
  ('Sony','Alpha 7 IV','[
    "https://www.capesindia.com/cdn/shop/files/sony-a7-iv-front-back_696015bb-1423-41de-bdb1-56f6a3a7797e.jpg?v=1694752829&width=800",
    "https://www.techspot.com/images2/news/bigimage/2021/10/2021-10-21-image-10.jpg",
    "https://cdn.mos.cms.futurecdn.net/sLdsrnvVtCgyBTRoPjket4.jpg"
  ]'::jsonb),
  ('Sony','Alpha 7R V','[
    "https://www.imax.co.cr/cdn/shop/products/sony_alpha_camera_1731389.jpg?v=1762274788&width=2500",
    "https://store.bandccamera.com/cdn/shop/products/79ab2f53002bcbc85ded3fe5b21de949.png?v=1702423714&width=1024",
    "https://images.crutchfieldonline.com/ImageHandler/trim/869/652/products/2022/43/158/g158A7RV-o_other4.jpg",
    "https://img1.kakaku.k-img.com/images/maga/18903/img13.jpg"
  ]'::jsonb),
  ('Sony','Alpha 9 III','[
    "https://staticg.sportskeeda.com/editor/2024/06/e5a06-17196733505682-1920.jpg",
    "https://cameratek.co.za/cdn/shop/files/sony-alpha-a9-iii-mirrorless-camera-camsoila9m3-outdoorphoto-25.jpg?v=1708073264&width=2500",
    "https://www.texasmediasystems.com/assets/images/ILCE-9M3_lcd_horizontal_1.jpg",
    "https://fotokoeberl.at/wp-content/uploads/2023/11/sony_alpha_9_iii_06.jpg"
  ]'::jsonb),
  ('Canon','EOS R5 Mark II','[
    "https://cdn11.bigcommerce.com/s-745x53acpn/images/stencil/1280x1280/products/10362/31585/EOSR5MII_2_copy__37892.1771608463.jpg?c=2",
    "https://capes.co/cdn/shop/files/canon-eos-r5-mark-II-front-back-base-image_b8cbb573-b6e4-4983-8921-6b83d0ccc2f7.png?v=1752041836&width=2048",
    "https://www.castlecameras.co.uk/images/products/large/20635d.jpg",
    "https://www.cined.com/content/uploads/2024/07/Canon-EOS-R5-Mark-II-sides.jpg",
    "https://cdn.uniquephoto.com/resources/uniquephoto/images/products/processed/CND4795.detail.e.png"
  ]'::jsonb),
  ('Nikon','Z8','[
    "https://www.bigcamera.com.tw/data/editor_upload/images/Z8%202.jpg",
    "https://images.fonearena.com/blog/wp-content/uploads/2023/05/Nikon-Z8-Mirrorless-Camera.jpg",
    "https://cdn.uniquephoto.com/resources/uniquephoto/images/products/processed/NKD1695.superZoom.d.png",
    "https://d3mv25xx38w2jn.cloudfront.net/500x500/Photo/MirrorlessCameras/nikon_1695_7.jpg"
  ]'::jsonb)
)
UPDATE equipment_global_products p
SET image_urls=t.images, updated_at=now()
FROM targets t
JOIN equipment_global_brands b ON b.name=t.brand AND b.deleted_at IS NULL
WHERE p.brand_id=b.id
  AND p.model=t.model
  AND p.deleted_at IS NULL
  AND (p.image_urls IS NULL OR jsonb_array_length(p.image_urls)=0);
