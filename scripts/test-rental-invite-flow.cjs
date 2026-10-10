// Browser integration with the shipped React bundle and invite overlay.
// All API responses are local fixtures: no database writes or real SMS.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');
const web=path.resolve(__dirname,'../dist/web');
const invite={code:'PB-TEST',issuerType:'rental',issuerName:'فروشگاه تست',issuerRentalShopName:'فروشگاه تست',targetMobile:'09120000001'};
test('existing and new invite forms, delayed invite response, OTP and Persian calendar',async()=>{
  const server=http.createServer((req,res)=>{
    const pathname=new URL(req.url,'http://localhost').pathname;
    let file=path.join(web,pathname==='/'||pathname==='/photographer/signup'?'index.html':pathname);
    if(!file.startsWith(web)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return}
    res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':'application/octet-stream');
    res.end(fs.readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  try{
    for(const scenario of [{existing:true,delay:900,birth:'1370/01/01',national:'0012345678',verifyError:'invite_rental_shop_unavailable'},{existing:true,delay:0,birth:'',national:'0012345678'},{existing:true,delay:900,birth:'1370/01/01',national:''},{existing:false,delay:900,birth:''}]){
      const context=await browser.newContext({viewport:{width:390,height:844}});
      const page=await context.newPage(),sent=[],errors=[];
      page.on('pageerror',err=>errors.push(err.message));
      const ctx={invite,mobile:invite.targetMobile,existingAccount:scenario.existing?{exists:true,name:'آتلیه تست',alreadyConnected:false}:null,membershipRequiredFields:{nationalId:true},membershipProfile:scenario.existing?{birthJalali:scenario.birth,nationalId:scenario.national}:null};
      await page.route('**/api/**',async route=>{
        const url=new URL(route.request().url());
        let body={};
        if(url.pathname.includes('/photographer-invites/')){
          await new Promise(resolve=>setTimeout(resolve,scenario.delay));
          body={invite,signupContext:null};
        }else if(url.pathname.includes('/photographer-signup/context'))body=ctx;
        else if(url.pathname==='/api/public/photographer-signup'){
          sent.push(route.request().postDataJSON());body={challengeId:'test-challenge',mobile:invite.targetMobile,existingAccount:scenario.existing,verificationRequired:true};
        }else if(url.pathname==='/api/public/photographer-signup/verify'){
          sent.push(route.request().postDataJSON());if(scenario.verifyError){await route.fulfill({status:409,json:{error:scenario.verifyError}});return}body={ok:true};
        }else if(url.pathname==='/api/me'){await route.fulfill({status:401,json:{error:'unauthorized'}});return}
        await route.fulfill({json:body});
      });
      await page.goto(`${base}/photographer/signup?invite=PB-TEST&mobile=${invite.targetMobile}&mb=test-binding`);
      await page.waitForSelector('.photographerSignupForm');
      await page.waitForTimeout(1600);
      const passwords=page.locator('.photographerSignupForm input[type="password"]:visible');
      if(scenario.existing){
        assert.equal(await passwords.count(),0,'existing member must never re-enter passwords');
        const national=page.locator('#pbR94InviteRequired input[data-key="nationalId"]:visible');
        assert.equal(await national.count(),scenario.national?0:1,'only missing shop fields must be requested');
        if(!scenario.national)await national.fill('0012345678');
        if(!scenario.birth){
          await page.locator('#pbR94InviteRequired .pbR95BirthInput').click();
          assert.equal(await page.locator('[data-jalali-month] option').count(),12);
          await page.locator('[data-jalali-year-open]').click();
          await page.locator('[data-jalali-year="1370"]').click();
          await page.locator('[data-jalali-month]').selectOption('12');
          await page.locator('[data-jalali-day="1"]').click();
        }
        await page.locator('.photographerSignupForm > button.primary').click();
        await page.waitForSelector('input[autocomplete="one-time-code"],input[maxlength="6"]');
        await page.waitForTimeout(700);
        const otp=page.locator('input[autocomplete="one-time-code"],input[maxlength="6"]').first();
        assert.equal(await otp.isVisible(),true,'OTP must remain visible after overlay rerender');
        assert.equal(sent.length,1);
        assert.equal(sent[0].password,'');
        assert.equal(sent[0].nationalId,'0012345678');
        assert.equal(sent[0].birthJalali,scenario.birth||'1370/12/01');
        const verification=page.waitForRequest(request=>new URL(request.url()).pathname==='/api/public/photographer-signup/verify');
        await otp.fill('123456');
        const verified=await verification;
        assert.equal(verified.postDataJSON().challengeId,'test-challenge');
        assert.equal(verified.postDataJSON().code,'123456');
        if(scenario.verifyError){await page.getByText('فروشگاه صادرکننده دعوتنامه در حال حاضر فعال نیست. برای بررسی وضعیت فروشگاه با مدیر آن تماس بگیر.',{exact:true}).waitFor();assert.equal(await otp.isVisible(),true)}
      }else{
        assert.equal(await passwords.count(),2,'new invitee needs signup credentials');
        assert.equal(await page.locator('.photographerSignupLocationPicker:visible').count(),1,'new signup retains map/address');
        const birth=page.locator('.photographerSignupForm .pbR95BirthInput');
        await birth.click();
        assert.equal(await page.locator('[data-jalali-month] option').count(),12);
        await page.locator('[data-jalali-year-open]').click();
        await page.locator('[data-jalali-year="1370"]').click();
        await page.locator('[data-jalali-month]').selectOption('12');
        await page.locator('[data-jalali-day="1"]').click();
        assert.equal(await birth.inputValue(),'1370/12/01');
      }
      assert.deepEqual(errors,[]);
      await context.close();
    }
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
});
