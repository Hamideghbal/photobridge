-- v0.17.78 — add the second built-in photographer guide without overwriting admin-managed guides.
INSERT INTO platform_settings(key,value,updated_at)
VALUES(
  'video_guides',
  jsonb_build_object('guides', jsonb_build_array(
    jsonb_build_object(
      'id','photographer-signup','title','عضویت عکاس در PhotoBridge',
      'description','از صفحه اصلی تا ساخت حساب، انتخاب موقعیت و تأیید شماره موبایل را قدم‌به‌قدم ببین.',
      'category','شروع کار عکاس','duration','۲:۰۱','active',true,'featured',true,'sortOrder',10,
      'legacySrc','/guides/photographer-signup.mp4','legacyPoster','/guides/photographer-signup-poster.jpg',
      'videoKey',null,'posterKey',null,'videoName','photographer-signup.mp4','posterName','photographer-signup-poster.jpg',
      'videoContentType','video/mp4','posterContentType','image/jpeg'
    ),
    jsonb_build_object(
      'id','photographer-send-order','title','ارسال عکس برای چاپ به لابراتوار',
      'description','از انتخاب فایل و کنترل سایز تا مرور سفارش، آپلود و پیگیری ارسال را مرحله‌به‌مرحله ببین.',
      'category','سفارش چاپ عکاس','duration','۱۰:۳۳','active',true,'featured',false,'sortOrder',20,
      'legacySrc','/guides/photographer-send-order.mp4','legacyPoster','/guides/photographer-send-order-poster.jpg',
      'videoKey',null,'posterKey',null,'videoName','photographer-send-order.mp4','posterName','photographer-send-order-poster.jpg',
      'videoContentType','video/mp4','posterContentType','image/jpeg'
    )
  )),
  now()
)
ON CONFLICT(key) DO NOTHING;

UPDATE platform_settings
SET value = jsonb_set(
      CASE WHEN jsonb_typeof(value)='object' THEN value ELSE '{}'::jsonb END,
      '{guides}',
      COALESCE(value->'guides','[]'::jsonb) || jsonb_build_array(
        jsonb_build_object(
          'id','photographer-send-order','title','ارسال عکس برای چاپ به لابراتوار',
          'description','از انتخاب فایل و کنترل سایز تا مرور سفارش، آپلود و پیگیری ارسال را مرحله‌به‌مرحله ببین.',
          'category','سفارش چاپ عکاس','duration','۱۰:۳۳','active',true,'featured',false,'sortOrder',20,
          'legacySrc','/guides/photographer-send-order.mp4','legacyPoster','/guides/photographer-send-order-poster.jpg',
          'videoKey',null,'posterKey',null,'videoName','photographer-send-order.mp4','posterName','photographer-send-order-poster.jpg',
          'videoContentType','video/mp4','posterContentType','image/jpeg'
        )
      ),
      true
    ),
    updated_at=now()
WHERE key='video_guides'
  AND NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(COALESCE(value->'guides','[]'::jsonb)) AS g
    WHERE g->>'id'='photographer-send-order'
  );
