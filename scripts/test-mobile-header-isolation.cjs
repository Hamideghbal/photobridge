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
  await db.query(`UPDATE users SET photographer_active_lab_id=$2 WHERE id=$1`, [
    uid,
    lab,
  ]);
  await db.query(
    `INSERT INTO equipment_rental_shops(id,name,slug) VALUES($1,'فروشگاه آزمایشی','header-test-store') ON CONFLICT(id) DO NOTHING`,
    ["33333333-3333-4333-8333-333333333338"],
  );
  await db.query(
    `UPDATE platform_settings SET value=jsonb_set(value,'{enabled}','false'::jsonb) WHERE key='maintenance_mode'`,
  );
  await db.query(
    `INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '1 hour')`,
    [uid, crypto.createHash("sha256").update(token).digest("hex")],
  );
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
  page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
  await page.goto("http://127.0.0.1:3000/photographer");
  await page.waitForTimeout(3000);
  for (const [i, label] of [
    "فروشگاه",
    "چاپ",
    "هوش مصنوعی",
    "گالری",
    "طراحی آلبوم",
    "اینستاگرام",
    "فروشگاه",
  ].entries()) {
    const nav = page
      .locator(
        ".photographerBottomAppNav button,.photographerBottomAppNavGrid button",
      )
      .filter({ hasText: new RegExp("^" + label + "$") });
    if (await nav.count()) await nav.first().click();
    else
      await page
        .getByRole("button", { name: label, exact: true })
        .first()
        .click();
    await page.waitForTimeout(2200);
    if (
      label === "چاپ" &&
      (await page.locator("#pbR99LabChooser [data-select]").count())
    ) {
      await page.locator("#pbR99LabChooser [data-select]").first().click();
      await page.waitForTimeout(2200);
    }
    if (
      label === "فروشگاه" &&
      (await page.locator("[data-enter-store-r96]").count())
    ) {
      await page.locator("[data-enter-store-r96]").first().click();
      await page.waitForTimeout(1800);
    }
    const state = await page.evaluate(() => ({
      url: location.href,
      mode: window.PBStorePhotographerHeaderCore?.getMode(),
      classes: document.body.className,
      headers: [
        ...document.querySelectorAll(
          "header,#photographerStoreRoleHeader,#pbF37PhotographerHeader,.photographerPrintModeHeader,.photographerLabContextRail,#pb711PhotographerContextBar",
        ),
      ]
        .filter(
          (e) =>
            e.getBoundingClientRect().height &&
            getComputedStyle(e).visibility !== "hidden" &&
            getComputedStyle(e).display !== "none",
        )
        .map((e) => ({
          id: e.id,
          cls: e.className,
          text: e.innerText?.slice(0, 100),
          shadow: getComputedStyle(e).boxShadow,
        })),
      context: document.querySelector("#pbF37ContextText")?.textContent,
    }));
    console.log(label, JSON.stringify(state));
    const assert = require("node:assert/strict");
    assert.equal(
      state.headers.length,
      1,
      label + " must have exactly one header",
    );
    if (label === "فروشگاه") {
      assert.equal(state.headers[0].id, "photographerStoreRoleHeader");
    } else {
      assert.equal(state.headers[0].id, "pbF37PhotographerHeader");
      assert.equal(
        state.context,
        {
          چاپ: "لابراتوار آزمایشی",
          "هوش مصنوعی": "هوش مصنوعی",
          گالری: "گالری مشتریان",
          "طراحی آلبوم": "طراحی آلبوم",
          اینستاگرام: "طراحی اینستاگرام",
        }[label],
      );
    }
    await page.screenshot({ path: "/tmp/photobridge-mobile-" + i + ".png" });
    if (label === "گالری") {
      // Exercise header updates while legacy scripts keep changing the app root.
      await page.evaluate(() => {
        const root = document.querySelector("#root");
        const cards = document.createElement("div");
        cards.className = "clientGalleryCards";
        cards.id = "headerRegressionCards";
        cards.innerHTML = '<div class="clientGalleryCard"></div>';
        root.prepend(cards);
        window.headerRegressionTimer = setInterval(() => {
          const n = document.createElement("span");
          root.append(n);
          n.remove();
        }, 10);
      });
      try {
        await page.waitForFunction(
          () =>
            document.querySelector("#pbF37ContextMeta")?.textContent ===
            "۱ پروژه",
          {},
          { timeout: 1500 },
        );
      } finally {
        await page.evaluate(() => {
          clearInterval(window.headerRegressionTimer);
          document.querySelector("#headerRegressionCards")?.remove();
        });
      }
    }
    if (label === "چاپ") {
      await page.locator("#pb765-add").click();
      await page.waitForTimeout(2000);
      const composer = await page.evaluate(() => ({
        url: location.href,
        cls: document.body.className,
        plus: [
          ...document.querySelectorAll("#pb765-add,#pb762-add,.pb737DockAdd"),
        ].filter(
          (e) =>
            e.getBoundingClientRect().height &&
            getComputedStyle(e).display !== "none",
        ).length,
        actions: document.querySelector("#pbF37PrintComposerActions")
          ?.innerText,
        shadow: getComputedStyle(
          document.querySelector("#pbF37PhotographerHeader"),
        ).boxShadow,
        subheaderShadow: getComputedStyle(
          document.querySelector("#pbF37Subheader"),
        ).boxShadow,
        contextShadow: getComputedStyle(
          document.querySelector("#pbF37ContextTitle"),
        ).boxShadow,
      }));
      require("node:assert/strict").equal(composer.plus, 0);
      require("node:assert/strict").equal(composer.shadow, "none");
      require("node:assert/strict").equal(composer.subheaderShadow, "none");
      require("node:assert/strict").equal(composer.contextShadow, "none");
      require("node:assert/strict").match(composer.actions, /انتخاب فایل/);
      console.log("COMPOSER", composer);
      await page.screenshot({ path: "/tmp/photobridge-print-composer.png" });
    }
  }
  await browser.close();
  console.log(
    "PASS: seven mobile section transitions, print composer plus and header shadow",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
