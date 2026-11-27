import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/api/server.js';
let source=fs.readFileSync(file,'utf8');
const marker='/* PB2068 download overdue worker */';
if(!source.includes(marker)){
 const anchor='startLabSubscriptionNotices({pool,sendSms,normalizeMobile,publicUrl:PUBLIC_APP_URL});';
 if(source.split(anchor).length!==2)throw Error('R2068 subscription worker startup anchor changed');
 source="import {startLabDownloadOverdue} from './lab-download-overdue.js';\n"+source.replace(anchor,anchor+"\n"+marker+"\nstartLabDownloadOverdue({pool,sendSms,normalizeMobile});");
 fs.writeFileSync(file,source);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
execFileSync(process.execPath,['--check','dist/api/lab-download-overdue.js'],{stdio:'inherit'});
console.log('[R2068] server-side overdue download SMS worker enabled');
