import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const path=root+'/assets/index-UIRefine-v655-r84.js';let source=fs.readFileSync(path,'utf8');
 const replace=(before,after)=>{if(source.split(before).length!==2)throw Error('R1580 source changed: '+before.slice(0,80));source=source.replace(before,after)};
 replace('Q=async(le,nt=!1)=>{if(le===T)return;','Q=async(le,nt=!1)=>{if(le===T)return;window.dispatchEvent(new CustomEvent("photobridge-queue-transfer",{detail:{from:T,to:le}}));');
 replace('gn=async le=>{if(!E){C(le.id);try{await It(le,"completed");',`gn=async le=>{if(!E){C(le.id);try{let current=le;if(typeof window!=="undefined"&&window.pbNativeStorage){const fresh=(await Me('/api/lab/orders/'+encodeURIComponent(le.id))).order;if(!fresh)throw Error('اطلاعات تازهٔ سفارش دریافت نشد.');current={...le,...fresh,id:le.id};if(!['ready','completed'].includes(current.status))throw Error('مرحلهٔ سفارش تغییر کرده است؛ وضعیت تازه را بررسی کنید.')}if(current.status!=='completed')await It(current,"completed");`);
 replace('catch{alert("ثبت تحویل سفارش انجام نشد. دوباره تلاش کن."),await ye().catch(()=>{})}',`catch(error){const code=error?.data?.error||error?.code||'',reason=error?.data?.message||error?.message||'';pb1547Notice('ثبت تحویل انجام نشد'+(reason?'؛ '+reason:'')+(code&&code!==reason?' ('+code+')':''),'warning');void ye().catch(()=>{})}`);
 fs.writeFileSync(path,source);execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
 const htmlPath=root+'/index.html';let html=fs.readFileSync(htmlPath,'utf8').replaceAll('?v=r1579','?v=r1580').replaceAll('&queueCue=r1579','&queueCue=r1580');fs.writeFileSync(htmlPath,html);
}
const root='dist/web/lab-desktop-ui',path=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(path)),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const name of ['assets/index-UIRefine-v655-r84.js','index.html']){const row=manifest.files.find(item=>item.name===name);if(!row)throw Error('R1580 missing manifest entry');row.sha256=sha(fs.readFileSync(root+'/'+name))}manifest.build=sha(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();fs.writeFileSync(path,JSON.stringify(manifest));
