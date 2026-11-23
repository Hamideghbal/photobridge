'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/codex/cua_node/lib/node_modules/playwright'),assert=require('node:assert/strict');
const {rendererBlockReason}=require('../update-install-gate.cjs');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{const page=await browser.newPage();
 for(const [html,reason] of [
 ['<main>فهرست سفارش‌ها</main>',null],
 ['<dialog open style="display:none"><input></dialog>',null],
 ['<div role="dialog" style="visibility:hidden"><input></div>',null],
 ['<div role="dialog" style="position:absolute;left:-10000px"><input></div>',null],
 ['<dialog open><input value="نام مدل ذخیره نشده"></dialog>','open_form'],
 ['<div class="globalModalLayer"><div role="dialog"><input value="نام مدل ذخیره نشده"></div></div>','open_form'],
 ['<form data-busy="1"><button>در حال ذخیره</button></form>','saving_form']
 ]){await page.setContent(html);assert.equal(await page.evaluate(rendererBlockReason),reason,html);}
 await page.close();console.log('PASS: real renderer allows idle/hidden/offscreen shells; protects visible model dialogs and saving forms.');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
