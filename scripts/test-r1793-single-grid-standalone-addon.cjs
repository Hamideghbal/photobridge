'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
const site='dist/web',native='dist/web/lab-desktop-ui',bundle='assets/index-UIRefine-v655-r84.js';
test('R1793: customer tariff title and model price are children of the SAME CSS grid',()=>{
 const css=read(site+'/photobridge-r1793-single-grid-standalone-addon.css');
 assert(css.includes('grid-template-columns:148px repeat(var(--pb1793-columns,8),minmax(110px,1fr))'));
 assert(css.includes('display:contents!important'));
 assert(css.includes('overflow-x:auto!important'));
 assert(css.includes('grid-row:auto!important'));
 assert.equal(css,read(native+'/photobridge-r1793-single-grid-standalone-addon.css'));
 for(const root of [site,native]){
  const ui=read(root+'/'+bundle);
  const start=ui.indexOf('function Qj('),end=ui.indexOf('function Zj(',start);
  const q=ui.slice(start,end);
  assert(q.includes('style:{"--pb1793-columns":pb1777Fields.length}'),root+' shared column count absent');
  assert(q.includes('pb1777Fields.map(([k,label])=>'),root+' header must follow same dynamic column list');
  assert(q.includes('pb1777Fields.map(([k,E])=>'),root+' data must follow same dynamic column list');
  assert(read(root+'/index.html').includes('photobridge-r1793-single-grid-standalone-addon.css'));
 }
});
test('R1793: independent chassis/frame action sits beside file size action and never beneath individual photos',()=>{
 const ui=read(site+'/'+bundle);
 const a=ui.indexOf('function ej('),b=ui.indexOf('function vh(',a),p=ui.slice(a,b);
 assert(a>=0&&b>a);
 const old=p.indexOf('className:"primary simplePrintPilotPrimaryAdd"');
 const button=p.indexOf('className:"pb1793StandaloneLaunch"');
 const submit=p.indexOf('className:"primary simplePrintPilotHeaderSubmit');
 assert(old>=0&&button>old&&submit>button,'standalone action should be between original add and submit');
 assert(!p.includes('className:"pb1792AddonOnlyGroup"'),'R1792 misplaced group-level checkbox must be removed');
 assert(!p.includes('className:"pb1781WithoutPrint"'),'R1781 photo-level checkbox must stay removed');
 assert(p.includes('pb1793Standalone&&e.jsx(PB1793AddonOnlyDialog'));
 assert(p.includes('withoutPrint:true,isAddonOnly:true'));
 assert(p.includes('paperOverride:"none"'));
 assert(p.includes('NO_PRINT_ADDON_'));
 assert(p.includes('!pbF.isAddonOnly&&!Ku('),'no photo ratio checking for internal work ticket');
 assert(p.includes('Be.isAddonOnly?"بدون عکس":"جایگزین"'));
 const helper=read('scripts/r1793-addon-ticket-builder.js.txt');
 assert(helper.includes('NO PHOTO / DO NOT PRINT'));
 assert(helper.includes('frameColorId:color?.id||null'));
});
test('R1793: lab-trusted model rates and snapshots still apply to non-print order',()=>{
 const server=read('dist/api/server.js');
 assert(server.includes('stocks:catalog.stocks'));
 assert(server.includes("printType=withoutPrint?'none'"));
 assert(server.includes('pb1779Snapshot(labId,b,sizeId'));
 const modal=read('scripts/r1793-standalone-addon-dialog.js.txt');
 assert(modal.includes('prices.find(p=>String(p.id)===String(sizeId))'));
 assert(modal.includes('catalog.rates?.[row.id]?.[model.id]'));
 assert(modal.includes('catalog.stocks?.[row.id]?.[model.id]'));
 assert(modal.includes('onAdd({row,chassis,frame,color:effectiveColor||null,quantity:qty})'));
});
test('R1793: native Lab hot-update manifest is byte-for-byte consistent',()=>{
 const manifest=JSON.parse(read(native+'/manifest.json'));
 assert.equal(manifest.channel,'lab');
 for(const name of [bundle,'index.html','photobridge-r1793-single-grid-standalone-addon.css']){
  const entry=manifest.files.find(x=>x.name===name);
  assert(entry,name+' not in manifest');
  assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync(native+'/'+name)).digest('hex'),name+' hash');
 }
 assert.equal(manifest.build,crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'));
});
