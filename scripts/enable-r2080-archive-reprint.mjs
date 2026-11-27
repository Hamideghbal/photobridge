// R2080: archive reprint receipt, billing and customer-notice separation.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {patchServer,patchUi,patchInvoicePolicy} from './r2080-archive-reprint.mjs';
const files=['dist/api/server.js','dist/api/verified-download-invoice.js','dist/api/lab-priced-invoice-policy.js','dist/web/assets/index-UIRefine-v655-r84.js','dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js'];
for(const file of files){
 const old=fs.readFileSync(file,'utf8');
 const next=file.endsWith('/server.js')?patchServer(old):file.includes('/api/')?patchInvoicePolicy(old):patchUi(old,file.includes('lab-desktop-ui'));
 fs.writeFileSync(file,next);
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}
console.log('[R2080] archive reprint receipt, invoice outcome and quiet customer workflow');
