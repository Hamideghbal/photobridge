
/* R1811 UI: one larger modal for both audiences, consistent mobile/Windows assets. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const once=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error('[R1811 UI] '+label+' anchor '+n);return s.replace(a,b)};
const region=(s,a,b,fn,label)=>{
 const i=s.indexOf(a),j=i<0?-1:s.indexOf(b,i+a.length);
 if(i<0||j<=i)throw Error('[R1811 UI] '+label+' section');
 return s.slice(0,i)+fn(s.slice(i,j))+s.slice(j);
};
const asset='assets/index-UIRefine-v655-r84.js',intake='photobridge-r1137-lab-local-intake.js';
const css='photobridge-r1811-album-binding-modal.css';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/'+asset;
 let ui=read(file);
 ui=once(ui,
 'e.jsx(PB1795BindingPricingSettings,{settings,onSaved:next=>setSettings(old=>({...old,printTariffCatalog:next.printTariffCatalog}))}),',
 '',
 root+' remove duplicate price mode setting from album section');
 const modalOpenCount=ui.split('e.jsx(PB1810AlbumBindingPriceModal,').length-1;
 if(modalOpenCount!==2)throw Error('[R1811] expected two existing modal triggers in '+root+', got '+modalOpenCount);
 ui=ui.replaceAll('e.jsx(PB1810AlbumBindingPriceModal,','e.jsx(PB1811AlbumBindingPriceModal,');
 ui=region(ui,'function Kv(','function ',s=>{
  s=once(s,
   "pb1539Bindings=(pb1539Catalog.types||[]).filter($e=>$e.kind==='binding'&&$e.active!==false&&(!pb1795Combined||$e.id==='album_binding_price')),",
   "pb1539Bindings=(pb1539Catalog.types||[]).filter($e=>$e.kind==='binding'&&$e.active!==false),",
   root+' allow custom combined model choice');
  const a=s.indexOf('pb1539PriceOf='),b=a<0?-1:s.indexOf(',pb1539Sizes=',a);
  if(a<0||b<=a||b-a>650)throw Error('[R1811 UI] photographer model price function');
  const fn="pb1539PriceOf=($e,id=pb1539Chosen.id)=>pb1795Combined?Math.max(0,...['luster','silk','metallic'].map(p=>Number(pb1811AlbumPaperPrices(pb1539Catalog,'colleague',String($e.printSizeId||''),String(id))?.[p]||0))):id==='album_binding_price'?Number($e.bindingPrice||0):Number(pb1539Catalog.rates?.[String($e.printSizeId||'')]?.[id]||0)";
  s=s.slice(0,a)+fn+s.slice(b);
  const rate='pb1539Catalog.albumCombinedRates?.[String((Be==null?void 0:Be.printSizeId)||"")]?.[row.value]';
  if(s.split(rate).length-1!==2)throw Error('[R1811 UI] expected two quote rate lookups');
  s=s.replaceAll(rate,"pb1811AlbumPaperPrices(pb1539Catalog,'colleague',String((Be==null?void 0:Be.printSizeId)||''),String(pb1539Chosen.id))?.[row.value]");
  return s;
 },root+' photographer album model pricing');
 ui+='\n'+read('scripts/r1811-album-binding-modal.js.txt');
 write(file,ui);
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 const intakeFile=root+'/'+intake;
 let manual=read(intakeFile);
 manual=once(manual,
 "type.kind==='binding'&&type.active!==false&&(bindingCatalog.albumPricingMode!=='combined'||type.id==='album_binding_price')",
 "type.kind==='binding'&&type.active!==false",
 root+' show combined models in walkin');
 manual=once(manual,
 "if(bindingCatalog.albumPricingMode==='combined')bindingSelect.closest('label')?.style.setProperty('display','none');",
 '',
 root+' show walkin binding selector');
 manual=once(manual,
 "const rates=bindingCatalog.albumCombinedRates?.[String(size?.printSizeId||'')]||{};",
 "const pb1811Type=pb1551Binding(),pb1811Size=String(size?.printSizeId||'');const rates=pb1811Type?.id==='album_binding_price'?(bindingCatalog.walkinAlbumCombinedRates?.[pb1811Size]||bindingCatalog.albumCombinedRates?.[pb1811Size]||{}):(bindingCatalog.walkinAlbumCombinedModelRates?.[pb1811Size]?.[pb1811Type?.id]||{});",
 root+' walkin per model combined prices');
 write(intakeFile,manual);
 execFileSync(process.execPath,['--check',intakeFile],{stdio:'inherit'});
 const html=root+'/index.html';
 write(html,once(read(html),'</head>','<link rel="stylesheet" href="/'+css+'?v=r1811"></head>',root+' include new style'));
}
fs.copyFileSync('dist/web/'+css,'dist/web/lab-desktop-ui/'+css);
const native='dist/web/lab-desktop-ui',path=native+'/manifest.json';
const manifest=JSON.parse(read(path));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
for(const name of [asset,intake,'index.html',css]){
 const sha256=hash(fs.readFileSync(native+'/'+name)),item=manifest.files.find(f=>f.name===name);
 if(item)item.sha256=sha256;else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=hash(JSON.stringify(manifest.files));
manifest.generatedAt=new Date().toISOString();
write(path,JSON.stringify(manifest));
console.log('[R1811] modal below headers, pricing modes and selectable binding models in web and Windows');
