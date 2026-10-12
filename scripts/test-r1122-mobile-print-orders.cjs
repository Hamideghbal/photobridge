const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('dist/web/index.html','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1122-mobile-print-orders.css','utf8');
const js=fs.readFileSync('dist/web/photobridge-r1122-mobile-print-orders.js','utf8');

test('photographer bottom navigation stays a single six-button row without changing lab navigation',()=>{
  assert.match(css,/photographerMobileUtilityRail\.photographerBottomAppNav:not\(\.labBottomAppNav\)/);
  assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)!important/);
  assert.match(css,/grid-row:1!important/);
});
test('mobile print order statuses remain reachable through the existing React filters',()=>{
  assert.match(js,/photographerContextStatusesMobile\s*>\s*button/);
  assert.match(js,/current\?\.click\(\)/);
  assert.match(js,/\.ordersWorkspace\.liveCustomerOrders/);
  assert.match(js,/source\.length!==4/);
  assert.doesNotMatch(js,/\/api\/customer\/orders/);
});
test('R1122 assets are included in the served photographer page',()=>{
  assert.match(html,/photobridge-r1122-mobile-print-orders\.css\?v=r1136/);
  assert.match(html,/photobridge-r1122-mobile-print-orders\.js\?v=r1122/);
});

test('mobile shows one status rail and delegates selection to the hidden native filters',async()=>{
 const {chromium}=require('playwright');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.setContent(`<body class="pbF37PrintMode"><div id="root"><main class="photographerMain photographerPrintWorkspace"><div class="photographerLabContextRail"><div class="photographerContextStatuses photographerContextStatusesMobile">${['در جریان','نیازمند اصلاح','آماده تحویل','تحویل‌شده'].map((x,i)=>`<button class="${i===0?'active':''}">${x}<b>${i+1}</b></button>`).join('')}</div><div class="photographerContextStatuses photographerContextStatusesDesktop"><button>در جریان</button></div></div><div class="ordersWorkspace liveCustomerOrders"></div></main></div><div class="pb761PhotoStatuses"><button>در جریان</button></div></body>`);
  await page.addStyleTag({content:css});
  await page.evaluate(()=>{window.selectedStatus=-1;document.querySelectorAll('.photographerContextStatusesMobile button').forEach((b,i)=>b.onclick=()=>{window.selectedStatus=i;document.querySelectorAll('.photographerContextStatusesMobile button').forEach(x=>x.classList.toggle('active',x===b));});});
  await page.addScriptTag({content:js});
  const rail=page.locator('#pbR1122PrintOrderStatuses');await rail.waitFor();
  for(const selector of ['.photographerContextStatusesMobile','.photographerContextStatusesDesktop','.pb761PhotoStatuses'])assert.equal(await page.locator(selector).isVisible(),false,selector+' must not duplicate statuses');
  assert.equal(await rail.locator('button').count(),4);
  await rail.locator('button').nth(2).click();
  await page.waitForFunction(()=>document.querySelector('#pbR1122PrintOrderStatuses button[data-status-index="2"]').getAttribute('aria-pressed')==='true');
  assert.equal(await page.evaluate(()=>window.selectedStatus),2);
  assert.equal(await rail.locator('button').nth(2).locator('b').innerText(),'3');
  await page.setViewportSize({width:1366,height:844});await rail.waitFor({state:'detached'});
  assert(await page.locator('.photographerContextStatusesDesktop').isVisible(),'desktop filters remain unchanged');
 }finally{await browser.close();}
});
