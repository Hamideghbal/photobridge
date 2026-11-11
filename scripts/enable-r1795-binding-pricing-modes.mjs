// R1795: selectable separate/combined album binding prices, independently of R1787 receipts.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const one=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error('[R1795] '+label+' anchor '+n);return s.replace(a,b)};
const region=(s,a,b,fn,label)=>{const i=s.indexOf(a),j=i<0?-1:s.indexOf(b,i+a.length);if(i<0||j<=i)throw Error('[R1795] '+label+' bounds');return s.slice(0,i)+fn(s.slice(i,j))+s.slice(j)};
const changes=new Map();
let catalog=read('dist/api/lab-print-catalog.js');
catalog=one(catalog,'stocks:normalizeStocks(data.stocks)};','stocks:normalizeStocks(data.stocks),albumPricingMode:data.albumPricingMode==="combined"?"combined":"separate"};','mode normalization');
catalog=one(catalog,"  if(method==='POST'){\n   updated=addPrintType(catalog,body);",`  if(method==='PATCH'&&Object.hasOwn(body,'albumPricingMode')){
   if(!['separate','combined'].includes(body.albumPricingMode))fail('print_catalog_invalid_album_pricing_mode');
   updated={...catalog,albumPricingMode:body.albumPricingMode};
  }else if(method==='POST'){
   updated=addPrintType(catalog,body);`,'mode update');
catalog=one(catalog,"method==='POST'?'print_catalog.type_create':body.active===false?","method==='POST'?'print_catalog.type_create':Object.hasOwn(body,'albumPricingMode')?'print_catalog.album_pricing_mode':body.active===false?",'mode audit');
catalog=one(catalog,'{kind:body.kind,id:body.id||updated.types.at(-1)?.id}).catch(()=>{});',"(Object.hasOwn(body,'albumPricingMode')?{previousMode:catalog.albumPricingMode,albumPricingMode:updated.albumPricingMode}:{kind:body.kind,id:body.id||updated.types.at(-1)?.id})).catch(()=>{});",'mode audit detail');
changes.set('dist/api/lab-print-catalog.js',catalog);

let server=read('dist/api/server.js');
server=region(server,'async function albumOrderSnapshot(','\nasync function ',s=>{
 s=one(s,'async function albumOrderSnapshot(labId, input) {','async function albumOrderSnapshot(labId, input, existingPricingMode) {','internal frozen mode argument');
 s=one(s,'    const spreads = Math.max(1, Math.floor(Number(input?.spreads || 0)));',`    const pb1795Combined=(existingPricingMode??catalog.printTariffCatalog?.albumPricingMode)==='combined';
    const spreads = Math.max(1, Math.floor(Number(input?.spreads || 0)));`,'snapshot mode');
 s=one(s,'const raw = customSize ? null : size[type];','const raw = pb1795Combined ? 0 : customSize ? null : size[type];','included paper price');
 s=one(s,'const missingPaperTariff = customSize || paperBreakdown.some(x => x.unitPrice == null);','const missingPaperTariff = !pb1795Combined && (customSize || paperBreakdown.some(x => x.unitPrice == null));','combined missing paper');
 s=one(s,'        pricing: {\n            manualRequired,',"        pricing: {\n            albumPricingMode:pb1795Combined?'combined':'separate',\n            manualRequired,",'immutable pricing mode');
 return s;
},'album snapshot');
server=region(server,'const paperBreakdown = Array.isArray(ad?.paperBreakdown) && ad.paperBreakdown.length','const needManualCover =',s=>{
 s=one(s,'            const needManualPrint =',"            const pb1795Combined=pricing.albumPricingMode==='combined';\n            const needManualPrint =",'invoice frozen mode');
 s=one(s,'if (needManualPrint) {','if (!pb1795Combined && needManualPrint) {','manual print charge');
 s=one(s,'else {\n                for (const row of paperBreakdown)','else if (!pb1795Combined) {\n                for (const row of paperBreakdown)','paper invoice lines');
 s=one(s,"${String(ad?.binding?.name||'صحافی آلبوم').trim()} ${String(ad?.size?.label || 'سایز آزاد').trim()}","${pb1795Combined?'چاپ و صحافی · ':''}${String(ad?.binding?.name||'صحافی آلبوم').trim()} ${String(ad?.size?.label || 'سایز آزاد').trim()}",'invoice bundled description');
 return s;
},'album invoice');
server=one(server,'printTypeLabel: `هزینه صحافی · هر صفحه`',"printTypeLabel: pricing.albumPricingMode==='combined'?'هزینه چاپ و صحافی · هر لت':`هزینه صحافی · هر صفحه`",'manual combined price label');
server=region(server,'        const cancelCustomerDraft =',"        if (cancelCustomerDraft && req.method === 'DELETE')",s=>{
 s=one(s,'SELECT id,mode FROM orders','SELECT id,mode,album_data FROM orders','draft snapshot read');
 s=one(s,'albumOrderSnapshot(labId, b.albumData);',"albumOrderSnapshot(labId, b.albumData, current.rows[0].album_data?.pricing?.albumPricingMode||'separate');",'draft retains mode');
 return s;
},'draft mode');
changes.set('dist/api/server.js',server);

