const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('dist/web/photobridge-r1122-mobile-print-orders.css','utf8');
const js=fs.readFileSync('dist/web/photobridge-r1122-mobile-print-orders.js','utf8');
test('mobile shows one status rail and delegates selection to the hidden native filters',async()=>{
 const {chromium}=require('playwright');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.setContent(`<body class="pbF37PrintMode"><div id="root"><main class="photographerMain photographerPrintWorkspace"><div class="photographerLabContextRail"><div class="photographerContextStatuses photographerContextStatusesMobile">${['در جریان','نیازمند اصلاح','آماده تحویل','تحویل‌شده'].map((x,i)=>`<button class="${i===0?'active':''}">${x}<b>${i+1}</b></button>`).join('')}</div><div class="photographerContextStatuses photographerContextStatusesDesktop"><button>در جریان</button></div></div><div class="ordersWorkspace liveCustomerOrders"></div></main></div></body>`);
  await page.addStyleTag({content:css});
  await page.evaluate(()=>{window.selectedStatus=-1;document.querySelectorAll('.photographerContextStatusesMobile button').forEach((b,i)=>b.onclick=()=>{window.selectedStatus=i;document.querySelectorAll('.photographerContextStatusesMobile button').forEach(x=>x.classList.toggle('active',x===b));});});
  await page.addScriptTag({content:js});
  const rail=page.locator('#pbR1122PrintOrderStatuses');await rail.waitFor();
  for(const selector of ['.photographerContextStatusesMobile','.photographerContextStatusesDesktop'])assert.equal(await page.locator(selector).isVisible(),false,selector+' must not duplicate statuses');
  assert.equal(await rail.locator('button').count(),4);
  await rail.locator('button').nth(2).click();
  await page.waitForFunction(()=>document.querySelector('#pbR1122PrintOrderStatuses button[data-status-index="2"]').getAttribute('aria-pressed')==='true');
  assert.equal(await page.evaluate(()=>window.selectedStatus),2);
  assert.equal(await rail.locator('button').nth(2).locator('b').innerText(),'3');
  await page.locator('.ordersWorkspace').evaluate(el=>{const lower=document.createElement('div');lower.className='pb761PhotoStatuses';lower.innerHTML='<button>در جریان</button>';el.append(lower)});
  assert.equal(await rail.isVisible(),false,'upper replacement rail is hidden when the original lower rail exists');
  assert(await page.locator('.pb761PhotoStatuses').isVisible(),'original lower row remains visible');
  await page.setViewportSize({width:1366,height:844});await rail.waitFor({state:'detached'});
  assert(await page.locator('.photographerContextStatusesDesktop').isVisible(),'desktop filters remain unchanged');
 }finally{await browser.close();}
});
