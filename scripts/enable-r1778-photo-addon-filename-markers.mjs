/* R1778: visible chassis/frame model and color names after each photo.
 * Native + web names are shown consistently. No original media renamed.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const original='title:le.original_name,children:le.original_name';
const source='pbPrintCopyFilename(Be.file.name,pbPrintCopies(Be))';
const replacement='pb1778SelectedName(Be.file.name,pbPrintCopies(Be),Wr(ue,Be,"chassis"),Wr(ue,Be,"frame"),Be.chassisModelLatinName||ue.chassisModelLatinName||Be.chassisModelName||ue.chassisModelName,Be.frameModelLatinName||ue.frameModelLatinName||Be.frameModelName||ue.frameModelName,Be.frameColorName||ue.frameColorName)';
function pb1778Latin(value,fallback='photo'){
 // Match the existing Lab download romanizer without overriding the download function. Display names and saved filenames
 // must agree, including Persian digits, model labels and frame color names.
 const named={
  'شاسی':'Shasi','شاسی‌':'Shasi','قاب':'Ghab','کلاسیک':'Classic',
  'چوبی':'Choobi','چوب':'Choob','فلزی':'Felezi','فلز':'Felez',
  'ساده':'Sade','طلایی':'Talaei','طلائي':'Talaei','نقره‌ای':'Noghrei',
  'نقره':'Noghrei','مشکی':'Meshki','سفید':'Sefid','قرمز':'Ghermez',
  'آبی':'Abi','سبز':'Sabz','قهوه‌ای':'Gahvei','قهوه':'Gahve',
  'گردویی':'Gerdooyi','طوسی':'Toosi','کرم':'Kerem','زرد':'Zard',
  'صورتی':'Soorati','بنفش':'Banafsh','مات':'Mat','براق':'Baragh',
  'مدل':'Model','ای':'Ei','باریک':'Barik','پهن':'Pahn','مدرن':'Modern',
  'طرح':'Tarh','طرح‌دار':'Tarhdar','فندقی':'Fandoghi','دودی':'Doodi'
 };
 let input=String(value??'').normalize('NFKC').replace(/[\u200c\u200d]/g,' ')
  .replace(/[\\/:*?"<>|,;،؛]+/g,' ').trim();
 input=input.replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
  .replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
 const latin=input.split(/\s+/).filter(Boolean).map(word=>{
  if(named[word])return named[word];
  if(/^[A-Za-z0-9._-]+$/.test(word))return word;
  return (typeof Tf==='function'?Tf(word):'').replace(/-/g,' ');
 }).join(' ').replace(/[^A-Za-z0-9 ._-]/g,' ').replace(/\s+/g,' ').trim();
 return latin.replace(/^[ ._-]+|[ ._-]+$/g,'').slice(0,180)
  ||String(fallback).replace(/[^A-Za-z0-9._-]/g,'')||'photo';
}
function pb1778SelectedName(name,copies,chassis,frame,chassisName,frameName,frameColor){
 const raw=String(name||'file'),match=raw.match(/\.[A-Za-z0-9]{1,12}$/),ext=match?.[0]||'';
 let stem=ext?raw.slice(0,-ext.length):raw;
 const clean=(v,fallback)=>v?pb1778Latin(v,fallback):fallback;
 const entries=[];
 if(chassis)entries.push(clean(chassisName,'Shasi'));
 if(frame)entries.push([clean(frameName,'Ghab'),clean(frameColor,'')].filter(Boolean).join(' '));
 const names=entries.length?' = '+entries.join(' = '):'';
 if(names&&stem.endsWith(names))stem=stem.slice(0,-names.length);
 const n=Number(copies),valid=Number.isSafeInteger(n)&&n>1&&n<=99;
 if(valid)stem=stem.replace(new RegExp('(?:\\s*=\\s*|\\s+_\\s+)'+n+'$'),'');
 const suffix=(valid?' = '+n:'')+names;
 return pb1778Latin(stem,'photo').slice(0,Math.max(1,180-ext.length-suffix.length)).trim()+suffix+ext;
}
function pb1778DisplayName(file){
 return pb1778SelectedName(
  String(file?.original_name||file?.name||'file'), Number(file?.print_copies||file?.printCopies||1),
  file?.chassis===true||file?.chassis===1,file?.frame===true||file?.frame===1,
  file?.addon_selection?.chassis?.latinName||file?.addon_selection?.chassis?.name||file?.addon_selection?.chassis?.modelName||file?.chassis_model_name||file?.chassisModelName,
  file?.addon_selection?.frame?.latinName||file?.addon_selection?.frame?.name||file?.addon_selection?.frame?.modelName||file?.frame_model_name||file?.frameModelName,
  file?.addon_selection?.frame?.colorName||file?.addon_selection?.frame?.color_name||file?.frame_color_name||file?.frameColorName);
}
const helper='/* PB1778 CHASSIS FRAME FILE MARKERS */\n'+pb1778Latin.toString()+'\n'+pb1778SelectedName.toString()+'\n'+pb1778DisplayName.toString()+'\n';
const pageToken='addonNames=r1778';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const bundle=root+'/assets/index-UIRefine-v655-r84.js',page=root+'/index.html';
 if(!fs.existsSync(bundle)||!fs.existsSync(page))throw Error('[R1778] required Lab web/Windows assets missing: '+root);
 let ui=fs.readFileSync(bundle,'utf8');
 if(ui.includes('/* PB1778 CHASSIS FRAME FILE MARKERS */'))throw Error('[R1778] already applied '+root);
 const details=ui.split(original).length-1;
 if(details!==2)throw Error('[R1778] Lab visible file names not found exactly twice: '+root+' '+details);
 ui=ui.replaceAll(original,'title:le.original_name,children:pb1778DisplayName(le)');
 const start=ui.indexOf('function ej('),end=ui.indexOf('function vh(',start);
 if(start<0||end<start)throw Error('[R1778] photographer print component missing: '+root);
 let section=ui.slice(start,end);
 const count=section.split(source).length-1;
 if(count!==3)throw Error('[R1778] photographer visible name anchors '+count+' '+root);
 section=section.replaceAll(source,replacement);
 ui=ui.slice(0,start)+section+ui.slice(end)+'\n'+helper;
 fs.writeFileSync(bundle,ui);
 execFileSync(process.execPath,['--check',bundle],{stdio:'inherit'});
 let html=fs.readFileSync(page,'utf8');
 const url=/assets\/index-UIRefine-v655-r84\.js\?[^"'<>\s]*/g;
 if([...html.matchAll(url)].length!==1)throw Error('[R1778] Lab HTML bundle reference missing');
 html=html.replace(url,u=>u.includes(pageToken)?u:u+'&'+pageToken);
 fs.writeFileSync(page,html);
 const manifest=root+'/manifest.json';
 if(fs.existsSync(manifest)){
  const obj=JSON.parse(fs.readFileSync(manifest,'utf8'));
  for(const name of ['index.html','assets/index-UIRefine-v655-r84.js']){
   let entry=obj.files?.find(x=>x.name===name);
   if(!entry)throw Error('[R1778] native file missing '+name);
   entry.sha256=hash(fs.readFileSync(root+'/'+name));
  }
  obj.build=hash(Buffer.from(JSON.stringify(obj.files)));
  obj.generatedAt=new Date().toISOString();
  fs.writeFileSync(manifest,JSON.stringify(obj));
 }
}
console.log('[R1778] full selected chassis/frame model names beside photo names.');
