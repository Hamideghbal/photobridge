
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const file='photobridge-r1137-lab-local-intake.js',native='dist/web/lab-desktop-ui';
const one=(s,a,b,label)=>{const n=s.split(a).length-1;if(n!==1)throw Error('[R1805 walkin] '+label+' anchor '+n);return s.replace(a,b);};
for(const root of ['dist/web',native]){
 const f=root+'/'+file;let s=fs.readFileSync(f,'utf8');
 s=one(s,"const bindingTypes=(bindingCatalog.types||[]).filter(type=>type.kind==='binding'&&type.active!==false);","const bindingTypes=(bindingCatalog.types||[]).filter(type=>type.kind==='binding'&&type.active!==false&&(bindingCatalog.albumPricingMode!=='combined'||type.id==='album_binding_price'));",'one walk-in binding model');
 s=one(s,"bindingSelect.setAttribute('aria-label','نوع صحافی');","bindingSelect.setAttribute('aria-label','نوع صحافی');if(bindingCatalog.albumPricingMode==='combined')bindingSelect.closest('label')?.style.setProperty('display','none');",'hide fixed binding select in combined walk-in');
 s=one(s,"function pb1551BindingPrice(size){const type=pb1551Binding(),raw=type?.id==='album_binding_price'?size?.bindingPrice:bindingCatalog.rates?.[String(size?.printSizeId||'')]?.[type?.id];return raw!=null&&String(raw).trim()!==''&&Number.isSafeInteger(Number(raw))&&Number(raw)>0?Number(raw):null;}","function pb1551BindingPrice(size,files=[]){if(bindingCatalog.albumPricingMode==='combined'){if(!files.length)return null;const rates=bindingCatalog.albumCombinedRates?.[String(size?.printSizeId||'')]||{};let total=0;for(const item of files){const paper=String(item?.paper||item?.paperType||'luster'),raw=rates[paper],n=raw==null||raw===''?NaN:Number(raw);if(!Number.isSafeInteger(n)||n<=0)return null;total+=n;}return total/files.length;}const type=pb1551Binding(),raw=type?.id==='album_binding_price'?size?.bindingPrice:bindingCatalog.rates?.[String(size?.printSizeId||'')]?.[type?.id];return raw!=null&&String(raw).trim()!==''&&Number.isSafeInteger(Number(raw))&&Number(raw)>0?Number(raw):null;}",'weighted price in local walk-in');
 s=one(s,'const binding=pb1551BindingPrice(size);','const binding=pb1551BindingPrice(size,list);','list-weighted walk-in estimate');
 fs.writeFileSync(f,s);execFileSync(process.execPath,['--check',f],{stdio:'inherit'});
}
const m=native+'/manifest.json',manifest=JSON.parse(fs.readFileSync(m,'utf8')),hash=name=>crypto.createHash('sha256').update(fs.readFileSync(native+'/'+name)).digest('hex');
const item=manifest.files.find(e=>e.name===file);if(!item)throw Error('[R1805] native intake manifest missing');item.sha256=hash(file);
manifest.build=hashFromManifest(manifest.files);manifest.generatedAt=new Date().toISOString();
function hashFromManifest(files){return crypto.createHash('sha256').update(JSON.stringify(files)).digest('hex')}
fs.writeFileSync(m,JSON.stringify(manifest));
console.log('[R1805] manual album intake one binding and weighted paper prices');
