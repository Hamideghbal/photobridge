'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const roots=['dist/web','dist/web/lab-desktop-ui'];

test('R1651 embedded photographer invoice is made visible above Windows chrome without minifier anchor',()=>{
 const script=fs.readFileSync('scripts/r1651-photographer-invoice-host.js','utf8');
 const css=fs.readFileSync('scripts/r1651-photographer-invoice-host.css','utf8');
 assert.match(script,/pbDesktopContent/);
 assert.match(script,/window\.parent===window/);
 assert.match(script,/pb1126Desktop/);
 assert.match(script,/\.pb1126ContentPanel/);
 assert.match(script,/dataset\.panel!=='print'/);
 assert.match(script,/globalInvoicePreviewLayer\.invoicePreviewBack/);
 assert.match(script,/MutationObserver\(sync\)/);
 assert.match(script,/panel\.classList\.toggle\('pb1651InvoiceOpen',visible\)/);
 assert.match(script,/pagehide/);
 assert.match(css,/pb1651InvoiceOpen/);
 assert.match(css,/z-index:2147483646!important/);
 assert.match(css,/width:min\(940px,calc\(100vw - 24px\)\)!important/);
 assert.match(css,/html\.pb1126Embedded/);
 assert.doesNotMatch(script,/api\/lab\//);
});

test('R1651 invoice host raises its parent only while the modal is visible and restores it on navigation',()=>{
 const vm=require('node:vm');
 const source=fs.readFileSync('scripts/r1651-photographer-invoice-host.js','utf8');
 let visibleNode=null,callback=null,pagehide=null,active=false,disconnected=false;
 const panel={
  dataset:{panel:'print'},
  classList:{toggle:(name,next)=>{assert.equal(name,'pb1651InvoiceOpen');active=next;},
    remove:name=>{assert.equal(name,'pb1651InvoiceOpen');active=false}}
 };
 const fakeWindow={parent:{document:{documentElement:{classList:{contains:name=>name==='pb1126Desktop'}}}},
  frameElement:{closest:name=>name==='.pb1126ContentPanel'?panel:null},
  addEventListener:(name,fn)=>{if(name==='pagehide')pagehide=fn}
 };
 const fakeDocument={body:{},querySelector:()=>visibleNode};
 class Observer{constructor(fn){callback=fn}observe(){}disconnect(){disconnected=true}}
 vm.runInNewContext(source,{
  window:fakeWindow,document:fakeDocument,MutationObserver:Observer,URLSearchParams,
  location:{pathname:'/photographer/orders/flow',search:'?pbDesktopContent=1'},
  getComputedStyle:()=>({display:'flex',visibility:'visible'})
 });
 assert.equal(active,false);
 assert.equal(typeof callback,'function');
 visibleNode={getAttribute:()=>null};
 callback();
 assert.equal(active,true);assert.equal(panel.dataset.pb1651InvoiceOpen,'1');
 visibleNode=null;callback();
 assert.equal(active,false);assert.equal(panel.dataset.pb1651InvoiceOpen,'0');
 visibleNode={getAttribute:()=>null};callback();assert.equal(active,true);
 pagehide();
 assert.equal(active,false);assert.equal(disconnected,true);
 assert.equal(Object.hasOwn(panel.dataset,'pb1651InvoiceOpen'),false);
});

test('R1651 verified native and website asset registration, cache and parsed fallback JS',()=>{
 const host='photobridge-r1651-invoice-host.js',styles='photobridge-r1651-invoice-host.css';
 for(const root of roots){
  const html=fs.readFileSync(root+'/index.html','utf8');
  assert.equal(html.split(host+'?v=r1651').length-1,1,root+' host');
  assert.equal(html.split(styles+'?v=r1651').length-1,1,root+' stylesheet');
  assert(html.includes('photobridge-r1648-photographer-invoice.css?v=r1648'));
  assert(html.includes('photoInvoice=r1648'));
  assert(html.includes('invoiceStability=r1648'));
  assert.equal(fs.readFileSync(root+'/'+host,'utf8'),
   fs.readFileSync('scripts/r1651-photographer-invoice-host.js','utf8'));
  assert.equal(fs.readFileSync(root+'/'+styles,'utf8'),
   fs.readFileSync('scripts/r1651-photographer-invoice-host.css','utf8'));
 }
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 assert.equal(manifest.protocol,1);
 assert.equal(manifest.channel,'lab');
 for(const name of ['index.html','assets/index-UIRefine-v655-r84.js','photobridge-r1126-desktop-navigation.js',
  'photobridge-r1648-photographer-invoice.css','photobridge-r1651-invoice-host.js',
  'photobridge-r1651-invoice-host.css']){
  const row=manifest.files.find(item=>item.name===name);
  assert(row,'missing native asset '+name);
  assert.equal(row.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'),name);
 }
});

test('R1648 compiled portal remains an optimization, not a mandatory build anchor',()=>{
 const installer=fs.readFileSync('scripts/enable-r1648-photographer-invoice-preview.mjs','utf8');
 assert.match(installer,/try\{/);
 assert.match(installer,/standalone iframe host enabled/);
 assert.match(installer,/Desktop header transform skipped/);
 assert.match(installer,/fs\.copyFileSync\('scripts\/r1651-photographer-invoice-host\.js'/);
 for(const root of roots){
  const js=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  const patched=js.includes('function pb1648InvoicePortal(');
  if(patched){
   const start=js.indexOf('function pb1648InvoicePortal(');
   const invoiceStart=js.indexOf('function Oc(',start);
   const end=invoiceStart<0?-1:js.indexOf('function ',invoiceStart+'function Oc('.length);
   assert(start>=0&&invoiceStart>start&&end>invoiceStart,root+' patched invoice boundary');
   const component=js.slice(start,end);
   assert.match(component,/ownerDocument\.body/);
   assert.match(component,/pb1648InvoicePortal\(t\)\)\}/);
   assert.match(component,/labInvoicePreview/);
   assert.match(component,/customerInvoicePreview/);
  }else{
   const script=fs.readFileSync(root+'/photobridge-r1651-invoice-host.js','utf8');
   assert(script.includes("pb1651InvoiceOpen"),root+' host fallback required');
  }
 }
});

test('R1648 desktop navigation updates are safe when preceding releases rewrite header markup',()=>{
 for(const root of roots){
  const nav=fs.readFileSync(root+'/photobridge-r1126-desktop-navigation.js','utf8');
  assert(nav.includes('pb1126DesktopHeader'),root);
  if(nav.includes('/* PB1648 stable print header */')){
   assert.match(nav,/filter\(c=>!\['active','loading','pending'\]\.includes\(c\)\)/);
   assert.doesNotMatch(nav,/visible\.map\(el=>el\.outerHTML\)/);
   assert.match(nav,/_pb1648HeaderObserver\?\.disconnect\(\)/);
  }
 }
});

test('R1651 source assets are installed before R1649 album layout; finance writes remain untouched',()=>{
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 const prior=build.indexOf("await deployStep('./enable-r1646-photographer-ledger.mjs')");
 const overlay=build.indexOf("await deployStep('./enable-r1648-photographer-invoice-preview.mjs')");
 const album=build.indexOf("await deployStep('./enable-r1649-photographer-album-card.mjs')");
 assert(prior>=0&&overlay>prior&&album>overlay);
 const installer=fs.readFileSync('scripts/enable-r1648-photographer-invoice-preview.mjs','utf8');
 assert(!installer.includes('UPDATE invoices'));
 assert(!installer.includes('UPDATE orders'));
});
