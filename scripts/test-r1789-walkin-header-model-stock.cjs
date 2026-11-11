'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const {pathToFileURL}=require('node:url');
const read=p=>fs.readFileSync(p,'utf8');
const web='dist/web',lab='dist/web/lab-desktop-ui',file='assets/index-UIRefine-v655-r84.js';
test('R1789: stock keyed by model and print size; both audiences share stock but not price',async()=>{
 const api=await import(pathToFileURL(path.resolve('dist/api/lab-print-catalog.js')).href);
 let c=api.normalizePrintCatalog();
 c=api.addPrintType(c,{kind:'chassis',name:'شاسی ۴۰۰۰'});
 c=api.addPrintType(c,{kind:'chassis',name:'شاسی ۸۰۰۰'});
 c=api.addPrintType(c,{kind:'frame',name:'قاب چوبی'});
 const [a,b,f]=c.types.filter(x=>!x.legacy);
 c=api.applyPrintRates(c,[{sizeId:'s1',customRates:{[a.id]:100000,[b.id]:200000,[f.id]:300000},customStocks:{[a.id]:7,[b.id]:0,[f.id]:4}}],['s1']);
 assert.equal(c.stocks.s1[a.id],7);
 assert.equal(c.stocks.s1[b.id],0);
 assert.equal(c.stocks.s1[f.id],4);
 c=api.applyWalkinPrintRates(c,[{sizeId:'s1',customRates:{[a.id]:150000},customStocks:{[a.id]:8,[b.id]:0,[f.id]:null}}],['s1']);
 assert.equal(c.rates.s1[a.id],100000);
 assert.equal(c.walkinRates.s1[a.id],150000);
 assert.deepEqual([c.stocks.s1[a.id],c.stocks.s1[b.id],c.stocks.s1[f.id]],[8,0,null]);
 c=api.applyPrintRates(c,[{sizeId:'s2',customStocks:{[a.id]:12}}],['s2']);
 assert.equal(c.stocks.s2[a.id],12);
 assert.equal(c.stocks.s1[a.id],8);
 assert.throws(()=>api.applyPrintRates(c,[{sizeId:'s1',customStocks:{[a.id]:-1}}],['s1']),/print_catalog_invalid_stock/);
 assert.throws(()=>api.applyPrintRates(c,[{sizeId:'s1',customStocks:{[a.id]:2.5}}],['s1']),/print_catalog_invalid_stock/);
 assert.throws(()=>api.applyPrintRates(c,[{sizeId:'s1',customStocks:{frame:2}}],['s1']),/print_catalog_unknown_stock_model/);
 const restored=api.normalizePrintCatalog(c);
 assert.equal(restored.stocks.s1[b.id],0);
 assert.equal(restored.stocks.s2[a.id],12);
 assert.equal(restored.rates.s1[a.id],100000);
});
test('R1789: website + native tariff contain paired model price and stock columns',()=>{
 for(const root of [web,lab]){
  const js=read(root+'/'+file);
  const a=js.indexOf('function tw({data:t,onSaved:a,labName:s=""}){'),b=js.indexOf('function Na(t)',a);
  const c=js.indexOf('function Qj('),d=js.indexOf('function Zj(',c);
  assert(a>=0&&b>a&&c>=0&&d>c);
  const p=js.slice(a,b),q=js.slice(c,d);
  assert(p.includes('pb1789_stock_'),root+' photographer prices missing model stock');
  assert(p.includes('customStocks:Object.fromEntries'),root+' photographer saving missing');
  assert(p.includes('pb1539.stocks?.[F.id]'),root+' photographer reload missing');
  assert(q.includes('pb1789_stock_'),root+' customer-free prices missing model stock');
  assert(q.includes('customStocks:Object.fromEntries'),root+' customer-free saving missing');
  assert(q.includes('pb1777Catalog.stocks?.[row.id]'),root+' customer-free reload missing');
  assert(q.includes('pb1788Rename')&&q.includes('pb1788Delete'),'header action buttons preserved');
  assert(q.includes('pb1777FrameEditLaunch'),'one frame color icon retained');
  const html=read(root+'/index.html');
  assert(html.includes('photobridge-r1789-walkin-stock-grid.css'));
  assert(html.includes('modelStock=r1789'));
 }
 const css=read(web+'/photobridge-r1789-walkin-stock-grid.css');
 assert(css.includes('repeat(var(--pb1777-columns,8),minmax(110px,1fr))'));
 assert(css.includes('.pb1541TariffActions'));
 assert(css.includes('.pb1777ModelGrid:not(.head)>label>input'));
 const nativeCss=read(lab+'/photobridge-r1789-walkin-stock-grid.css');
 assert.equal(nativeCss,css);
});
test('R1789: rendered free-customer tariff has matching header/row columns and saves zero stock',async()=>{
 const ui=read(web+'/'+file);
 const start=ui.indexOf('function Qj('),end=ui.indexOf('function Zj(',start);
 const helperStart=ui.indexOf('function PB1437TariffFields('),helperEnd=ui.indexOf('\nfunction ',helperStart);
 const catalog={types:[{id:'wood',kind:'frame',name:'قاب چوبی'},{id:'board',kind:'chassis',name:'شاسی ۴۰۰۰'}],walkinRates:{s1:{wood:205000,board:260000}},stocks:{s1:{wood:5,board:0}}};
 const row={id:'s1',label:'20x30',width_cm:20,height_cm:30,luster:10000,silk:11000,metallic:12000,chassis:13000,frame:14000,album_binding_price:15000,chassis_stock:7,frame_stock:8};
 const requests=[],printed=[];let stateIndex=0;
 const ctx={
  x:{useState(initial){const i=stateIndex++;return [i===0?{lab:{name:'Lab'},url:'/walkin'}:Array.isArray(initial)?[row]:initial?.walkinRates?catalog:initial,()=>{}]},useRef:v=>({current:v}),useEffect(){}},
  e:{jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})},
  Me:async(url,options)=>{requests.push({url,options});return url==='/api/lab/print-catalog'?{catalog}:{lab:{},prices:[row]}},
  Na:Number,Bn:v=>String(v??''),Mn:Number,V:String,gr:String,alert(){},
  window:{open:()=>({document:{open(){},write:html=>printed.push(html),close(){}}})}
 };
 ctx.PB1437TariffFields=vm.runInNewContext('('+ui.slice(helperStart,helperEnd)+')',ctx);
 const render=vm.runInNewContext('('+ui.slice(start,end)+')',ctx);
 const nodes=[];function visit(n){if(Array.isArray(n))return n.forEach(visit);if(!n||typeof n!=='object')return;nodes.push(n);visit(n.props?.children)}
 visit(render({pricingOnly:true}));
 const grids=nodes.filter(n=>String(n.props?.className||'').includes('pb1777ModelGrid'));
 assert.equal(grids.length,2);
 assert(grids.every(n=>n.props.style['--pb1777-columns']===12),'header and price rows must both have 12 fields');
 const inputs=nodes.filter(n=>n.type==='input'&&n.props['aria-label']);
 assert.equal(inputs.length,12);
 assert(inputs.some(n=>n.props['aria-label']==='موجودی قاب چوبی 20x30'&&n.props.value==='5'));
 assert(inputs.some(n=>n.props['aria-label']==='موجودی شاسی ۴۰۰۰ 20x30'&&n.props.value==='0'));
 await nodes.find(n=>n.type==='button'&&n.props.children==='ذخیره تعرفه').props.onClick();
 const posted=JSON.parse(requests.find(r=>r.url==='/api/lab/walkin/prices').options.body).rows[0];
 assert.equal(posted.customStocks.wood,5);
 assert.equal(posted.customStocks.board,0);
 assert.equal(posted.customRates.wood,205000);
 nodes.find(n=>n.type==='button'&&n.props.children==='چاپ تعرفه').props.onClick();
 assert(printed[0].includes('5 عدد')&&printed[0].includes('0 عدد'));
});
test('R1789: Windows hot update manifest hashes match the exact new assets',()=>{
 const manifest=JSON.parse(read(lab+'/manifest.json'));
 assert.equal(manifest.channel,'lab');
 assert.equal(manifest.build,crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'),'native build hash must be calculated from manifest content');
 for(const name of [file,'index.html','photobridge-r1789-walkin-stock-grid.css']){
  const item=manifest.files.find(e=>e.name===name);
  assert(item,'missing '+name);
  assert.equal(item.sha256,crypto.createHash('sha256').update(fs.readFileSync(lab+'/'+name)).digest('hex'));
 }
});
