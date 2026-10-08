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
  await page.addInitScript(()=>{
    window.__storeExitFrames={legacy:0,cover:0,modernAt:null};
    function frame(){
      if(location.pathname.startsWith('/photographer')){
        if(document.documentElement.classList.contains('pbF41TabTransition'))window.__storeExitFrames.cover++;
        const legacy=[...document.querySelectorAll('.photographerMain>.unifiedRoleHeader.photographerHeaderRefined,.photographerMain>.photographerPrintModeHeader,#photographerRoleHeaderV710')].some(e=>{const s=getComputedStyle(e);return e.getBoundingClientRect().height>0&&s.display!=='none'&&s.visibility!=='hidden'});
        if(legacy)window.__storeExitFrames.legacy++;
        if(document.querySelector('#pbF37PhotographerHeader')&&window.__storeExitFrames.modernAt===null)window.__storeExitFrames.modernAt=performance.now();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
  for(const [label,target,title] of [['هوش مصنوعی','ai','هوش مصنوعی'],['گالری','gallery','گالری مشتریان'],['طراحی آلبوم','album','طراحی آلبوم'],['اینستاگرام','instagram','طراحی اینستاگرام']]){
    await page.goto('http://127.0.0.1:3000/equipment-rental/book');
    await page.waitForTimeout(1400);
    assert.ok(await page.locator('link[rel="modulepreload"][href*="index-UIRefine"]').count(),'Store preloads the main app');
    const clicked=Date.now();
    await page.locator('.photographerBottomAppNav button,.photographerBottomAppNavGrid button').filter({hasText:new RegExp('^'+label+'$')}).first().click();
    await page.waitForFunction(t=>document.querySelector('#pbF37ContextText')?.textContent===t, title,{timeout:7000});
    await page.waitForTimeout(100);
    const state=await page.evaluate(()=>({frames:window.__storeExitFrames,title:document.querySelector('#pbF37ContextText')?.textContent,pending:sessionStorage.getItem('photobridge:r100f44:tab-transition'),mode:window.PBStorePhotographerHeaderCore?.getMode()}));
    console.log('STORE_EXIT',label,JSON.stringify({...state,clickToCheckedMs:Date.now()-clicked}));
    assert.equal(state.title,title);assert.equal(state.mode,target);assert.equal(state.pending,null);
    assert.equal(state.frames.cover,0,'No waiting cover or transition spinner');
    assert.equal(state.frames.legacy,0,'Legacy headers never render');
  }
  // Slow the current core deliberately: even then, only current chrome may render.
  await page.route('**/photobridge-v904r100f41-header-date-name-fit.js*',async route=>{await new Promise(resolve=>setTimeout(resolve,800));await route.continue()});
  await page.goto('http://127.0.0.1:3000/equipment-rental/book');await page.waitForTimeout(1200);
  await page.locator('.photographerBottomAppNav button,.photographerBottomAppNavGrid button').filter({hasText:/^هوش مصنوعی$/}).first().click();
  await page.waitForFunction(()=>document.querySelector('#pbF37ContextText')?.textContent==='هوش مصنوعی');
  const slow=await page.evaluate(()=>window.__storeExitFrames);
  assert.equal(slow.cover,0);assert.equal(slow.legacy,0);
  assert.deepEqual(pageErrors,[]);await browser.close();
  console.log('PASS: Store exits use current headers without transition covers, including slow-script loading');
})().catch(e=>{console.error(e);process.exit(1)});
