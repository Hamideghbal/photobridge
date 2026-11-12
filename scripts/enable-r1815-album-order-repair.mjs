
/* R1815: correct album model-paper rates, preserve constrained editor scrolling. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const once=(s,a,b,label)=>{
 const n=s.split(a).length-1;if(n!==1)throw Error('[R1815] '+label+' expected 1, got '+n);
 return s.replace(a,b);
};
const region=(s,a,b,fn,label)=>{
 const i=s.indexOf(a),j=i<0?-1:s.indexOf(b,i+a.length);
 if(i<0||j<=i)throw Error('[R1815] '+label+' boundaries');
 return s.slice(0,i)+fn(s.slice(i,j))+s.slice(j);
};
const asset='assets/index-UIRefine-v655-r84.js';
const style='photobridge-r1815-album-order-repair.css';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/'+asset;let ui=read(file);
 ui=region(ui,'function Kv(','function ',s=>{
  const a=s.indexOf('e.jsx("select",{className:"albumPaperNativeSelect"');
  const b=a<0?-1:s.indexOf('children:"نوع کاغذ در دسترس نیست"',a);
  if(a<0||b<=a||b-a>1700)throw Error('[R1815] paper selector boundaries');
  let field=s.slice(a,b);
  field=once(field,
   'const gt=Q?null:Be==null?void 0:Be[$e.value],ht=gt!=null&&String(gt).trim()!=="";',
   'const gt=Q?null:pb1795Combined?pb1811AlbumPaperPrices(pb1539Catalog,"colleague",String((Be==null?void 0:Be.printSizeId)||""),String(pb1539Chosen.id))?.[$e.value]:Be==null?void 0:Be[$e.value],ht=gt!=null&&String(gt).trim()!==""&&Number(gt)>0;',
   root+' selected model/size/paper rate');
  field=once(field,
   'ht?`${$e.label} · ${V(Number(gt))} تومان`',
   'ht?`${$e.label} · ${pb1795Combined?"چاپ و صحافی ":""}${V(Number(gt))} تومان`',
   root+' paper selector label');
  return s.slice(0,a)+field+s.slice(b);
 },root+' photographer editor');
 write(file,ui);execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const html=root+'/index.html';
 let page=once(read(html),'</head>','<link rel="stylesheet" href="/'+style+'?v=r1815"></head>',root+' stylesheet');
 page=page.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url+'&albumRates=r1815');
 write(html,page);
}
fs.copyFileSync('dist/web/'+style,'dist/web/lab-desktop-ui/'+style);
let api=read('dist/api/server.js');
api=region(api,'async function albumOrderSnapshot(','\nasync function ',s=>{
 s=once(s,
  "const pb1811HasModelRates=pb1805ModeActive&&(catalog.printTariffCatalog?.types||[]).some(t=>t.id===pb1811RequestedBinding&&t.kind==='binding'&&t.active!==false)&&Object.values(catalog.printTariffCatalog?.albumCombinedModelRates||{}).some(group=>group?.[pb1811RequestedBinding]);",
  "const pb1815KnownBinding=(catalog.printTariffCatalog?.types||[]).some(t=>t.id===pb1811RequestedBinding&&t.kind==='binding'&&t.active!==false);",
  'selected binding valid without prices yet');
 s=once(s,
  "const bindingTypeId=pb1805ModeActive&&!pb1811HasModelRates?'album_binding_price':pb1811RequestedBinding;",
  "const bindingTypeId=pb1805ModeActive&&!pb1815KnownBinding?'album_binding_price':pb1811RequestedBinding;",
  'never bill default model for missing custom rate');
 return s;
},'album snapshot');
api=region(api,'async function syncLabAlbumSizesFromPrintTariffs(','async function albumCoverCatalogV2ForLab(',s=>{
 return once(s,'if(binding<=0&&!customAvailable&&!pb1805Combined)continue;',
  "const pb1815CombinedModels=pbCatalog.albumPricingMode==='combined'&&Object.values(pbCatalog.albumCombinedModelRates?.[String(row.print_size_id)]||{}).some(papers=>['luster','silk','metallic'].some(p=>Number(papers?.[p]||0)>0));\n        if(binding<=0&&!customAvailable&&!pb1805Combined&&!pb1815CombinedModels)continue;",
  'combined custom model size visibility');
},'album size sync');
api=once(api,
 'sizes = (albumBase.sizes || []).filter((x) => x.active !== false && (Number(x.bindingPrice || 0) > 0 || (albumBase.printTariffCatalog?.albumPricingMode==="combined" && ["luster","silk","metallic"].some(p=>Number(albumBase.printTariffCatalog?.albumCombinedRates?.[String(x.printSizeId||"")]?.[p]||0)>0)))), extras =',
 'sizes = (albumBase.sizes || []).filter((x) => x.active !== false && (Number(x.bindingPrice || 0) > 0 || (albumBase.printTariffCatalog?.albumPricingMode==="combined" && (["luster","silk","metallic"].some(p=>Number(albumBase.printTariffCatalog?.albumCombinedRates?.[String(x.printSizeId||"")]?.[p]||0)>0)||Object.values(albumBase.printTariffCatalog?.albumCombinedModelRates?.[String(x.printSizeId||"")]||{}).some(papers=>["luster","silk","metallic"].some(p=>Number(papers?.[p]||0)>0)))))), extras =',
 'custom-only combined sizes are selectable');
write('dist/api/server.js',api);
execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});
const native='dist/web/lab-desktop-ui',mf=native+'/manifest.json',manifest=JSON.parse(read(mf));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const name of [asset,style,'index.html']){
 const sha256=hash(fs.readFileSync(native+'/'+name)),f=manifest.files.find(x=>x.name===name);
 if(f)f.sha256=sha256;else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
write(mf,JSON.stringify(manifest));
console.log('[R1815] exact model-paper rates, bounded album scroll, custom size support in web and native');
