/* R1791: editable Latin chassis/frame labels and original frame image. */
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const one=(s,a,b,label)=>{const count=s.split(a).length-1;if(count!==1)throw Error('[R1791] '+label+' anchor '+count);return s.replace(a,b)};
const section=(s,beg,end,patch,label)=>{const a=s.indexOf(beg),b=a<0?-1:s.indexOf(end,a+beg.length);if(a<0||b<=a)throw Error('[R1791] '+label+' bounds');return s.slice(0,a)+patch(s.slice(a,b))+s.slice(b)};
function patchUi(ui,root){
 ui=section(ui,'function tw({data:t,onSaved:a,labName:s=""}){','function Na(t)',part=>{
  part=one(part,'[pb1777Edit,pb1777SetEdit]=x.useState(null);',
   '[pb1777Edit,pb1777SetEdit]=x.useState(null),[pb1791NameModel,pb1791SetNameModel]=x.useState(null);',
   root+' colleague dialog state');
  part=one(part,'const pb1539Create=async(kind="binding")=>pb1543CatalogDialog(',
   'const pb1539Create=async(kind="binding")=>["chassis","frame"].includes(kind)?pb1791SetNameModel({kind}):pb1543CatalogDialog(',
   root+' create model');
  part=one(part,'const pb1539Rename=async(id,old)=>pb1543CatalogDialog(',
   'const pb1539Rename=async(id,old)=>["chassis","frame"].includes(pb1539Types.find(t=>t.id===id)?.kind)?pb1791SetNameModel(pb1539Types.find(t=>t.id===id)):pb1543CatalogDialog(',
   root+' rename model');
  part=one(part,'pb1777Edit&&e.jsx(PB1777FrameModelEditor,',
   'pb1791NameModel&&e.jsx(PB1791ModelNameDialog,{model:pb1791NameModel,onClose:()=>pb1791SetNameModel(null),onSaved:pb1539Reload}),pb1777Edit&&e.jsx(PB1777FrameModelEditor,',
   root+' colleague name dialog render');
  return part;
 },root+' colleague');
 ui=section(ui,'function Qj(','function Zj(',part=>{
  part=one(part,'[pb1777Edit,pb1777SetEdit]=x.useState(null),',
   '[pb1777Edit,pb1777SetEdit]=x.useState(null),[pb1791NameModel,pb1791SetNameModel]=x.useState(null),',
   root+' walk-in dialog state');
  part=one(part,'pb1788Rename=(id,old)=>pb1543CatalogDialog(',
   'pb1788Rename=(id,old)=>["chassis","frame"].includes((pb1777Catalog.types||[]).find(t=>t.id===id)?.kind)?pb1791SetNameModel((pb1777Catalog.types||[]).find(t=>t.id===id)):pb1543CatalogDialog(',
   root+' walk-in model rename');
  const a=part.indexOf('pb1777Create=async kind=>{'),b=a<0?-1:part.indexOf(',p=(I,T,k)=>',a);
  if(a<0||b<=a||b-a>600)throw Error('[R1791] '+root+' model creation bounds');
  part=part.slice(0,a)+'pb1777Create=async kind=>pb1791SetNameModel({kind})'+part.slice(b);
  part=one(part,'pb1777Edit&&e.jsx(PB1777FrameModelEditor,',
   'pb1791NameModel&&e.jsx(PB1791ModelNameDialog,{model:pb1791NameModel,onClose:()=>pb1791SetNameModel(null),onSaved:g}),pb1777Edit&&e.jsx(PB1777FrameModelEditor,',
   root+' walk-in name dialog render');
  return part;
 },root+' walk-in');
 if(!ui.includes('k==="frame"?"frame":k.slice(7)'))throw Error('[R1791] '+root+' base frame editor absent');
 if(!ui.includes('pb1791ColorCircle'))throw Error('[R1791] '+root+' single color picker absent');
 return ui+'\n'+read('scripts/r1791-model-name-dialog.js.txt')+'\n';
}
const bundle='assets/index-UIRefine-v655-r84.js',css='photobridge-r1791-model-names-frame-picker.css';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const asset=root+'/'+bundle;
 let js=patchUi(read(asset),root);
 if(root==='dist/web'){
  js=section(js,'function ej(','function vh(',part=>one(part,
   '[pick.kind+"ModelName"]:sel.modelName,',
   '[pick.kind+"ModelName"]:sel.modelName,[pick.kind+"ModelLatinName"]:sel.modelLatinName||null,',
   'photographer model Latin label'),'photographer picker');
  js=section(js,'function sw(','function rw(',part=>one(part,
   '[chosen.kind+"ModelName"]:sel.modelName,',
   '[chosen.kind+"ModelName"]:sel.modelName,[chosen.kind+"ModelLatinName"]:sel.modelLatinName||null,',
   'walk-in model Latin label'),'public picker');
 }
 write(asset,js);
 execFileSync(process.execPath,['--check',asset],{stdio:'inherit'});
 let html=read(root+'/index.html');
 if(!html.includes(css))html=html.replace('</head>','<link rel="stylesheet" href="/'+css+'?v=r1791"></head>');
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&frameLatin=r1791')?url:url+'&frameLatin=r1791');
 write(root+'/index.html',html);
}
fs.copyFileSync('dist/web/'+css,'dist/web/lab-desktop-ui/'+css);
const native='dist/web/lab-desktop-ui',manifestPath=native+'/manifest.json';
const manifest=JSON.parse(read(manifestPath));
if(manifest.channel!=='lab'||manifest.protocol!==1)throw Error('[R1791] invalid Windows Lab manifest');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
for(const name of [bundle,css,'index.html']){
 const entry=manifest.files.find(v=>v.name===name),digest=hash(native+'/'+name);
 if(entry)entry.sha256=digest;
 else manifest.files.push({name,url:'/lab-desktop-ui/'+name,sha256:digest});
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
manifest.build=crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
manifest.generatedAt=new Date().toISOString();
write(manifestPath,JSON.stringify(manifest));
console.log('[R1791] original frame photo, Latin model labels, single color circle, compact picker, price/stock pairs delivered');
