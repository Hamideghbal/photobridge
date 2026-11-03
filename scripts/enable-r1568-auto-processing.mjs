// R1568 deployment patch, applied *after* the latest native UI optimization.
// Fail closed if upstream generated code moves: no partially wired automations.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,s)=>fs.writeFileSync(p,s);
const once=(s,a,b,label)=>{if(s.split(a).length!==2)throw Error('R1568 missing/ambiguous '+label);return s.replace(a,b)};
const sha=v=>crypto.createHash('sha256').update(v).digest('hex');
let path='dist/api/lab-download-receipt.js',receipt=read(path);
if(!receipt.includes('/* R1568 download proof */')){
 receipt="import crypto from 'node:crypto';\n"+receipt;
 receipt=once(receipt,'export function downloadFilesMatch(rows,files) {',`/* R1568 download proof */
export const verifiedDownloadKey=(labId,orderId)=>'lab_verified_receipt:'+labId+':'+orderId;
export function downloadManifestFingerprint(rows){
 const data=rows.map(row=>[String(row.id),String(row.original_name||''),String(row.print_name||''),Number(row.bytes||0),Number(row.print_bytes||0)])
   .sort((a,b)=>a[0].localeCompare(b[0]));
 return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
}
export function downloadFilesMatch(rows,files) {`,'receipt proof helpers');
 receipt=once(receipt,"if(!downloadFilesMatch(rows,files))throw fail('download_files_incomplete');",
 `if(!downloadFilesMatch(rows,files))throw fail('download_files_incomplete');
    // Same transaction as the server's verified download acknowledgement.
    await c.query(\`INSERT INTO platform_settings(key,value,updated_at) VALUES($1,$2::jsonb,now())
      ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()\`,
      [verifiedDownloadKey(labId,orderId),JSON.stringify({fileCount:rows.length,manifest:downloadManifestFingerprint(rows),deviceId,verifiedAt:new Date().toISOString()})]);`,
 'verified receipt persistence');
 write(path,receipt);
}
path='dist/api/server.js';let server=read(path);
if(!server.includes('/* R1568 guarded early invoice */')){
 server="import {handleLabAutomation} from './lab-auto-processing.js';\n"+server;
 const target="        if (req.method === 'GET' && url.pathname === '/api/lab/orders') {";
 const extra=`        /* R1568 guarded early invoice */
        if(await handleLabAutomation({req,res,url,labId,deviceId:requestDeviceId,pool,bodyJson,sendJson,
          issueInvoice:createOrGetInvoice,invoiceRequirements:orderInvoicePriceRequirements,
          storageConfigured,storagePresign,audit,actorId:a.userId}))return;
`+target;
 server=once(server,target,extra,'authenticated Lab route');
 write(path,server);
}
const bundle='assets/index-UIRefine-v655-r84.js';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 path=root+'/'+bundle;let source=read(path);
 if(!source.includes('/* R1568 automation settings */')){
  source=once(source,'"backup"]),m=()=>','"backup","automation"]),m=()=>','settings allowlist '+root);
  source=once(source,'["backup","پشتیبان اطلاعات سایت"]','["backup","پشتیبان اطلاعات سایت"],["automation","دانلود و چاپ خودکار"]','settings tab '+root);
  source=once(source,'g==="backup"&&e.jsxs("section"','g==="automation"&&e.jsx(PB1568AutomationSettings,{}),g==="backup"&&e.jsxs("section"','settings component '+root);
  source+='\n/* R1568 automation settings */\n'+read('scripts/r1568-auto-settings.js.txt')+'\n';
 }
 if(root.endsWith('lab-desktop-ui')&&!source.includes('/* R1568 native auto worker */')){
  source=once(source,"let done = force ? 0 : report.valid, bytes = force ? 0 : report.loadedBytes;",
    "let done = force ? 0 : report.valid, bytes = force ? 0 : report.loadedBytes;let fallbackUsed=false;",'native fallback tracker');
  const fallback=/if \(response\.pbFallbackOriginal\) alert\(([^;]+)\);/;
  if(!fallback.test(source))throw Error('R1568 missing native original fallback warning');
  source=source.replace(fallback,'if (response.pbFallbackOriginal) {fallbackUsed=true;if(!options.silent)alert($1);}');
  source=once(source,"alreadyComplete:!force && already.size===files.length}","alreadyComplete:!force && already.size===files.length,fallbackUsed}",'verified download return shape');
  // A fallback original may be valid but must not silently move through print production.
  // The caller probes conversion statuses first in future native runtime upgrades.
  source+='\n/* R1568 native auto worker */\n'+read('scripts/r1568-native-worker.js.txt')+'\n';
 }
 write(path,source);
 execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
 const htmlFile=root+'/index.html';let html=read(htmlFile);
 html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,m=>m.includes('&autoFlow=r1568')?m:m+'&autoFlow=r1568');
 const cssName='photobridge-r1568-auto.css';
 if(!html.includes(cssName))html=html.replace('</head>','<link rel="stylesheet" href="/'+cssName+'?v=r1568">\n</head>');
 write(htmlFile,html);
}
const css='dist/web/photobridge-r1568-auto.css';
write(css,`.pb1568AutomationSettings{max-width:800px;direction:rtl}.pb1568AutomationSettings .pb1568Row{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid #e8ebf0;cursor:pointer}.pb1568AutomationSettings .pb1568Row input{width:19px;height:19px;margin-top:4px;accent-color:#3467ad}.pb1568AutomationSettings .pb1568Row span{display:grid;gap:3px}.pb1568AutomationSettings .pb1568Row small{color:#667085;line-height:1.8}.pb1568Select{display:grid;gap:6px;margin:15px 0}.pb1568Select select{font:inherit;max-width:100%;min-height:42px;border:1px solid #cbd5e1;border-radius:9px;padding:8px;background:#fff;color:#27364a}.pb1568Printer{border-top:1px solid #e8ebf0;margin-top:12px}.pb1568AutomationSettings button{font:inherit;padding:9px 18px;border-radius:9px;border:0;background:#315ea4;color:#fff;cursor:pointer}.pb1568AutomationSettings button:disabled{opacity:.6}`);
fs.copyFileSync(css,'dist/web/lab-desktop-ui/photobridge-r1568-auto.css');
const native='dist/web/lab-desktop-ui',manifestPath=native+'/manifest.json',m=JSON.parse(read(manifestPath));
if(m.protocol!==1||m.channel!=='lab')throw Error('R1568 native manifest invalid');
for(const name of [bundle,'index.html','photobridge-r1568-auto.css']){
 const file=read(native+'/'+name),hash=sha(file);
 let row=m.files.find(x=>x.name===name);
 if(!row){row={name,url:'/lab-desktop-ui/'+name};m.files.push(row)}
 row.sha256=hash;
}
m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
m.build=sha(JSON.stringify(m.files));
m.generatedAt=new Date().toISOString();
write(manifestPath,JSON.stringify(m));
console.log('[R1568] guarded early invoices, UI toggles and Windows auto worker staged');
