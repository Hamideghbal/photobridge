// R1960 — resolve active album-cover sizes from all priced album-binding models.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const replaceOnce=(src,oldText,newText,label)=>{
  const count=src.split(oldText).length-1;
  if(count!==1)throw Error('[R1960] '+label+' anchor count: '+count);
  return src.replace(oldText,newText);
};

const backend='dist/api/server.js';
let api=fs.readFileSync(backend,'utf8');
const start=api.indexOf('async function syncLabAlbumSizesFromPrintTariffs(');
const end=start<0?-1:api.indexOf('\nasync function ',start+30);
if(start<0||end<=start)throw Error('[R1960] album size sync missing');
let segment=api.slice(start,end);
segment=replaceOnce(segment,'    JOIN lab_prices p ON p.size_id=ps.id AND p.lab_id=$1',
 '    LEFT JOIN lab_prices p ON p.size_id=ps.id AND p.lab_id=$1','left join');
const prelude=[
'    /* R1960: a size can be available through custom/combined binding tariffs',
'       without having a positive legacy album_binding_price. Never transfer',
'       custom prices into that legacy price or modify past order snapshots. */',
'    // R1539 already loaded the lab-scoped, normalized tariff catalog.',
'    const pricing = pbCatalog;',
"    const modelIds = (pricing.types || []).filter(t => t.kind === 'binding' && !t.legacy && t.active !== false).map(t => String(t.id));",
"    const positive = value => value != null && String(value).trim() !== '' && Number.isFinite(Number(value)) && Number(value) > 0;",
'    const hasOtherBindingPrice = sizeId => {',
'        if (modelIds.some(id => positive(pricing.rates?.[sizeId]?.[id]))) return true;',
"        if (pricing.albumPricingMode !== 'combined') return false;",
'        if (Object.values(pricing.albumCombinedRates?.[sizeId] || {}).some(positive)) return true;',
'        return modelIds.some(id => Object.values(pricing.albumCombinedModelRates?.[sizeId]?.[id] || {}).some(positive));',
'    };',
'    const activePrintIds = [];'
].join('\n');
segment=replaceOnce(segment,'    const activePrintIds = [];',prelude,'read model pricing');
segment=replaceOnce(segment,
'if(binding<=0&&!customAvailable&&!pb1805Combined)continue;',
'if(binding<=0&&!customAvailable&&!pb1805Combined&&!hasOtherBindingPrice(String(row.print_size_id)))continue;',
'include model-specific prices after R1539/R1805');
api=api.slice(0,start)+segment+api.slice(end);
fs.writeFileSync(backend,api);
execFileSync(process.execPath,['--check',backend],{stdio:'inherit'});

for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const file=root+'/assets/index-UIRefine-v655-r84.js';
  let ui=fs.readFileSync(file,'utf8');
  // Live React album editor (both delivery targets).
  ui=replaceOnce(ui,'&&Number(ne.bindingPrice||0)>0','','active cover-size selector '+root);
  // R1380 album matrix and serializers were assembled into the UI earlier.
  ui=replaceOnce(ui,'&&Number.isFinite(Number(size.bindingPrice))&&Number(size.bindingPrice)>0','',
      'cover and box price table '+root);
  const savedChecks=(ui.match(/&&Number\(s\.bindingPrice\)>0/g)||[]).length;
  if(savedChecks<2 || savedChecks>5) throw Error('[R1960] unexpected legacy serializer occurrences '+root+': '+savedChecks);
  ui=ui.replace(/&&Number\(s\.bindingPrice\)>0/g,'');
  // The R1379 matrix also still requires active priced legacy binding.
  ui=ui.replace(/&&Number\(s\.bindingPrice\)>0/g,'');
  ui+='\n/* PB1960 active album sizes include custom/combined priced bindings */\n';
  fs.writeFileSync(file,ui);
  execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
  const htmlPath=root+'/index.html';
  let html=fs.readFileSync(htmlPath,'utf8');
  const urls=[...html.matchAll(/index-UIRefine-v655-r84\.js\?[^"'\s>]*/g)];
  if(urls.length!==1)throw Error('[R1960] unexpected module URL count '+root+': '+urls.length);
  const oldUrl=urls[0][0];
  html=html.replace(oldUrl,oldUrl.replace(/&albumSizes=r1960/g,'')+'&albumSizes=r1960');
  fs.writeFileSync(htmlPath,html);
}
console.log('[R1960] album cover-size visibility aligned with active binding tariffs in web and Windows');