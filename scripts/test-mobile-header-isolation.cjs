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
  await page.addInitScript(() => {
    if (new URLSearchParams(location.search).get("pbLabChooser") !== "1") return;
    window.__labChooserHeaderFrames = [];
    const sample = () => {
      const header = document.querySelector("#pbF37PhotographerHeader");
      if (header && getComputedStyle(header).display !== "none" && getComputedStyle(header).visibility !== "hidden")
        window.__labChooserHeaderFrames.push(header.innerText || "");
      if (!document.querySelector("#pbR99LabChooser")) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.route("**/photographer/orders/flow*", async route => {
    if (route.request().isNavigationRequest() && new URL(page.url()).pathname.startsWith("/equipment-rental"))
      await new Promise(resolve => setTimeout(resolve, 350));
    await route.continue();
  });
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
    if (label === "چاپ" && (await page.locator("#pbR99LabChooser").count())) {
      const earlyHeaders = await page.evaluate(() => window.__labChooserHeaderFrames || []);
      if (earlyHeaders.length) throw new Error(`Lab header rendered before chooser: ${earlyHeaders.join(" ")}`);
    }
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
    const layout = await page.evaluate(() => {
      const rect = (el) => {
        if (!el) return null;
        const r = el.getBoundingClientRect(),
          s = getComputedStyle(el);
        return {
          x: r.x,
          y: r.y,
          height: r.height,
          width: r.width,
          bottom: r.bottom,
          background: s.backgroundColor,
          shadow: s.boxShadow,
        };
      };
      return {
        header: rect(
          document.querySelector(
            "#pbF37PhotographerHeader,#photographerStoreRoleHeader",
          ),
        ),
        menu: rect(document.querySelector("#pbF37MenuBtn,#pbR100F25MenuBtn")),
        sub: rect(
          document.querySelector("#pbF37Subheader,#storeSectionNavV673"),
        ),
        scroll: rect(
          document.querySelector(".photographerRolePageScrollArea") ||
            document.querySelector("#storePhotographerWorkspace>.shell"),
        ),
      };
    });
    console.log("LAYOUT", label, JSON.stringify(layout));
    if (!storeGeometry) storeGeometry = layout;
    assert.equal(
      layout.header.height,
      storeGeometry.header.height,
      "Store header height",
    );
    assert.equal(
      layout.header.background,
      storeGeometry.header.background,
      "Store header background",
    );
    assert.equal(layout.header.y, 0, "Header at viewport top");
    assert.equal(layout.menu.x, 10, "Menu on physical left");
    assert.equal(
      layout.menu.width,
      storeGeometry.menu.width,
      "Store menu size",
    );
    assert.equal(layout.header.shadow, "none");
    assert.equal(layout.sub.shadow, "none");
    assert.ok(
      layout.scroll.y >= layout.sub.bottom,
      "Content must start below header and subheader",
    );
    const menuButton = page.locator("#pbF37MenuBtn,#pbR100F25MenuBtn").first();
    await menuButton.click();
    assert.equal(
      await menuButton.getAttribute("aria-expanded"),
      "true",
      "Menu opens",
    );
    await menuButton.click();
    assert.equal(
      await menuButton.getAttribute("aria-expanded"),
      "false",
      "Menu closes",
    );
    await page.evaluate(() => {
      const area =
        document.querySelector(".photographerRolePageScrollArea") ||
        document.querySelector("#storePhotographerWorkspace>.shell");
      area.scrollTop = 160;
    });
    await page.waitForTimeout(150);
    const scrolled = await page.evaluate(() => ({
      header: document
        .querySelector("#pbF37PhotographerHeader,#photographerStoreRoleHeader")
        .getBoundingClientRect().top,
      menu: document
        .querySelector("#pbF37MenuBtn,#pbR100F25MenuBtn")
        .getBoundingClientRect().left,
    }));
    assert.equal(scrolled.header, 0, "Header stays fixed while scrolling");
    assert.equal(scrolled.menu, 10, "Menu stays left while scrolling");
    await page.evaluate(() => {
      const area =
        document.querySelector(".photographerRolePageScrollArea") ||
        document.querySelector("#storePhotographerWorkspace>.shell");
      area.scrollTop = 0;
    });
    assert.equal(
      state.headers.length,
      1,
      label + " must have exactly one header",
    );
    if (label === "فروشگاه") {
      assert.equal(state.headers[0].id, "photographerStoreRoleHeader");
      const chrome = await page.evaluate(() => {
        const bar = document.querySelector('#photographerStoreIdentityBar');
        const title = document.querySelector('#storeIdentityToggle');
        const nav = document.querySelector('#storeSectionNavV673');
        const area = document.querySelector('#storePhotographerWorkspace>.shell');
        const r = bar.getBoundingClientRect(), t = title.getBoundingClientRect();
        return {height:r.height, top:r.top, centerDelta:Math.abs(t.top+t.height/2-r.top-r.height/2),
          barBackground:getComputedStyle(bar).backgroundColor,
          navBackground:getComputedStyle(nav).backgroundColor,
          navImage:getComputedStyle(nav).backgroundImage,
          contentImage:getComputedStyle(area).backgroundImage,
          contentBackground:getComputedStyle(area).backgroundColor};
      });
      console.log('STORE_SURFACE', JSON.stringify(chrome));
      assert.equal(chrome.height, 42, 'Store context title matches the other 42px context titles');
      assert.equal(chrome.top, layout.header.bottom);
      assert.ok(chrome.centerDelta < 1, 'Store title is vertically centered');
      assert.equal(chrome.barBackground, 'rgb(255, 255, 255)');
      assert.equal(chrome.navBackground, 'rgba(0, 0, 0, 0)');
      assert.equal(chrome.navImage, 'none');
      assert.equal(chrome.contentImage, 'none');
      assert.equal(chrome.contentBackground, 'rgb(245, 247, 251)');
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
    await page.screenshot({
      path: outputDir + "/photobridge-mobile-" + i + ".png",
    });
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
      const composerTop = await page.evaluate(() => ({
        content: document
          .querySelector(".photographerRolePageScrollArea")
          .getBoundingClientRect().top,
        actions: document
          .querySelector("#pbF37PrintComposerActions")
          .getBoundingClientRect().bottom,
        menu: document.querySelector("#pbF37MenuBtn").getBoundingClientRect()
          .left,
      }));
      assert.ok(
        composerTop.content >= composerTop.actions,
        "Composer content below actions",
      );
      assert.equal(composerTop.menu, 10);
      await page.screenshot({
        path: outputDir + "/photobridge-print-composer.png",
      });
    }
  }
  await page.goto("http://127.0.0.1:3000/photographer/orders/flow?workspace=print&pbLabChooser=1");
  await page.waitForSelector("#pbR99LabChooser", { timeout: 10000 });
  const chooserHeaders = await page.evaluate(() => window.__labChooserHeaderFrames || []);
  require("node:assert/strict").deepEqual(chooserHeaders, [], "Lab header stays hidden until and while lab selection is shown");
  const chooserVisibleHeader = await page.locator("#pbF37PhotographerHeader").evaluate(el => getComputedStyle(el).visibility !== "hidden" && getComputedStyle(el).display !== "none").catch(() => false);
  require("node:assert/strict").equal(chooserVisibleHeader, false, "Lab header hidden on chooser surface");
  await browser.close();
  require("node:assert/strict").deepEqual(
    pageErrors,
    [],
    "No browser runtime errors",
  );
  console.log(
    "PASS: seven mobile section transitions, print composer plus and header shadow",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
