import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const flight='photobridge-r1593-lab-card-flight.js';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const bundle=root+'/assets/index-UIRefine-v655-r84.js';
 let s=fs.readFileSync(bundle,'utf8');
 const patch=(start,end,edits)=>{
  const a=s.indexOf(start),b=s.indexOf(end,a+start.length);
  if(a<0||b<=a)throw Error('R1593 stage function not found: '+start);
  let part=s.slice(a,b);
  for(const [oldText,newText] of edits){
    if(part.split(oldText).length!==2)throw Error('R1593 stage anchor changed: '+oldText);
    part=part.replace(oldText,newText);
  }
  s=s.slice(0,a)+part+s.slice(b);
 };
 // The previous release selected another queue even though the operator never clicked its tab.
 patch('un=async le=>',',Cn=async',[
  ['k("ready");void Gt(le,"ready").catch(()=>{});','window.dispatchEvent(new CustomEvent("photobridge-lab-card-flight",{detail:{to:"ready",number:V(le.number)}}));']
 ]);
 patch('Cn=async(le,nt)=>',',aa=async',[
  ['k(nt);void Gt(le,nt).catch(()=>{})','window.dispatchEvent(new CustomEvent("photobridge-lab-card-flight",{detail:{to:nt,number:V(le.number)}}))']
 ]);
 const start=s.indexOf('gn=async le=>'),end=s.indexOf(',',start+20);
 if(start<0)throw Error('R1593 completed handler missing');
 const old='k("completed");void Gt(le,"completed").catch(()=>{});';
 if(s.split(old).length!==2)throw Error('R1593 completed navigation anchor changed');
 s=s.replace(old,'window.dispatchEvent(new CustomEvent("photobridge-lab-card-flight",{detail:{to:"completed",number:V(le.number)}}));');
 s+='\n/* PB1593 confirmed lab stage flights without automatic tab navigation */\n';
 fs.writeFileSync(bundle,s);
 execFileSync(process.execPath,['--check',bundle],{stdio:'inherit'});
 fs.copyFileSync('scripts/r1593-lab-card-flight.js',root+'/'+flight);
 const page=root+'/index.html';
 let html=fs.readFileSync(page,'utf8');
 html=html.replace('</head>','<script defer src="/'+flight+'?v=r1595"></script>\n</head>');
 fs.writeFileSync(page,html);
 execFileSync(process.execPath,['--check',root+'/'+flight],{stdio:'inherit'});
}
const root='dist/web/lab-desktop-ui',path=root+'/manifest.json',m=JSON.parse(fs.readFileSync(path)),hash=s=>crypto.createHash('sha256').update(s).digest('hex');
for(const name of ['assets/index-UIRefine-v655-r84.js','index.html',flight]){
 let row=m.files.find(f=>f.name===name);if(!row){row={name,url:'/lab-desktop-ui/'+name};m.files.push(row);}
 row.sha256=hash(fs.readFileSync(root+'/'+name));
}
m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(path,JSON.stringify(m));
console.log('[R1595] body-level 1380ms legible Lab order card flight; site+Windows enabled');