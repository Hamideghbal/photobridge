import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const root='dist/web/lab-desktop-ui',file=root+'/assets/index-UIRefine-v655-r84.js';let s=fs.readFileSync(file,'utf8');
const once=(a,b)=>{if(s.split(a).length!==2)throw Error('R1582 changed anchor '+a.slice(0,80));s=s.replace(a,b)};
once("   if(task.phase==='pending_download'){", "   if(task.phase==='pending_download'){\n     pb1581Report({...order,lab_id:lab},{phase:'checking',done:0,total:order.file_count||0});");
once("   pb1568Work.lastError=message;", "   if(current.phase==='pending_download')pb1581Report({...order,lab_id:lab},{phase:'failed',error,explain:true});\n   pb1568Work.lastError=message;");
fs.writeFileSync(file,s);execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
for(const dir of ['dist/web',root]){const p=dir+'/index.html';fs.writeFileSync(p,fs.readFileSync(p,'utf8').replaceAll('&downloadFeedback=r1581','&downloadFeedback=r1582'))}
const path=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(path)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');for(const name of ['assets/index-UIRefine-v655-r84.js','index.html']){const row=manifest.files.find(x=>x.name===name);row.sha256=sha(fs.readFileSync(root+'/'+name))}manifest.build=sha(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();fs.writeFileSync(path,JSON.stringify(manifest));
