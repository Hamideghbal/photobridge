// Run only against a disposable local database; this test creates local fixtures.
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
const { Pool } = require("pg");
const crypto = require("crypto");
(async () => {
  if (
    !process.env.DATABASE_URL?.includes("host=/workspace/photobridge-env/run")
  )
    throw new Error("Use the disposable onboarding database Unix socket");
  const db = new Pool({ connectionString: process.env.DATABASE_URL });
  const uid = "11111111-1111-4111-8111-111111111138",
    lab = "22222222-2222-4222-8222-222222222238",
    token = crypto.randomBytes(32).toString("base64url");
  if (process.env.SKIP_FIXTURES !== "1") {
    await db.query(
      `INSERT INTO users(id,name,mobile,password_hash,photographer_enabled,mobile_verified_at) VALUES($1,'تست هدر موبایل','09120000038','local-test-no-login',true,now()) ON CONFLICT(id) DO NOTHING`,
      [uid],
    );
    await db.query(
      `INSERT INTO photographer_profiles(user_id,studio_name,password_hash) VALUES($1,'عکاسی آزمایشی','local-test-no-login') ON CONFLICT(user_id) DO NOTHING`,
      [uid],
    );
    await db.query(
      `INSERT INTO labs(id,name,slug) VALUES($1,'لابراتوار آزمایشی','header-mobile-test') ON CONFLICT(id) DO NOTHING`,
      [lab],
    );
    await db.query(
      `INSERT INTO lab_memberships(lab_id,user_id,role) VALUES($1,$2,'customer') ON CONFLICT(lab_id,user_id) DO NOTHING`,
      [lab, uid],
    );
    await db.query(
      `UPDATE users SET photographer_active_lab_id=$2 WHERE id=$1`,
      [uid, lab],
    );
    await db.query(
      `INSERT INTO equipment_rental_shops(id,name,slug) VALUES($1,'فروشگاه آزمایشی','header-test-store') ON CONFLICT(id) DO NOTHING`,
      ["33333333-3333-4333-8333-333333333338"],
    );
    await db.query(
      `UPDATE platform_settings SET value=jsonb_set(value,'{enabled}','false'::jsonb) WHERE key='maintenance_mode'`,
    );
  }
  await db.query(
    `INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '1 hour')`,
    [uid, crypto.createHash("sha256").update(token).digest("hex")],
  );
  if (process.env.SKIP_FIXTURES !== "1")
    await db.query(
      `INSERT INTO equipment_rental_shop_memberships(shop_id,user_id,role) SELECT $1,$2,'photographer' WHERE NOT EXISTS (SELECT 1 FROM equipment_rental_shop_memberships WHERE shop_id=$1 AND user_id=$2 AND role='photographer')`,
      ["33333333-3333-4333-8333-333333333338", uid],
    );
  await db.end();
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: Number(process.env.MOBILE_WIDTH || 390), height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await context.addCookies([
    {
      name: "photobridge_photographer_session",
      value: token,
      url: "http://127.0.0.1:3000",
    },
  ]);
  const page = await context.newPage();
  const outputDir = process.env.SCREENSHOT_DIR || "/tmp";
  require("node:fs").mkdirSync(outputDir, { recursive: true });
  let storeGeometry;
  const pageErrors = [];
  page.on("pageerror", (e) => {
    pageErrors.push(e.message);
    console.log("PAGEERROR", e.message);
  });
  const assert=require('node:assert/strict');
  const frames=[];
  await page.exposeFunction('recordStoreEntry',snapshot=>frames.push(snapshot));
  await page.addInitScript(()=>{
    let baseline=null;
    const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return {top:r.top,height:r.height,bottom:r.bottom}};
    const snapshot=()=>({header:rect(document.querySelector('#pbF37PhotographerHeader')),sub:rect(document.querySelector('#pbF37Subheader')),content:rect(document.querySelector('.photographerMain>.photographerRolePageScrollArea')),title:document.querySelector('#pbF37ContextText')?.textContent,storeMode:document.body.classList.contains('pbF37StoreMode'),path:location.pathname});
    window.addEventListener('click',e=>{
      const el=e.target.closest('.photographerBottomAppNav button,.photographerBottomAppNavGrid button,.photographerStoreEntry,.photographerStoreMobileNav');
      if(el&&/فروشگاه/.test(el.textContent||el.getAttribute('aria-label')||'')&&location.pathname.startsWith('/photographer/'))baseline=snapshot();
    },true);
    function sample(){
      if(baseline&&location.pathname.startsWith('/photographer/'))window.recordStoreEntry({baseline,current:snapshot()});
      requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  await page.route('**/equipment-rental/book*',async route=>{
    if(route.request().isNavigationRequest()&&new URL(page.url()).pathname.startsWith('/photographer/'))await new Promise(resolve=>setTimeout(resolve,350));
    await route.continue();
  });
  for(const [url,title] of [
    ['/photographer/ai/retouch','هوش مصنوعی'],
    ['/photographer/gallery','گالری مشتریان'],
    ['/photographer/album-design','طراحی آلبوم'],
    ['/photographer/album-design?pb_mode=instagram','طراحی اینستاگرام'],
    ['/photographer/orders/flow?workspace=print','لابراتوار آزمایشی'],
  ]){
    await page.goto('http://127.0.0.1:3000'+url);
    await page.waitForTimeout(1400);
    if(await page.locator('#pbR99LabChooser [data-select]').count()){
      await page.locator('#pbR99LabChooser [data-select]').first().click();
      await page.waitForTimeout(1200);
    }
    await page.waitForFunction(t=>document.querySelector('#pbF37ContextText')?.textContent===t,title);
    const first=frames.length;
    await page.locator('.photographerBottomAppNav button,.photographerBottomAppNavGrid button').filter({hasText:/^فروشگاه$/}).first().click();
    await page.waitForURL(url=>url.pathname.startsWith('/equipment-rental'));
    await page.waitForFunction(()=>window.PBStorePhotographerHeaderCore?.getMode()==='store'&&document.querySelector('#photographerStoreRoleHeader')?.getBoundingClientRect().height===90);
    const observed=frames.slice(first);
    assert.ok(observed.length>0,'Slow navigation exposes source frames for verification');
    for(const {baseline,current} of observed){
      assert.equal(baseline.title,title);
      assert.equal(current.title,title,'Source section title stays in place until Store arrives');
      assert.deepEqual(current.header,baseline.header,'Source header does not disappear or resize');
      assert.deepEqual(current.sub,baseline.sub,'Source subheader does not disappear or resize');
      assert.deepEqual(current.content,baseline.content,'Source content does not jump upward');
      assert.equal(current.storeMode,false,'Store state is not applied to source page');
      assert.equal(current.path,baseline.path,'No intermediate Store route is rendered');
    }
    console.log('STORE_ENTRY',title,observed.length,'stable source frames');
  }
  assert.deepEqual(pageErrors,[]);
  await browser.close();
  console.log('PASS: entering Store preserves source header and content geometry across all five sections');
})().catch(e=>{console.error(e);process.exit(1)});
