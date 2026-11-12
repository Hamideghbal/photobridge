
/* R1818: structural album form repair, not just styling.
   Three actual controls in one row and a selected cover preview above thumbnails. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const one=(s,a,b,label)=>{
 const n=s.split(a).length-1;
 if(n!==1)throw Error('[R1818] '+label+' expected one anchor, got '+n);
 return s.replace(a,b);
};
const region=(s,a,b,fn,label)=>{
 const start=s.indexOf(a),end=start<0?-1:s.indexOf(b,start+a.length);
 if(start<0||end<=start)throw Error('[R1818] '+label+' bounds');
 return s.slice(0,start)+fn(s.slice(start,end))+s.slice(end);
};
const asset='assets/index-UIRefine-v655-r84.js',css='photobridge-r1818-album-form-professional.css';
const selectedPreview='e.jsxs("section",{className:"pb1818CoverPreview",children:[e.jsx("span",{className:"pb1818CoverPreviewHeading",children:"پیش‌نمایش مدل انتخاب‌شده"}),e.jsx("div",{className:"pb1818CoverPreviewImage",children:It?e.jsx("img",{src:It,alt:"جلد "+String((At==null?void 0:At.modelName)||"انتخاب‌شده")}):e.jsx("span",{className:"pb1818CoverImageMissing",children:"هنوز تصویری برای این جلد ثبت نشده است"})}),e.jsxs("div",{className:"pb1818CoverPreviewCaption",children:[e.jsx("strong",{children:(At==null?void 0:At.modelName)||"مدل جلد انتخاب نشده"}),e.jsx("small",{children:At?String(Nn||"جلد")+" · "+String((dn==null?void 0:dn.name)||Je||"رنگ انتخاب‌شده"):"جنس، رنگ و مدل را انتخاب کنید"})]})]}),';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/'+asset;
 let s=read(file);
 s=region(s,'function Kv(','function ',kv=>{
  kv=one(kv,'className:"grid2 albumCoreFields"','className:"albumCoreFields pb1818AlbumCoreThree"',root+' remove the legacy two-column class');
  if(!kv.includes('className:"pb1539BindingField"')||
     !kv.includes('className:"albumPaperField"')||
     !kv.includes('albumConfigBlockCompactV409'))
   throw Error('[R1818] '+root+' binding, size or paper labels missing');
  const material='e.jsx("label",{className:"albumCoverOrderMaterial",children:e.jsx(wn,{value:Nn,options:on.map($e=>({value:String($e),label:String($e)})),onChange:Ka})})';
  const materialNew='e.jsxs("label",{className:"albumCoverOrderMaterial",children:[e.jsx("span",{className:"pb1818CoverFieldLabel",children:"جنس جلد"}),e.jsx(wn,{value:Nn,options:on.map($e=>({value:String($e),label:String($e)})),onChange:Ka})]})';
  kv=one(kv,material,materialNew,root+' clear material field label');
  kv=one(kv,'e.jsx("div",{className:"albumCoverOrderColor",children:Tn.length?',
   'e.jsxs("div",{className:"albumCoverOrderColor",children:[e.jsx("span",{className:"pb1818CoverFieldLabel",children:"رنگ جلد"}),Tn.length?',root+' color field label');
  kv=one(kv,'children:"برای این جنس و سایز رنگ قیمت‌گذاری‌شده‌ای وجود ندارد."})})]})',
   'children:"برای این جنس و سایز رنگ قیمت‌گذاری‌شده‌ای وجود ندارد."})]})]})',root+' color field close');
  kv=one(kv,'className:"albumCoverOrderSteps albumCoverOrderStepsCompactV409"','className:"albumCoverOrderSteps albumCoverOrderStepsCompactV409 pb1818CoverPicker"',root+' distinct cover layout');
  kv=one(kv,'className:"albumCoverOrderMaterialColorRowV409"','className:"albumCoverOrderMaterialColorRowV409 pb1818CoverControls"',root+' cover controls');
  kv=one(kv,'e.jsxs("div",{className:"albumCoverOrderModels",children:[',selectedPreview+'e.jsxs("div",{className:"albumCoverOrderModels pb1818CoverModelBrowser",children:[',root+' selected preview before catalog thumbnails');
  kv=one(kv,'children:"مدل‌های قابل سفارش"','children:"مدل جلد را انتخاب کنید"',root+' model gallery label');
  if(!kv.includes('onClick:()=>{Ma(String($e.id)),F(!0)}')||
     !kv.includes('className:"albumCoverOrderModelGrid"')||
     !kv.includes('"نوشته روی جلد (اختیاری)"'))
   throw Error('[R1818] '+root+' selection, model grid or cover title no longer available');
  return kv;
 },root+' album editor');
 write(file,s);
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
 let page=read(root+'/index.html');
 page=one(page,'</head>','<link rel="stylesheet" href="/'+css+'?v=r1818"></head>',root+' style');
 page=page.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u+'&albumCover=r1818');
 write(root+'/index.html',page);
}
fs.copyFileSync('dist/web/'+css,'dist/web/lab-desktop-ui/'+css);
const native='dist/web/lab-desktop-ui',mf=native+'/manifest.json',m=JSON.parse(read(mf));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const name of [asset,css,'index.html']){
 const sha256=hash(fs.readFileSync(native+'/'+name));
 const entry=m.files.find(x=>x.name===name);
 if(entry)entry.sha256=sha256;
 else m.files.push({name,url:'/lab-desktop-ui/'+name,sha256});
}
m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
m.build=hash(JSON.stringify(m.files));
m.generatedAt=new Date().toISOString();
write(mf,JSON.stringify(m));
console.log('[R1818] three real album controls, cover material/color, selected preview and model gallery installed for web/Windows');
