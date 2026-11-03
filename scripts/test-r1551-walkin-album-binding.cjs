'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('manual album web and Windows select active binding types, quote that type and submit its id',async()=>{
 const browser=await chromium.launch({executablePath:process.env.PB_BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox']});
 try{for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const source=fs.readFileSync(path.join(process.env.PB_TEST_ROOT||process.cwd(),root,'photobridge-r1137-lab-local-intake.js'),'utf8'),a=source.indexOf('function pb1184AlbumConfigurator('),b=source.indexOf('/* PB1184 album walk-in configurator */',a);
  assert(a>=0&&b>a);const helpers=source.split('\n').filter(l=>/^function (node|field|select)\(/.test(l)).join('\n');
  const page=await browser.newPage();await page.setContent('<div id="editor"><div id="settings"></div></div>');
  await page.evaluate(code=>{(0,eval)(code)},helpers+'\n'+source.slice(a,b));
  await page.evaluate(()=>{const size=field(document.getElementById('settings'),'سایز آلبوم',select([['size','۲۰×۳۰']]));window.config=pb1184AlbumConfigurator(document.getElementById('editor'),document.getElementById('settings'),{sizes:[{id:'size',printSizeId:'print',label:'۲۰×۳۰',luster:10,bindingPrice:50}],covers:[{id:'cover',name:'جلد',price:20}],printTariffCatalog:{types:[{id:'album_binding_price',kind:'binding',name:'صحافی آلبوم'},{id:'custom',kind:'binding',name:'صحافی جدید'},{id:'unpriced',kind:'binding',name:'بدون تعرفه'},{id:'hidden',kind:'binding',name:'غیرفعال',active:false},{id:'paper',kind:'paper',name:'کاغذ'}],rates:{print:{custom:300}}}},size,()=>[{paper:'luster'},{paper:'luster'}]);});
  await page.getByRole('combobox',{name:'جلد آلبوم',exact:true}).selectOption('cover');
  assert.deepEqual(await page.getByRole('combobox',{name:'نوع صحافی',exact:true}).locator('option').allTextContents(),['صحافی آلبوم','صحافی جدید','بدون تعرفه']);
  assert.equal(await page.evaluate(()=>config.estimate().total),140);
  await page.getByRole('combobox',{name:'نوع صحافی',exact:true}).selectOption('custom');
  assert.equal(await page.evaluate(()=>config.collect().bindingTypeId),'custom');assert.equal(await page.evaluate(()=>config.estimate().total),640);assert.equal(await page.evaluate(()=>config.estimate().missing),false);
  await page.getByRole('combobox',{name:'نوع صحافی',exact:true}).selectOption('unpriced');assert.equal(await page.evaluate(()=>config.estimate().missing),true);assert.equal(await page.evaluate(()=>config.collect().bindingTypeId),'unpriced');await page.close();
 }}finally{await browser.close()}
});
