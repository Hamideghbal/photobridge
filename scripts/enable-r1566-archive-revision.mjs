import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let s=fs.readFileSync(file,'utf8');
const once=(a,b)=>{if(s.split(a).length!==2)throw Error('R1566 anchor '+a);s=s.replace(a,b)};
if(!s.includes('/* PB1566 archive expected revision */')){
 once('if(!window.pbNativeStorage)await pb1451AcknowledgeDownload(prepared);','const receipt=await pb1451AcknowledgeDownload(prepared);');
 once("draft.id,{status:'downloaded',note:","draft.id,{status:'downloaded',expectedRevision:receipt.order.document_revision,note:");
 once('await pb1451AcknowledgeDownload(prepared);\n      const confirmed=', 'const receipt=await pb1451AcknowledgeDownload(prepared);\n      const confirmed=');
 once("result.order.id,{status:'downloaded',note:","result.order.id,{status:'downloaded',expectedRevision:receipt.order.document_revision,note:");
 s+='\n/* PB1566 archive expected revision */\n';fs.writeFileSync(file,s);
}
execFileSync(process.execPath,['--check',file]);
const index='dist/web/index.html';let h=fs.readFileSync(index,'utf8');h=h.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&archiveRevision=r1566')?u:u+'&archiveRevision=r1566');fs.writeFileSync(index,h);
console.log('[R1566] Browser archive transitions use the acknowledged document revision; native unchanged');