const helper=read('scripts/r1795-binding-pricing-settings.js.txt');
const style='photobridge-r1795-binding-pricing.css';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/assets/index-UIRefine-v655-r84.js';let ui=read(file);
 ui=region(ui,'function tw(','function Na(',s=>{
  s=one(s,'["album_binding_price",pb1539Label("album_binding_price","صحافی آلبوم")]','["album_binding_price",pb1539.albumPricingMode==="combined"?"چاپ و صحافی":pb1539Label("album_binding_price","صحافی آلبوم")]','default tariff label');
  s=one(s,'pb1539Custom.filter(t=>t.kind==="binding").map(t=>["pb1539_"+t.id,t.name])','pb1539Custom.filter(t=>t.kind==="binding").map(t=>["pb1539_"+t.id,PB1795BindingLabel(t.name,pb1539.albumPricingMode==="combined")])','custom tariff labels');
  s=one(s,'return e.jsxs(e.Fragment,{children:[','return e.jsxs(e.Fragment,{children:[e.jsx(PB1795BindingPricingSettings,{onSaved:next=>pb1539Set(next.printTariffCatalog)}),','tariff mode control');
  s=one(s,'pb1539Rename(k.startsWith("pb1539_")?k.slice(7):k,E)','pb1539Rename(k.startsWith("pb1539_")?k.slice(7):k,pb1539Types.find(t=>t.id===(k.startsWith("pb1539_")?k.slice(7):k))?.name||E)','raw desktop model name');
  s=one(s,'pb1539Rename(C.startsWith("pb1539_")?C.slice(7):C,w)','pb1539Rename(C.startsWith("pb1539_")?C.slice(7):C,pb1539Types.find(t=>t.id===(C.startsWith("pb1539_")?C.slice(7):C))?.name||w)','raw mobile model name');
  return s;
 },root+' tariff');
 ui=one(ui,"className:'albumSettingsWorkspace pb1380AlbumEditor',children:[","className:'albumSettingsWorkspace pb1380AlbumEditor',children:[e.jsx(PB1795BindingPricingSettings,{settings,onSaved:next=>setSettings(old=>({...old,printTariffCatalog:next.printTariffCatalog}))}),",root+' active settings');
 ui=region(ui,'function Kv(','function ',s=>{
  s=one(s,'pb1539Catalog=l.printTariffCatalog||', 'pb1795Combined=(he.current?he.current.album_data?.pricing?.albumPricingMode:l.printTariffCatalog?.albumPricingMode)==="combined",pb1539Catalog=l.printTariffCatalog||','preview frozen mode');
  s=one(s,'Tt=!!(Q||yt.some($e=>!$e.known))','Tt=!pb1795Combined&&!!(Q||yt.some($e=>!$e.known))','preview paper availability');
  s=one(s,'ma=Tt?0:yt.reduce','ma=Tt||pb1795Combined?0:yt.reduce','preview paper subtotal');
  s=one(s,'children:[yt.map($e=>','children:[!pb1795Combined&&yt.map($e=>','preview separate rows');
  s=one(s,'children:[pb1539Chosen.name," · "','children:[PB1795BindingLabel(pb1539Chosen.name,pb1795Combined)," · "','preview combined row');
  s=one(s,'label:$e.label+" · صحافی "+V(pb1539PriceOf($e))','label:$e.label+(pb1795Combined?" · چاپ و صحافی ":" · صحافی ")+V(pb1539PriceOf($e))','preview size price');
  s=one(s,'Q?"این آلبوم با سایز آزاد ارسال می‌شود؛ هزینه چاپ، صحافی و جلد باید توسط لابراتوار تعیین شود."','Q?(pb1795Combined?"این آلبوم با سایز آزاد ارسال می‌شود؛ مبلغ یکپارچه چاپ و صحافی و هزینه جلد توسط لابراتوار تعیین می‌شود.":"این آلبوم با سایز آزاد ارسال می‌شود؛ هزینه چاپ، صحافی و جلد باید توسط لابراتوار تعیین شود.")','manual combined notice');
  return s;
 },root+' photographer preview');
 ui+='\n/* PB1795 BINDING PRICING MODES */\n'+helper;
 changes.set(file,ui);
 let intake=read(root+'/photobridge-r1137-lab-local-intake.js');
 intake=one(intake,'for(const [paper,count] of Object.entries(paperCounts)){if(!count)continue;','for(const [paper,count] of Object.entries(paperCounts)){if(!count||album.printTariffCatalog?.albumPricingMode==="combined")continue;',root+' intake print charges');
 intake=one(intake,"(pb1551Binding()?.name||'صحافی')+' '+list.length+' لت'","(album.printTariffCatalog?.albumPricingMode==='combined'?'چاپ و صحافی · ':'')+(pb1551Binding()?.name||'صحافی')+' '+list.length+' لت'",root+' intake combined label');
 changes.set(root+'/photobridge-r1137-lab-local-intake.js',intake);
 let html=read(root+'/index.html');
 html=one(html,'</head>','<link rel="stylesheet" href="/'+style+'?v=r1795"></head>',root+' styles');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u+'&bindingMode=r1795');
 html=html.replace(/(photobridge-r1137-lab-local-intake\.js\?[^"']*)/g,u=>u+'&bindingMode=r1795');
 changes.set(root+'/index.html',html);
}
changes.set('dist/web/lab-desktop-ui/'+style,read('dist/web/'+style));
for(const [file,content] of changes){fs.writeFileSync(file,content);if(file.endsWith('.js'))execFileSync(process.execPath,['--check',file],{stdio:'inherit'})}
const native='dist/web/lab-desktop-ui',mf=native+'/manifest.json',manifest=JSON.parse(read(mf));
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
for(const name of ['assets/index-UIRefine-v655-r84.js','photobridge-r1137-lab-local-intake.js','index.html',style]){
 const entry=manifest.files.find(f=>f.name===name),sha256=hash(fs.readFileSync(native+'/'+name));
 if(entry)entry.sha256=sha256;else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=hash(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(mf,JSON.stringify(manifest));
console.log('[R1795] separate or combined binding tariffs, immutable order mode and matched web/native estimates');
