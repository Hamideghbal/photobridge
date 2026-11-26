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
 assert(modal.includes('await onAdd(draft.lines)'));
 assert(modal.includes('PB2040AddonLines(row,available,quantities,colorIds,priceFor,stockFor)'));
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

test('R2040 each chosen model has a separate quantity and billable ticket; invalid stock/color is not accepted',()=>{
 const modal=read('scripts/r1793-standalone-addon-dialog.js.txt');
 const helper=modal.slice(modal.indexOf('function PB2040AddonLines'),modal.indexOf('function PB1793AddonOnlyDialog'));
 const collect=new Function(helper+'\nreturn PB2040AddonLines;')();
 const row={id:'3040',label:'30×40'},models=[
  {id:'c8',kind:'chassis',name:'8mm'},
  {id:'c16',kind:'chassis',name:'16mm'},
  {id:'f1',kind:'frame',name:'Frame 1',colors:[{id:'white'},{id:'black'}]},
  {id:'f2',kind:'frame',name:'Frame 2',colors:[{id:'brown'}]}
 ];
 const prices={c8:100,c16:200,f1:300,f2:400},stocks={c8:3,c16:4,f1:2,f2:5};
 const run=(qty,colors={f1:'white'})=>collect(row,models,qty,colors,m=>prices[m.id],m=>stocks[m.id]);
 const good=run({c8:2,c16:3,f1:1,f2:4});
 assert.equal(good.error,'');assert.equal(good.count,10);assert.equal(good.total,2700);
 assert.deepEqual(good.lines.map(l=>[l.chassis?.id||l.frame?.id,l.quantity,l.color?.id||null]),[['c8',2,null],['c16',3,null],['f1',1,'white'],['f2',4,'brown']]);
 for(const qty of [{c8:4},{c8:-1},{c8:1.5},{c8:100},{c8:'abc'},{}])assert(run(qty).error);
 assert(run({f1:1},{}).error);assert.equal(run({c8:0,f2:2}).lines.length,1);
 assert.equal(run({f2:2}).total,800);
 assert(modal.includes('setQuantities({});setColorIds({})'));
});
test('R2040 every no-print model becomes an independent file in a single atomic draft update',async()=>{
 const helper=read('scripts/r1793-addon-ticket-builder.js.txt');
 let groups=[],updates=0,closed=0,seq=0,revoked=[],failAt=0,canvasCount=0;
 const doc={createElement:()=>{const index=++canvasCount;return {getContext:()=>({fillRect(){},fillText(){}}),toBlob:done=>done(index===failAt?null:{size:10})}}};
 const build=new Function('document','File','URL','crypto','k','eg','js','Kr','t','pb1793SetStandalone','Ze',helper+'\nreturn pb1793Add;')(
  doc,class {constructor(parts,name){this.name=name}}, {createObjectURL:()=>String(++seq),revokeObjectURL:url=>revoked.push(url)},
  {randomUUID:()=>String(++seq).padStart(8,'0')+'-1234-4567'},fn=>{updates++;groups=fn(groups)},r=>r.label,()=>['luster'],()=>['luster'],{},()=>closed++,()=>{});
 const row={id:'30x40',label:'30×40'};
 const items=[{row,chassis:{id:'c8',name:'8mm'},frame:null,color:null,quantity:2},{row,chassis:null,frame:{id:'f1',name:'Frame'},color:{id:'white',name:'white'},quantity:3}];
 await build(items);assert.equal(updates,1);assert.equal(closed,1);assert.equal(groups.length,1);
 assert.deepEqual(groups[0].files.map(f=>[f.chassisModelId,f.frameModelId,f.printCopies,f.withoutPrint,f.paperOverride]),[['c8',null,2,true,'none'],[null,'f1',3,true,'none']]);
 failAt=canvasCount+2;
 await assert.rejects(build(items));assert.equal(updates,1);assert.equal(closed,1);assert.equal(groups[0].files.length,2);assert.equal(revoked.length,1);
});
