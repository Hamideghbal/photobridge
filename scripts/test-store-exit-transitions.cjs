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
  await page.route('**/photobridge-v904r100f41-header-date-name-fit.js*',async route=>{
    await new Promise(resolve=>setTimeout(resolve,800));await route.continue();
  });
  await page.addInitScript(()=>{
    window.__storeExitFrames={covered:0,uncovered:0};
    function frame(){
      try{
        const p=JSON.parse(sessionStorage.getItem('photobridge:r100f44:tab-transition')||'null');
        if(p&&['ai','gallery','album','instagram'].includes(p.target)&&location.pathname.startsWith('/photographer')){
          if(document.documentElement.classList.contains('pbF41TabTransition'))window.__storeExitFrames.covered++;
          else if(document.querySelector('#root')?.childElementCount)window.__storeExitFrames.uncovered++;
        }
      }catch{}
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
  for(const [label,target,title] of [['هوش مصنوعی','ai','هوش مصنوعی'],['گالری','gallery','گالری مشتریان'],['طراحی آلبوم','album','طراحی آلبوم'],['اینستاگرام','instagram','طراحی اینستاگرام']]){
    await page.goto('http://127.0.0.1:3000/equipment-rental/book');
    await page.waitForTimeout(1800);
    await page.locator('.photographerBottomAppNav button,.photographerBottomAppNavGrid button').filter({hasText:new RegExp('^'+label+'$')}).first().click();
    await page.waitForFunction(()=>document.querySelector('#pbF37PhotographerHeader')&& !document.documentElement.classList.contains('pbF41TabTransition'),{}, {timeout:7000});
    const state=await page.evaluate(()=>({frames:window.__storeExitFrames,title:document.querySelector('#pbF37ContextText')?.textContent,pending:sessionStorage.getItem('photobridge:r100f44:tab-transition'),mode:window.PBStorePhotographerHeaderCore?.getMode()}));
    console.log('STORE_EXIT',label,JSON.stringify(state));
    assert.equal(state.title,title);assert.equal(state.mode,target);assert.equal(state.pending,null);
    assert.ok(state.frames.covered>0,'Destination boot was covered during delayed core load');
    assert.equal(state.frames.uncovered,0,'No uncovered legacy frame before final header');
  }
  assert.deepEqual(pageErrors,[]);
  await browser.close();
  console.log('PASS: Store exits to AI, Gallery, Album and Instagram stay covered through delayed final UI initialization');
})().catch(e=>{console.error(e);process.exit(1)});
