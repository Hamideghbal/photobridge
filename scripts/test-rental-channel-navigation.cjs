const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const html = fs.readFileSync(path.join(__dirname, '../dist/api/equipment-rental-portal.html'), 'utf8');
const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map(x => x[0]).join('');
const channels = html.match(/<script id="pbR1050HeaderChannels">([\s\S]*?)<\/script>/)[1];
const pinStart = html.indexOf('const pinHeader=()=>');
const pin = html.slice(pinStart, html.indexOf(';pinHeader();', pinStart));
const load = html.slice(html.indexOf('async function load(opts={})'), html.indexOf('function pb837ActiveDesktopTab()'));

test('overview refresh removes disabled channels from every navigation and restores enabled ones', async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1366, height: 768 }]) {
      const page = await browser.newPage({ viewport });
      const nav = (id, attr) => `<nav id="${id}">${['bookings', 'sales', 'items', 'settings'].map(key => `<button ${attr}="${key}">${key}</button>`).join('')}</nav>`;
      await page.setContent(`<head>${styles}</head><body class="rentalAppReady"><header class="top">${nav('rentalDesktopPrimaryNav', 'data-rental-desktop-tab')}</header>${nav('tabs', 'data-tab')}${nav('rentalMobileDrawer', 'data-rental-tab')}${nav('rentalMobileBottomNav', 'data-rental-bottom-tab')}</body>`);
      await page.addScriptTag({ content: `let data={shop:{sale_enabled:true,rental_enabled:true}};
        window.nextOverview=data;window.api=async()=>window.nextOverview;
        window.showApp=()=>{};window.showLogin=()=>{};window.message=()=>{};
        window.render=()=>{};window.pbR100F9InitStaffSettings=()=>{};
        window.setDefaultJalaliDates=()=>{};window.ensureRentalInvite=()=>{};
        window.pbLoadReachLocations=async()=>{};window.selectRentalTab=()=>{};
        window.rentalTabFromPath=()=> 'settings';window.startRentalLiveWatch=()=>{};
        window.fillShop=()=>{};${load}` });
      await page.addScriptTag({ content: channels });
      await page.addScriptTag({ content: `(()=>{const nav=document.getElementById('rentalDesktopPrimaryNav'),header=document.querySelector('.top');let desktopStylesApplied=false;${pin};window.testPinHeader=pinHeader;pinHeader()})()` });
      const baseline = Object.fromEntries(await page.locator('nav button').evaluateAll(buttons => buttons.map(b => [b.parentElement.id + ':' + b.textContent, getComputedStyle(b).display])));
      for (const [sale, rental] of [[false, true], [true, false], [false, false], [true, true]]) {
        await page.evaluate(async ([sale, rental]) => {
          window.nextOverview = { shop: { sale_enabled: sale, rental_enabled: rental } };
          await load({ reloadExtra: false });
          // Tab changes invoke the production header pinning code again.
          for(let i=0;i<3;i++) { document.querySelector('[data-rental-desktop-tab=bookings]').classList.toggle('active'); window.testPinHeader(); }
        }, [sale, rental]);
        for (const [key, enabled] of [['sales', sale], ['items', rental]]) {
          const results = await page.locator(`[data-rental-desktop-tab="${key}"],[data-rental-tab="${key}"],[data-rental-bottom-tab="${key}"],[data-tab="${key}"]`).evaluateAll(buttons => buttons.map(b => ({ nav: b.parentElement.id, off: b.dataset.pbChannelOff, hidden: b.hidden, display: getComputedStyle(b).display })));
          assert.equal(results.length, 4);
          for (const result of results) {
            assert.equal(result.off, String(!enabled));
            assert.equal(result.hidden, !enabled);
            assert.equal(result.display, enabled ? baseline[result.nav + ':' + key] : 'none', JSON.stringify({viewport,key,enabled,result}));
          }
        }
        const dividers = await page.locator('.pbR1050ChannelDivider').count();
        assert.equal(dividers, Number(sale) + Number(rental));
      }
      // Missing channel fields preserve the existing enabled-by-default behavior.
      await page.evaluate(async () => { window.nextOverview = { shop: {} }; await load(); });
      assert.equal(await page.locator('[data-pb-channel-off="true"]').count(), 0);
      await page.close();
    }
  } finally { await browser.close(); }
});
