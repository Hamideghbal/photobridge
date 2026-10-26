const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const root='dist/web/',ui=fs.readFileSync(root+'assets/index-UIRefine-v655-r84.js','utf8'),css=fs.readFileSync(root+'photobridge-r1485-mobile-finance.css','utf8');
test('opening a phone date closes only other open calendars and desktop behavior stays unchanged',()=>{
 const start=ui.indexOf('function pb1485DateToggle('),end=ui.indexOf('function Hs(',start);assert(start>0&&end>start);
 for(const phone of [true,false]){
  let ownOpen=false,otherOpen=true,closed=0;
  const own={querySelector:()=>null},other={querySelector:selector=>selector.includes('Popover')?(otherOpen?{}:null):{click(){otherOpen=false;closed++}}};
  const ctx={pb1483Phone:()=>phone,document:{querySelectorAll:()=>[own,other]}};vm.createContext(ctx);vm.runInContext(ui.slice(start,end),ctx);
  ctx.pb1485DateToggle({currentTarget:{closest:()=>own}},ownOpen,fn=>ownOpen=fn(ownOpen));assert(ownOpen);assert.equal(otherOpen,!phone);assert.equal(closed,phone?1:0);
  ctx.pb1485DateToggle({currentTarget:{closest:()=>own}},ownOpen,fn=>ownOpen=fn(ownOpen));assert(!ownOpen);assert.equal(closed,phone?1:0);
 }
 assert(ui.includes('onClick:event=>pb1485DateToggle(event,c,m)'));new vm.Script(ui);
});
test('calendar placement stays inside viewport for both dates, narrow screens and reduced keyboard viewport',()=>{
 let source=fs.readFileSync(root+'photobridge-r1485-calendar.js','utf8');source=source.replace('function start(){','window.testRect=calendarRect;function start(){');
 const ctx={navigator:{userAgent:'Android Mobile Chrome'},window:{},document:{readyState:'loading',addEventListener(){}}};vm.runInNewContext(source,ctx);
 for(const width of [280,320,360,412])for(const height of [260,500,800])for(const trigger of [{top:150,bottom:186},{top:height-80,bottom:height-44}]){
  const v={left:0,top:0,width,height},dock=height-60,r=ctx.window.testRect(trigger,v,dock);
  assert(r.left>=8);assert(r.left+r.width<=width-8);assert(r.top>=8);assert(r.top+r.maxHeight<=dock-8+.001);assert(r.width>=width-16||r.width===340);
 }
 const desktop={navigator:{userAgent:'Windows NT 10.0'},window:{},document:{}};vm.runInNewContext(source,desktop);assert.equal(desktop.window.testRect,undefined);
});
test('phone styles keep tabs sticky, remove top gap, align compact financial controls and equal-height invoice actions',()=>{
 assert(css.includes('padding-top:0!important'));assert(css.includes('.financeNavDock{position:sticky!important;top:0'));assert(css.includes('.mainQueueFilters>button.active{background:#edf3ff'));
 assert(css.includes('width:26px!important'));assert(css.includes('min-height:68px!important'));
 assert(css.includes('grid-template-columns:1.05fr 1fr 1fr auto'));
 assert(css.includes('.pb1201InvoiceCounts{display:none'));assert(css.includes('.invoiceActionStack button{height:44px'));
 assert(css.includes('grid-template-columns:minmax(0,1fr) auto auto'));
 assert(css.includes('.invoiceListToolbar{display:grid!important;grid-template-columns:minmax(0,1fr) auto'));
 for(const line of css.split('\n').filter(l=>l.startsWith('html.')))assert(line.startsWith('html.pb1482LabPhoneMode body #root .labRoleWorkspace '));
});
test('Windows bundle bytes and original date handler remain untouched; public patch follows frozen snapshot',()=>{
 const dir=root+'lab-desktop-ui/',manifest=JSON.parse(fs.readFileSync(dir+'manifest.json','utf8'));for(const f of manifest.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(dir+f.name)).digest('hex'),f.sha256,f.name);
 const frozen=fs.readFileSync(dir+'assets/index-UIRefine-v655-r84.js','utf8');assert(!frozen.includes('pb1485DateToggle'));assert(frozen.includes('onClick:()=>m(k=>!k)'));
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');assert(build.indexOf('enable-r1485-mobile-finance.mjs')>build.indexOf('enable-r1484-mobile-taps.mjs'));
});
