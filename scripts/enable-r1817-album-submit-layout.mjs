
/* R1817: purely presentational photographer album submission updates.
   Keep existing pricing model, selections, invoice and API unchanged. */
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const once=(s,a,b,label)=>{
 const n=s.split(a).length-1;
 if(n!==1)throw Error('[R1817] '+label+' expected 1 anchor, got '+n);
 return s.replace(a,b);
};
const asset='assets/index-UIRefine-v655-r84.js';
const css='photobridge-r1817-album-submit-layout.css';
const source=read('dist/web/'+asset);
const albumStart=source.indexOf('function Kv(');
const albumEnd=source.indexOf('function ',albumStart+12);
if(albumStart<0||albumEnd<=albumStart)throw Error('[R1817] album form component not found');
const album=source.slice(albumStart,albumEnd);
if(!album.includes('className:"grid2 albumCoreFields"')||
 !album.includes('className:"pb1539BindingField"')||
 !album.includes('className:"albumPaperField"')||
 !album.includes('className:"albumCoverOrderSteps albumCoverOrderStepsCompactV409"')||
 !album.includes('className:"albumCoverOrderMaterialColorRowV409"')||
 !album.includes('className:"albumCoverOrderModelGrid"')||
 !album.includes('"نوشته روی جلد (اختیاری)"'))
 throw Error('[R1817] album details or cover field markup changed');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const ui=read(root+'/'+asset);
 const a=ui.indexOf('function Kv('),b=ui.indexOf('function ',a+12);
 if(a<0||b<=a||!ui.slice(a,b).includes('className:"pb1539BindingField"'))
  throw Error('[R1817] '+root+' album model selector missing');
 const htmlPath=root+'/index.html';
 let html=read(htmlPath);
 html=once(html,'</head>','<link rel="stylesheet" href="/'+css+'?v=r1817"></head>',root+' style include');
 write(htmlPath,html);
}
fs.copyFileSync('dist/web/'+css,'dist/web/lab-desktop-ui/'+css);
const native='dist/web/lab-desktop-ui';
const manifestFile=native+'/manifest.json';
const m=JSON.parse(read(manifestFile));
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
for(const name of [css,'index.html']){
 const sha256=hash(fs.readFileSync(native+'/'+name));
 const item=m.files.find(entry=>entry.name===name);
 if(item)item.sha256=sha256;else m.files.push({name,url:'/lab-desktop-ui/'+name,sha256});
}
m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
m.build=hash(JSON.stringify(m.files));
m.generatedAt=new Date().toISOString();
write(manifestFile,JSON.stringify(m));
console.log('[R1817] album 3-up fields and cover layout installed for web/native; no pricing behavior changed');
