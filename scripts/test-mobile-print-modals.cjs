// Requires the existing disposable onboarding fixtures and a running local API.
// Opens confirmation dialogs only; never submits an order or runs migrations.
const { chromium } = require(
  process.env.PLAYWRIGHT_MODULE_PATH || "playwright",
);
const { Pool } = require("pg");
const sharp = require("sharp");
const crypto = require("node:crypto");
const assert = require("node:assert/strict");
const fs = require("node:fs");

(async () => {
  assert.ok(
    process.env.DATABASE_URL?.includes("host=/workspace/photobridge-env/run"),
    "Use the disposable local database",
  );
  const db = new Pool({ connectionString: process.env.DATABASE_URL });
  const user = "11111111-1111-4111-8111-111111111138";
  const lab = "22222222-2222-4222-8222-222222222238";
  const token = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const before = (
    await db.query("SELECT album_enabled FROM labs WHERE id=$1", [lab])
  ).rows[0];
  assert.ok(before, "Existing test lab required");
  const migrations = (await db.query("SELECT count(*) FROM schema_migrations"))
    .rows[0].count;
  let browser;
  try {
    await db.query("UPDATE labs SET album_enabled=true WHERE id=$1", [lab]);
    await db.query(
      "INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,now()+interval '1 hour')",
      [user, tokenHash],
    );
    browser = await chromium.launch({
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
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
    const output =
      process.env.SCREENSHOT_DIR || "/tmp/photobridge-print-modals";
    fs.mkdirSync(output, { recursive: true });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const capture = (name) =>
      page.screenshot({ path: `${output}/${name}.png` });
    const assertOverlay = async (selector) => {
      const layer = page.locator(selector);
      await layer.waitFor({ state: "visible" });
      assert.equal(
        await layer.evaluate((el) => el.getBoundingClientRect().top),
        0,
      );
      assert.ok(
        await layer.evaluate(
          (el) =>
            Number(getComputedStyle(el).zIndex) >
            Number(
              getComputedStyle(document.querySelector("#pbF37MenuBtn")).zIndex,
            ),
        ),
      );
      assert.equal(
        await layer.evaluate((el) =>
          el.contains(document.elementFromPoint(15, 15)),
        ),
        true,
        "Backdrop must cover header",
      );
    };

    await page.goto(
      "http://127.0.0.1:3000/photographer/upload?workspace=print",
    );
    await page
      .locator("#pbF37PrintComposerActions")
      .waitFor({ state: "visible" });
    await page.waitForTimeout(700);
    assert.equal(
      await page
        .locator(".simplePrintPilotPrimaryAdd,.simplePrintPilotHeaderSubmit")
        .evaluateAll((es) => es.filter((e) => e.checkVisibility()).length),
      0,
      "No duplicate inline buttons",
    );
    assert.equal(
      await page.locator("#pbF37PrintComposerActions button").count(),
      2,
    );
    assert.equal(
      await page.evaluate(
        () =>
          getComputedStyle(document.querySelector("#pbF37ContextTitle"))
            .backgroundColor ===
          getComputedStyle(document.querySelector("#pbF37PhotographerHeader"))
            .backgroundColor,
      ),
      true,
      "Header and title row use one background",
    );
    await capture("print-composer");
    await page.locator(".pbF37Choose").click();
    await assertOverlay(".uploadChoiceOverlay");
    await capture("print-picker");
    const buffer = await sharp({
      create: { width: 1200, height: 1800, channels: 3, background: "#9fbed8" },
    })
      .jpeg()
      .toBuffer();
    const chooser = page.waitForEvent("filechooser");
    await page
      .locator(".uploadChoiceGrid button")
      .filter({ hasText: "۱۰×۱۵" })
      .click();
    await (
      await chooser
    ).setFiles({ name: "print-10x15.jpg", mimeType: "image/jpeg", buffer });
    await page.waitForFunction(
      () => !document.querySelector(".pbF37Send")?.disabled,
    );
    await page.locator(".pbF37Send").click();
    await assertOverlay(".modalBack.globalModalLayer");
    assert.ok(
      await page
        .getByRole("dialog")
        .innerText()
        .then((text) => text.includes("ریز قیمت و تأیید ارسال")),
    );
    await capture("print-confirmation");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "بستن", exact: true })
      .click();

    await page.goto(
      "http://127.0.0.1:3000/photographer/album/new?workspace=print",
    );
    await page
      .locator("#pbF37PrintComposerActions")
      .waitFor({ state: "visible" });
    await page.waitForTimeout(700);
    assert.match(await page.locator(".pbF37Send").innerText(), /آلبوم/);
    await capture("album-composer");
    await page.locator(".pbF37Send").click();
    await assertOverlay(".pb748ModalShade");
    assert.match(
      await page.getByRole("dialog").innerText(),
      /ریز قیمت و تأیید ارسال آلبوم/,
    );
    assert.equal(
      await page
        .getByRole("dialog")
        .getByRole("button", {
          name: "تأیید و ارسال آلبوم برای چاپ",
          exact: true,
        })
        .isDisabled(),
      true,
      "Empty album cannot be submitted",
    );
    await capture("album-confirmation");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "بستن", exact: true })
      .click();
    assert.equal(
      await page.locator("#pbF37PhotographerHeader").isVisible(),
      true,
    );
    assert.deepEqual(errors, []);
    assert.equal(
      (await db.query("SELECT count(*) FROM schema_migrations")).rows[0].count,
      migrations,
    );
    console.log(
      "PASS: one print action row; matching title/header background; print picker and print/album confirmations above header; no order submitted",
    );
  } finally {
    if (browser) await browser.close();
    await db.query("UPDATE labs SET album_enabled=$2 WHERE id=$1", [
      lab,
      before.album_enabled,
    ]);
    await db.query("DELETE FROM sessions WHERE token_hash=$1", [tokenHash]);
    await db.end();
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
