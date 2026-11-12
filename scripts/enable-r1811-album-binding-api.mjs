
/* R1811 API: new per-model paper-price matrices, backward compatible with R1805 / R1810. */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const once=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error('[R1811 API] '+label+' anchor '+n);return s.replace(a,b)};
const region=(s,a,b,fn,label)=>{
 const i=s.indexOf(a),j=i<0?-1:s.indexOf(b,i+a.length);
 if(i<0||j<=i)throw Error('[R1811 API] '+label+' section');
 return s.slice(0,i)+fn(s.slice(i,j))+s.slice(j);
};
let catalog=read('dist/api/lab-print-catalog.js');
catalog=once(catalog,'export function normalizePrintCatalog(raw){',
 read('scripts/r1811-album-binding-model-rates.js.txt')+'\nexport function normalizePrintCatalog(raw){','normalizer injection');
catalog=once(catalog,
 'walkinAlbumBindingRates:pb1810CleanWalkinBindingRates(data.walkinAlbumBindingRates)};',
 'walkinAlbumBindingRates:pb1810CleanWalkinBindingRates(data.walkinAlbumBindingRates),albumCombinedModelRates:pb1811CleanCombinedModelRates(data.albumCombinedModelRates),walkinAlbumCombinedModelRates:pb1811CleanCombinedModelRates(data.walkinAlbumCombinedModelRates)};',
 'two new matrices');
catalog=once(catalog,
 'export function addPrintType(catalog,{kind,name,latinName}){',
 'export function addPrintType(catalog,{kind,name,latinName,allowCombinedModel}){',
 'explicit combined model creation flag');
catalog=once(catalog,
 "if(kind==='binding'&&catalog.albumPricingMode==='combined')fail('album_binding_model_locked');",
 "if(kind==='binding'&&catalog.albumPricingMode==='combined'&&allowCombinedModel!==true)fail('album_binding_model_locked');",
 'protect legacy combined model guard');
write('dist/api/lab-print-catalog.js',catalog);
let server=read('dist/api/server.js');
server=region(server,'async function pb1810SaveAlbumBindingPrices(','async function albumOrderSnapshot(',s=>{
 s=once(s,
  'if(!row||!Object.hasOwn(row,"combinedAlbumRates"))throw bad("album_binding_combined_rates_required");',
  'if(!row||(!Object.hasOwn(row,"combinedAlbumRates")&&!Object.hasOwn(row,"combinedModelRates")))throw bad("album_binding_combined_rates_required");',
  'model rate input acceptance');
 const add=[
 '  // Preserve historic default combined tariffs while storing new model-specific tariffs.',
 '  if(combined){',
 '   const field=audience==="walkin"?"walkinAlbumCombinedModelRates":"albumCombinedModelRates";',
 '   const next={...(updated[field]||{})};',
 '   const allowed=new Set((updated.types||[]).filter(t=>t.kind==="binding"&&t.legacy!==true&&t.active!==false).map(t=>String(t.id)));',
 '   for(const row of rows){',
 '    const supplied=row?.combinedModelRates;',
 '    if(supplied===undefined)continue;',
 '    if(!supplied||typeof supplied!=="object"||Array.isArray(supplied))throw bad("album_binding_model_rates_invalid");',
 '    const sizeId=String(row.sizeId),models={...(next[sizeId]||{})};',
 '    for(const [id,papers] of Object.entries(supplied)){',
 '     if(!allowed.has(String(id)))throw bad("album_binding_unknown_model");',
 '     if(!papers||typeof papers!=="object"||Array.isArray(papers)||Object.keys(papers).some(p=>!["luster","silk","metallic"].includes(p)))throw bad("album_binding_model_papers_invalid");',
 '     const values={...(models[id]||{})};',
 '     for(const [paper,raw] of Object.entries(papers))values[paper]=clean(raw);',
 '     models[id]=values;',
 '    }',
 '    next[sizeId]=models;',
 '   }',
 '   updated={...updated,[field]:next};',
 '  }',
 ''
 ].join('\n');
 return once(s,
  '  await c.query("UPDATE labs SET ui_preferences=jsonb_set',
  add+'  await c.query("UPDATE labs SET ui_preferences=jsonb_set',
  'save custom model matrix');
},'modal tariff handler');
server=region(server,'async function albumOrderSnapshot(','\nasync function ',s=>{
 const select=[
  "const pb1811RequestedBinding=String(input?.bindingTypeId||'album_binding_price').trim();",
  "    const pb1811HasModelRates=pb1805ModeActive&&(catalog.printTariffCatalog?.types||[]).some(t=>t.id===pb1811RequestedBinding&&t.kind==='binding'&&t.active!==false)&&Object.values(catalog.printTariffCatalog?.albumCombinedModelRates||{}).some(group=>group?.[pb1811RequestedBinding]);",
  "    const bindingTypeId=pb1805ModeActive&&!pb1811HasModelRates?'album_binding_price':pb1811RequestedBinding;"
 ].join('\n');
 s=once(s,
  "const bindingTypeId=pb1805ModeActive?'album_binding_price':String(input?.bindingTypeId||'album_binding_price').trim();",
  select,
  'use priced custom binding model');
 s=once(s,
  'const pb1805StoredRates=catalog.printTariffCatalog?.albumCombinedRates?.[String(size.printSizeId||"")]||{};',
  'const pb1805StoredRates=bindingTypeId==="album_binding_price"?(catalog.printTariffCatalog?.albumCombinedRates?.[String(size.printSizeId||"")]||{}):(catalog.printTariffCatalog?.albumCombinedModelRates?.[String(size.printSizeId||"")]?.[bindingTypeId]||{});',
  'freeze selected paper rates');
 return s;
},'album order pricing snapshot');
server=once(server,
 'description:"چاپ و صحافی · "+String(ad?.size?.label||"").trim()+',
 'description:"چاپ و صحافی · "+String(ad?.binding?.name||"صحافی").trim()+" · "+String(ad?.size?.label||"").trim()+',
 'show selected model on invoice');
write('dist/api/server.js',server);
for(const f of ['dist/api/lab-print-catalog.js','dist/api/server.js'])execFileSync(process.execPath,['--check',f],{stdio:'inherit'});
console.log('[R1811] album binding model paper-rate storage and immutable snapshot installed');
