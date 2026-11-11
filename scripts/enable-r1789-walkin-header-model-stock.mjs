/* R1789: model/size-specific chassis + frame inventory; align walk-in tariff header.
 * Both audiences share physical stock but retain independent pricing.
 * Preserve legacy stock, model IDs, and order/invoice snapshots. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const one=(src,before,after,where)=>{const n=src.split(before).length-1;if(n!==1)throw Error('[R1789] '+where+' anchor '+n);return src.replace(before,after)};
const section=(src,begin,end,patch,where)=>{const a=src.indexOf(begin),b=a<0?-1:src.indexOf(end,a+begin.length);if(a<0||b<=a)throw Error('[R1789] '+where+' region missing');return src.slice(0,a)+patch(src.slice(a,b))+src.slice(b)};

// The same inventory applies to both customer audiences. Null=unlimited, 0=empty.
const catalogPath='dist/api/lab-print-catalog.js';
let catalog=read(catalogPath);
catalog=one(catalog,
 ' return {types,rates:normalizeRates(data.rates),walkinRates:normalizeRates(data.walkinRates)};',
 ' const normalizeStocks=input=>{const result={};for(const [sizeId,row] of Object.entries(input||{})){if(!/^[a-zA-Z0-9_-]{1,110}$/.test(sizeId)||!row||typeof row!=="object"||Array.isArray(row))continue;const value={};for(const model of types.filter(t=>!t.legacy&&(t.kind==="frame"||t.kind==="chassis"))){if(!Object.hasOwn(row,model.id))continue;const n=row[model.id];if(n===null||n===""){value[model.id]=null;continue}if(Number.isSafeInteger(Number(n))&&Number(n)>=0&&Number(n)<=9000000000)value[model.id]=Number(n)}if(Object.keys(value).length)result[sizeId]=value;}return result;};\n return {types,rates:normalizeRates(data.rates),walkinRates:normalizeRates(data.walkinRates),stocks:normalizeStocks(data.stocks)};',
 'catalog stock normalization');
catalog=one(catalog,
 ' const sizes=new Set(sizeIds.map(String)),rates={...(catalog[key]||{})};',
 ' const sizes=new Set(sizeIds.map(String)),rates={...(catalog[key]||{})},stocks={...(catalog.stocks||{})};\n const allowedStocks=new Set(catalog.types.filter(t=>!t.legacy&&t.active!==false&&(t.kind==="chassis"||t.kind==="frame")).map(t=>t.id));',
 'stock model allowlist');
catalog=one(catalog,
 '  const input=row?.customRates;',
 '  if(row&&Object.hasOwn(row,"customStocks")){const inputStocks=row.customStocks;if(!inputStocks||typeof inputStocks!=="object"||Array.isArray(inputStocks))fail("print_catalog_invalid_stocks");const next={...(stocks[sizeId]||{})};for(const [id,raw] of Object.entries(inputStocks)){if(!allowedStocks.has(id))fail("print_catalog_unknown_stock_model");if(raw===null||raw===""){next[id]=null;continue}const n=Number(raw);if(!Number.isSafeInteger(n)||n<0||n>9000000000)fail("print_catalog_invalid_stock");next[id]=n;}stocks[sizeId]=next;}\n  const input=row?.customRates;',
 'stock updates in same rate transaction');
catalog=one(catalog,
 ' return {...catalog,[key]:rates};',
 ' return {...catalog,[key]:rates,stocks};',
 'persist stocks alongside rates');
write(catalogPath,catalog);

// Late UI patch for website and independently installed Windows Lab.
const roots=['dist/web','dist/web/lab-desktop-ui'],uiFile='assets/index-UIRefine-v655-r84.js';
const coerce='pb1789StockValue=v=>v==null||String(v).trim()===""?null:Na(v)';
function patchUi(ui,root){
 ui=section(ui,'function tw({data:t,onSaved:a,labName:s=""}){','function Na(t)',part=>{
  part=one(part,
   'const pb1539Label=(id,fallback)=>pb1539Types.find(t=>t.id===id)?.name||fallback;',
   'const pb1539Label=(id,fallback)=>pb1539Types.find(t=>t.id===id)?.name||fallback;const '+coerce+';',
   root+' stock converter');
  for(const kind of ['chassis','frame']){
   const old='pb1539Custom.filter(t=>t.kind==="'+kind+'").map(t=>["pb1539_"+t.id,t.name])';
   const newest='pb1539Custom.filter(t=>t.kind==="'+kind+'").flatMap(t=>[["pb1539_"+t.id,t.name],["pb1789_stock_"+t.id,"موجودی "+t.name]])';
   part=one(part,old,newest,root+' stock next to '+kind+' price');
  }
  const rates='customRates:Object.fromEntries(pb1539Custom.map(t=>[t.id,Na(Object.hasOwn(F,"pb1539_"+t.id)?F["pb1539_"+t.id]:pb1539.rates?.[F.id]?.[t.id]??null)]))';
  const stocks='customStocks:Object.fromEntries(pb1539Custom.filter(t=>t.kind==="chassis"||t.kind==="frame").map(t=>[t.id,pb1789StockValue(Object.hasOwn(F,"pb1789_stock_"+t.id)?F["pb1789_stock_"+t.id]:pb1539.stocks?.[F.id]?.[t.id])]))';
  part=one(part,rates,rates+','+stocks,root+' atomic colleague stock save');
  part=one(part,
   'value:C.includes("stock")?$u(k[C]??""):',
   'value:C.startsWith("pb1789_stock_")?$u(Object.hasOwn(k,C)?k[C]:pb1539.stocks?.[k.id]?.[C.slice(13)]??""):C.includes("stock")?$u(k[C]??""):',
   root+' colleague stock input');
  part=one(part,
   'w=(B,L)=>{const n=L.startsWith("pb1539_")?',
   'w=(B,L)=>{if(L.startsWith("pb1789_stock_")){const n=Object.hasOwn(B,L)?B[L]:pb1539.stocks?.[B.id]?.[L.slice(13)];return n==null||String(n)===""?"—":V(Number(n))+" عدد"}const n=L.startsWith("pb1539_")?',
   root+' stock print labels');
  return part;
 },root+' colleague tariff');
 ui=section(ui,'function Qj(','function Zj(',part=>{
  part=one(part,'const pb1788Rename=','const '+coerce+',pb1788Rename=',root+' walk-in stock converter');
  part=one(part,
   'pb1777Models.filter(v=>v.kind===field[0]).map(v=>["pb1539_"+v.id,v.name])',
   'pb1777Models.filter(v=>v.kind===field[0]).flatMap(v=>[["pb1539_"+v.id,v.name],["pb1789_stock_"+v.id,"موجودی "+v.name]])',
   root+' walk-in stock column per model');
  part=one(part,
   'pb1777Value=(row,key)=>key.startsWith("pb1539_")?',
   'pb1777Value=(row,key)=>key.startsWith("pb1789_stock_")?(Object.hasOwn(row,key)?row[key]:pb1777Catalog.stocks?.[row.id]?.[key.slice(13)]):key.startsWith("pb1539_")?',
   root+' shared model inventory lookup');
  part=one(part,
   'customRates:Object.fromEntries(pb1777Models.map(v=>[v.id,Na(pb1777Value(I,"pb1539_"+v.id))])),albumBindingPrice:',
   'customRates:Object.fromEntries(pb1777Models.map(v=>[v.id,Na(pb1777Value(I,"pb1539_"+v.id))])),customStocks:Object.fromEntries(pb1777Models.map(v=>[v.id,pb1789StockValue(pb1777Value(I,"pb1789_stock_"+v.id))])),albumBindingPrice:',
   root+' walk-in stock save');
  part=one(part,
   'value:Bn(pb1777Value(I,k)),onChange:',
   'value:k.startsWith("pb1789_stock_")?String(pb1777Value(I,k)??""):Bn(pb1777Value(I,k)),onChange:',
   root+' walk-in stock visible value');
  part=one(part,
   'onChange:C=>p(T,k,String(Mn(C.target.value)||"")),placeholder:',
   'onChange:C=>p(T,k,k.startsWith("pb1789_stock_")?(C.target.value.trim()===""?"":String(Mn(C.target.value)??"")):String(Mn(C.target.value)||"")),placeholder:',
   root+' walk-in zero stock/clear');
  part=one(part,
   'E=(F,M)=>{const value=pb1777Value(F,M);return value==null||String(value)===""||Number(value)===0?"—":',
   'E=(F,M)=>{const value=pb1777Value(F,M);return M.startsWith("pb1789_stock_")?(value==null||String(value)===""?"—":V(Number(value))+" عدد"):value==null||String(value)===""||Number(value)===0?"—":',
   root+' printed stock units');
  const gridStyle='style:{"--pb1777-columns":pb1777Fields.length,gridTemplateColumns:';
  if(part.split(gridStyle).length!==3)throw Error("[R1789] "+root+" walk-in header/row column style mismatch");
  part=part.replaceAll(gridStyle,'style:{"--pb1777-columns":pb1777Fields.length,"--pb1789-min-width":(148+pb1777Fields.length*110)+"px",gridTemplateColumns:');
  part=one(part,
   'e.jsx("span",{className:"pb1541TariffTitle",children:label})',
   'e.jsx("span",{className:"pb1541TariffTitle",title:label,children:label})',
   root+' header tooltip');
  return part;
 },root+' walk-in tariff');
 return ui;
}
for(const root of roots){
 const name=root+'/'+uiFile,ui=patchUi(read(name),root);
 write(name,ui);
 execFileSync(process.execPath,['--check',name],{stdio:'inherit'});
 let html=read(root+'/index.html');
 const cssName='photobridge-r1789-walkin-stock-grid.css';
 if(!html.includes(cssName))html=html.replace('</head>','<link rel="stylesheet" href="/'+cssName+'?v=r1789"></head>');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,v=>v.includes('&modelStock=r1789')?v:v+'&modelStock=r1789');
 write(root+'/index.html',html);
}
fs.copyFileSync('dist/web/photobridge-r1789-walkin-stock-grid.css','dist/web/lab-desktop-ui/photobridge-r1789-walkin-stock-grid.css');
const native='dist/web/lab-desktop-ui',manifestFile=native+'/manifest.json';
const manifest=JSON.parse(read(manifestFile)),hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if(manifest.channel!=='lab'||manifest.protocol!==1)throw Error('[R1789] invalid native Lab manifest');
for(const name of [uiFile,'photobridge-r1789-walkin-stock-grid.css','index.html']){
 const digest=hash(native+'/'+name),entry=manifest.files.find(f=>f.name===name);
 if(entry)entry.sha256=digest;else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256:digest});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
manifest.generatedAt=new Date().toISOString();
write(manifestFile,JSON.stringify(manifest));
execFileSync(process.execPath,['--check',catalogPath],{stdio:'inherit'});
console.log('[R1789] matched walk-in tariff headers; independent stock per model/size shared by both audiences');
