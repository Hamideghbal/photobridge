const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:900}}),calls=[];
  const origin='https://security.test',lab='10000000-0000-4000-8000-000000000001';
  await page.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.pathname.startsWith('/api/')){
    assert.equal(request.method(),'POST');
    const body=request.postDataJSON();calls.push({path:url.pathname,body});
    if(url.pathname.endsWith('/request'))return route.fulfill({json:{challengeId:'20000000-0000-4000-8000-000000000001'}});
    if(url.pathname.endsWith('/verify'))return route.fulfill({json:{resetToken:'r'.repeat(43)}});
    return route.fulfill({json:{ok:true,sessionsRevoked:true}});
   }
   const file=path.join('dist/web',url.pathname);
   if(fs.existsSync(file))return route.fulfill({path:path.resolve(file)});
   return route.fulfill({status:404,body:''});
  });
  await page.goto(origin+'/lab-login-security.html?lab='+lab);
  assert.equal(calls.length,0,'opening the alert link must be read-only');
  assert.equal(await page.locator('#disableForm').count(),0,'retired disable-password form must not exist');
  assert.equal(await page.locator('#disableConfirmation').count(),0);
  await page.locator('#mobile').fill('09120000000');
  await page.locator('#verifyButton').click();
  await page.locator('#code').waitFor({state:'visible'});
  assert.equal(calls[0].body.portal,'account');
  await page.locator('#code').fill('123456');
  await page.locator('#verifyButton').click();
  await page.locator('#actions').waitFor({state:'visible'});
  const eye=page.locator('.pb1536PasswordEye').first();await eye.waitFor({state:'visible'});
  const box=await eye.boundingBox();assert(box&&box.width<=34&&box.height<=34,'password eye must not cover the input');
  assert.equal(await page.locator('#password').getAttribute('type'),'password');
  await eye.click();
  assert.equal(await page.locator('#password').getAttribute('type'),'text');
  await eye.click();
  assert.equal(await page.locator('#password').getAttribute('type'),'password');
  await page.locator('#password').fill('new-safe-password');
  await page.locator('#confirmPassword').fill('new-safe-password');
  await page.locator('#changeForm button[type=submit]').click();
  await page.waitForFunction(()=>document.getElementById('status').textContent.includes('رمز مشترک تغییر کرد'));
  assert.equal(calls.length,3,'only OTP request, OTP verify and password change are allowed');
  assert.equal(calls[2].path,'/api/auth/password-reset/complete');
  assert(!page.url().includes('resetToken'));
  assert.equal(await page.locator('#password').inputValue(),'');
  assert(await page.locator('#recovery').isVisible());
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'/tmp/photobridge-r1534-change-'+width+'.png',fullPage:true});
  console.log('PASS: '+width+'px browser security password change with OTP, one action, compact eye and cleared secrets');
  await page.close();
 }
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
