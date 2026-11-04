import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const path=root+'/assets/index-UIRefine-v655-r84.js';let s=fs.readFileSync(path,'utf8');
 const once=(a,b)=>{if(s.split(a).length!==2)throw Error('R1583 source changed '+a.slice(0,80));s=s.replace(a,b)};
 once('if(nt==="download"||nt==="download_print")return Vn(le,{force:pb1450Retry(le,yc(le.id))});',`if(nt==="download"||nt==="download_print"){if(pb1583CanRetry(le,t.id)){C(le.id);try{return await pb1583RetryDownload({labId:t.id,orderId:le.id,number:le.number})}finally{C("")}}return Vn(le,{force:pb1450Retry(le,yc(le.id))});}`);
 once('pb1450Retry(le,Mt)?"دانلود مجدد":Jt.label','pb1583CanRetry(le,t.id)?"تلاش مجدد دانلود":pb1450Retry(le,Mt)?"دانلود مجدد":Jt.label');
 once('number:order.number,phase,reason};','number:order.number,phase,reason,retrySupported:typeof pb1583RetryDownload==="function"};');
 if(root.endsWith('lab-desktop-ui')){
  once(' finally{pb1568Work.running=false}', ' finally{pb1568Work.running=false;if(typeof pb1583DrainRetries==="function")void pb1583DrainRetries()}');
  s+='\n'+fs.readFileSync('scripts/r1583-download-retry.js.txt','utf8');
 }else s+='\nfunction pb1583CanRetry(){return false}\n';
 fs.writeFileSync(path,s);execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
 const html=root+'/index.html';fs.writeFileSync(html,fs.readFileSync(html,'utf8').replaceAll('&downloadFeedback=r1582','&downloadFeedback=r1583'));
}
const root='dist/web/lab-desktop-ui',path=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(path)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');for(const name of ['assets/index-UIRefine-v655-r84.js','index.html']){const row=manifest.files.find(x=>x.name===name);row.sha256=sha(fs.readFileSync(root+'/'+name))}manifest.build=sha(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();fs.writeFileSync(path,JSON.stringify(manifest));
