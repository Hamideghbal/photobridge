const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const app=read('dist/web/assets/index-UIRefine-v655-r84.js');
const css=read('dist/web/photobridge-r1196-gallery-field-align.css');
const html=read('dist/web/index.html');
test('the first row places every required/optional badge NEXT TO its field title, not between label and input',()=>{
 const a=app.indexOf('c&&e.jsx(On,{title:"گالری خصوصی جدید"');
 const b=app.indexOf('function PBClientGalleryCompare(',a);
 assert(a>=0&&b>a);
 const modal=app.slice(a,b);
 for(const [title,badge,value] of [['عنوان پروژه','اجباری','h.title'],['نام مشتری','اجباری','h.customerName'],['موبایل مشتری','اختیاری','h.customerMobile']]){
  const fragment='e.jsxs("label",{children:[e.jsxs("span",{className:"pb1196FieldCaption",children:["'+title+'",e.jsx("small",{"aria-hidden":!0,children:"'+badge+'"})]}),e.jsx("input",{';
  assert(modal.includes(fragment),title+' caption/badge must be a single visual line before input');
  const start=modal.indexOf(fragment);
  assert(modal.slice(start,start+450).includes('value:'+value),title+' actual field binding unchanged');
 }
 assert.equal((modal.match(/className:"pb1196FieldCaption"/g)||[]).length,3);
 assert(modal.includes('headerExtra:e.jsxs("div",{className:"clientGalleryCreateBilling"'));
});
test('the original required validations and optional mobile remain untouched',()=>{
 assert(app.includes('!h.title.trim()||!h.customerName.trim()'));
 assert(app.includes('if(String(h.accessCode||"").replace('));
 const region=app.slice(app.indexOf('const T=async()=>{',app.indexOf('PB1112open')-9000),app.indexOf('PB1112open'));
 assert(!region.includes('!h.customerMobile.trim()'),'mobile is not suddenly required');
});
test('first three inputs stay one row with captions and badges above inputs',()=>{
 assert(css.includes('.clientGalleryCreateForm > label:first-child,'));
 assert(css.includes('.clientGalleryCreateForm > .grid2:nth-child(2) > label'));
 assert(css.includes('display:flex!important;'));
 assert(css.includes('flex-direction:column!important;'));
 assert(css.includes('.pb1196FieldCaption small'));
 assert(css.includes('white-space:nowrap!important;'));
 assert(css.includes('grid-row:1!important;'));
 assert(css.includes('height:41px!important;'));
});
test('scoped to create gallery, unaffected tariff and invoice dialogs',()=>{
 assert(css.includes('.modal.pb1112CreateDialog'));
 assert(!css.includes('.clientGalleryTariffTableModal'));
 assert(!css.includes('.modalActions'));
 assert.equal(html.split('/photobridge-r1196-gallery-field-align.css?v=r1196').length-1,1);
 assert.match(html,/index-UIRefine-v655-r84\.js\?v=[^"]+&fields=r1196"/);
});
test('Chromium geometry: caption and badge baseline match, input directly beneath, all three horizontally aligned',{skip:(()=>{try{require.resolve('playwright');return false}catch{return 'Browser test package absent'}})()},async()=>{
 const {chromium}=require('playwright');
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  for(const width of [320,390,700,1366]){
   const page=await browser.newPage({viewport:{width,height:720}});
   await page.setContent('<div class="modalBack globalModalLayer"><section class="modal pb1112CreateDialog"><div class="modalHead"><h2>گالری خصوصی جدید</h2><div class="clientGalleryCreateBilling">هزینه ساخت | ظرفیت | عمر اولیه</div><button>×</button></div><div class="modalContent"><div class="clientGalleryCreateForm"><label><span class="pb1196FieldCaption">عنوان پروژه<small>اجباری</small></span><input></label><div class="grid2"><label><span class="pb1196FieldCaption">نام مشتری<small>اجباری</small></span><input></label><label><span class="pb1196FieldCaption">موبایل مشتری<small>اختیاری</small></span><input></label></div><label>رمز ورود<input></label></div></div></section></div>');
   for(const file of ['dist/web/assets/index-UIRefine-v586.css','dist/web/photobridge-r1112-gallery-form.css','dist/web/photobridge-r1194-gallery-create-dialog.css','dist/web/photobridge-r1195-gallery-create-compact.css','dist/web/photobridge-r1196-gallery-field-align.css'])await page.addStyleTag({path:file});
   const geom=await page.evaluate(()=>{
    const labels=[document.querySelector('.clientGalleryCreateForm > label:first-child'),...document.querySelectorAll('.clientGalleryCreateForm > .grid2 > label')];
    return labels.map(l=>{const t=l.querySelector('.pb1196FieldCaption'),b=t.querySelector('small'),i=l.querySelector('input');const tr=t.getBoundingClientRect(),br=b.getBoundingClientRect(),ir=i.getBoundingClientRect(),lr=l.getBoundingClientRect();return {labelTop:lr.top,capTop:tr.top,capBottom:tr.bottom,badgeTop:br.top,badgeBottom:br.bottom,inputTop:ir.top,inputBottom:ir.bottom,inputLeft:ir.left,inputW:ir.width,capW:tr.width}});});
   assert(geom.every(g=>Math.abs(g.inputTop-geom[0].inputTop)<2),'inputs align horizontally at '+width+': '+JSON.stringify(geom));
   assert(geom.every(g=>g.capBottom<=g.inputTop&&g.inputTop-g.capBottom<=9),'input immediately follows title+badge at '+width);
   assert(geom.every(g=>g.badgeTop>=g.capTop-2&&g.badgeBottom<=g.capBottom+2),'badge shares caption line at '+width);
   assert(geom.every(g=>g.inputW>65),'inputs remain usable at '+width);
   await page.close();
  }
 }finally{await browser.close()}
});
