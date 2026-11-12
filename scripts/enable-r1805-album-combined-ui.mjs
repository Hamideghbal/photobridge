
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const one=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error('[R1805 UI] '+label+' anchor '+n);return s.replace(a,b)};
const region=(s,a,b,fn,label)=>{const i=s.indexOf(a),j=i<0?-1:s.indexOf(b,i+a.length);if(i<0||j<=i)throw Error('[R1805 UI] '+label+' bounds');return s.slice(0,i)+fn(s.slice(i,j))+s.slice(j)};
const asset='assets/index-UIRefine-v655-r84.js',style='photobridge-r1805-combined-album.css';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 let js=read(root+'/'+asset);
 js=region(js,'function tw(','function Na(t)',s=>{
  s=one(s,'const h=pb1800TariffFields([[','const h=pb1805TariffFields(pb1800TariffFields([[','combined field list open');
  s=one(s,'],pb1539Types),S=async()=>','],pb1539Types),pb1539),S=async()=>','combined field list close');
  s=one(s,'e.jsx(PB1795BindingPricingSettings,{onSaved:next=>pb1539Set(next.printTariffCatalog)}),','','remove mode control from main tariff');
  s=one(s,'customRates:Object.fromEntries(pb1539Custom.map(t=>[t.id,Na(Object.hasOwn(F,"pb1539_"+t.id)?F["pb1539_"+t.id]:pb1539.rates?.[F.id]?.[t.id]??null)]))',
  '...(pb1539.albumPricingMode==="combined"?{combinedAlbumRates:Object.fromEntries(["luster","silk","metallic"].map(paper=>[paper,Na(Object.hasOwn(F,"pb1805_combined_"+paper)?F["pb1805_combined_"+paper]:pb1539.albumCombinedRates?.[String(F.id)]?.[paper]??null)]))}:{}),customRates:Object.fromEntries(pb1539Custom.map(t=>[t.id,Na(Object.hasOwn(F,"pb1539_"+t.id)?F["pb1539_"+t.id]:pb1539.rates?.[F.id]?.[t.id]??null)]))','save three combined prices with existing atomic tariff rows');
  s=one(s,'w=(B,L)=>{const n=L.startsWith("pb1539_")?','w=(B,L)=>{const n=L.startsWith("pb1805_combined_")?pb1805RateValue(B,pb1539,L):L.startsWith("pb1539_")?','print tariff preview prices');
  s=one(s,':k[C])',':C.startsWith("pb1805_combined_")?(Object.hasOwn(k,C)?k[C]:pb1805RateValue(k,pb1539,C)):k[C])','mobile and desktop combined numeric value');
  s=one(s,'e.jsx("button",{className:"pbActionButton secondary",type:"button",onClick:()=>pb1539Create(),children:"+ مدل صحافی جدید"})','pb1539.albumPricingMode!=="combined"&&e.jsx("button",{className:"pbActionButton secondary",type:"button",onClick:()=>pb1539Create(),children:"+ مدل صحافی جدید"})','hide model add in combined mode');
  s=one(s,'m!==void 0&&e.jsx(wb,{size:m,onClose:()=>g(void 0),onSaved:S,showTariffs:!0})','m!==void 0&&e.jsx(wb,{size:m,onClose:()=>g(void 0),onSaved:S,showTariffs:pb1539.albumPricingMode!=="combined"})','size dialog only edits dimensions in combined mode; prices in main 3-column grid');
  return s;
 },root+' tariff');
 js=region(js,'function Kv(','function ',s=>{
  s=one(s,"pb1539Bindings=(pb1539Catalog.types||[]).filter($e=>$e.kind==='binding'&&$e.active!==false),","pb1539Bindings=(pb1539Catalog.types||[]).filter($e=>$e.kind==='binding'&&$e.active!==false&&(!pb1795Combined||$e.id==='album_binding_price')),",'single binding in combined photographer selector');
  s=one(s,"pb1539PriceOf=($e,id=pb1539Chosen.id)=>id==='album_binding_price'?Number($e.bindingPrice||0):Number(pb1539Catalog.rates?.[String($e.printSizeId||'')]?.[id]||0),","pb1539PriceOf=($e,id=pb1539Chosen.id)=>pb1795Combined?Math.max(0,...['luster','silk','metallic'].map(p=>Number(pb1539Catalog.albumCombinedRates?.[String($e.printSizeId||'')]?.[p]||0))):id==='album_binding_price'?Number($e.bindingPrice||0):Number(pb1539Catalog.rates?.[String($e.printSizeId||'')]?.[id]||0),",'album size availability by combined paper prices');
  s=one(s,'_a=si*Qn,','_a=pb1795Combined?yt.reduce((sum,row)=>sum+Number(row.count||0)*Number(pb1539Catalog.albumCombinedRates?.[String((Be==null?void 0:Be.printSizeId)||"")]?.[row.value]||0),0):si*Qn,','live mixed-paper quote');
  s=one(s,'ja=Boolean(','pb1805Missing=pb1795Combined&&!Q&&yt.some(row=>Number(row.count||0)>0&&!(Number(pb1539Catalog.albumCombinedRates?.[String((Be==null?void 0:Be.printSizeId)||"")]?.[row.value]||0)>0)),ja=Boolean(pb1805Missing||','missing combined tariff quote guard');
  s=one(s,'label:$e.label+(pb1795Combined?" · چاپ و صحافی ":" · صحافی ")+V(pb1539PriceOf($e))+" تومان"','label:$e.label+(pb1795Combined?" · چاپ و صحافی (سه نوع کاغذ)":" · صحافی "+V(pb1539PriceOf($e))+" تومان")','size option combined label');
  s=one(s,'className:"albumOrderGrid pb1802CompactAlbum"','className:"albumOrderGrid pb1802CompactAlbum"+(pb1795Combined?" pb1805CombinedAlbum":"")','hide fixed model choice only in combined mode');
  return s;
 },root+' photographer album');
 js+='\n'+read('scripts/r1805-combined-album-ui.js.txt');
 write(root+'/'+asset,js);
 execFileSync(process.execPath,['--check',root+'/'+asset],{stdio:'inherit'});
 const html=root+'/index.html';
 write(html,one(read(html),'</head>','<link rel="stylesheet" href="/'+style+'?v=r1805"></head>',root+' html style'));
}
fs.copyFileSync('dist/web/'+style,'dist/web/lab-desktop-ui/'+style);
const native='dist/web/lab-desktop-ui',mf=native+'/manifest.json',manifest=JSON.parse(read(mf));
const hash=name=>crypto.createHash('sha256').update(fs.readFileSync(native+'/'+name)).digest('hex');
for(const name of [asset,'index.html',style]){
 const row=manifest.files.find(x=>x.name===name);
 if(row)row.sha256=hash(name);else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256:hash(name)});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
manifest.generatedAt=new Date().toISOString();
write(mf,JSON.stringify(manifest));
console.log('[R1805] one binding in combined mode, three prices and compact setting inside album settings');
