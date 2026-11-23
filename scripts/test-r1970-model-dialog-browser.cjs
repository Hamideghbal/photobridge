'use strict';
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/opt/codex/cua_node/lib/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const folder of ['dist/web','dist/web/lab-desktop-ui']){
  const root=path.resolve(folder),raw=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  const boot='Tx.createRoot(document.getElementById("root")).render(e.jsx(PB605RenderBoundary,{children:e.jsx(ow,{})}));';assert(raw.includes(boot));
  const render='Tx.createRoot(document.getElementById("root")).render(e.jsx("div",{className:"labRoleWorkspace",children:e.jsx(tw,{data:[{id:"13x18",label:"۱۳×۱۸",luster:1000,chassis:5000,frame:6000}],onSaved:async()=>{},labName:"آزمایش"})}));';
  const links=[...fs.readFileSync(root+'/index.html','utf8').matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map(m=>m[0]).join('');
  for(const legacy of [true,false]){
   const source=(legacy?raw.replaceAll('return e.jsx(PB1970ModelDialogShell,{','return e.jsx(On,{'):raw).replace(boot,render);
   const page=await browser.newPage({viewport:{width:1280,height:900}}),writes=[];
   const types=[{id:'frame',kind:'frame',name:'قاب',legacy:true,active:true},{id:'chassis',kind:'chassis',name:'شاسی',legacy:true,active:true}];
   await page.route('**/*',route=>{
    const req=route.request(),u=new URL(req.url());if(u.hostname!=='panel.test')return route.abort();
    if(u.pathname==='/api/lab/print-catalog/type'){const value=req.postDataJSON();writes.push(value);Object.assign(types.find(v=>v.id===value.id),value);return route.fulfill({json:{ok:true}});}
    if(u.pathname==='/api/lab/print-catalog')return route.fulfill({json:{catalog:{types,rates:{}}}});
    if(u.pathname.startsWith('/api/'))return route.fulfill({json:{}});
    if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:'<html lang="fa" dir="rtl"><head>'+links+'</head><body><div id="root"></div><script type="module" src="/assets/index-UIRefine-v655-r84.js"></script></body></html>'});
    if(u.pathname==='/assets/index-UIRefine-v655-r84.js')return route.fulfill({contentType:'text/javascript',body:source});
    const file=path.join(root,u.pathname);return fs.existsSync(file)&&fs.statSync(file).isFile()?route.fulfill({path:file}):route.fulfill({status:404,body:''});
   });
   try{
    await page.goto('https://panel.test/');await page.waitForSelector('.pb1539Rename');
    // A native dialog is already open in the desktop. A body portal is inert
    // outside that top layer; the model's own modal must receive keyboard input.
    await page.evaluate(()=>{const host=document.createElement('dialog');host.id='parent-modal';host.innerHTML='<button>پنجرهٔ قبلی</button>';document.body.append(host);host.showModal();});
    const rename=page.locator('.pb1539Rename').first();await rename.evaluate(el=>el.click());
    const name=page.locator('.pb1791ModelNameDialog input').first();
    if(legacy){
     const inert=await name.evaluate(el=>{el.focus();return document.activeElement!==el});assert(inert,'reproduce original modal keyboard failure');continue;
    }
    await name.click();await name.press('Control+A');await name.pressSequentially('شاسی آزمایشی ۱۵۳',{delay:10});assert.equal(await name.inputValue(),'شاسی آزمایشی ۱۵۳');
    const latin=page.locator('.pb1791ModelNameDialog input').nth(1);await latin.fill('Board 153');
    await page.getByRole('button',{name:'انصراف',exact:true}).click();assert.equal(writes.length,0,'cancel never saves');
    await rename.evaluate(el=>el.click());await name.fill('شاسی آزمایشی ۱۵۳');await latin.fill('Board 153');
    await page.getByRole('button',{name:'ذخیره مدل',exact:true}).click();await page.waitForSelector('.pb1791ModelNameDialog',{state:'detached'});
    assert.deepEqual(writes,[{id:'chassis',name:'شاسی آزمایشی ۱۵۳',latinName:'Board 153'}]);
    await page.evaluate(()=>document.getElementById('parent-modal').close());
    // The ordinary tariff row also remains editable after closing the modal.
    const price=page.locator('.inventoryPriceGrid:not(.head) input').first();await price.fill('4321');assert.equal((await price.inputValue()).replace(/[۴۳۲۱]/g,d=>({'۴':'4','۳':'3','۲':'2','۱':'1'}[d])).replace(/[,٬]/g,''),'4321');
   }finally{await page.close()}
  }
  console.log('PASS '+folder+': reproduced old modal focus block; Persian/Latin edit, cancel, save and tariff typing pass');
 }}finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
