// R1714: do not wait for HEIC decode in the /complete HTTP request.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const file = 'dist/api/server.js';
const once = (s,a,b,label) => {
 const count=s.split(a).length-1;
 if(count!==1)throw Error('R1714 '+label+' anchor count '+count);
 return s.replace(a,b);
};
let api=fs.readFileSync(file,'utf8');
if(!api.includes('async function pb1712ReadPrintOriginal(')||!api.includes('async function pb1666HeicFallback('))
 throw Error('R1714 requires completed HEIC pipeline R1712/R1713');
if(api.includes('const pb1714PendingJobs ='))throw Error('R1714 duplicate server installation');
api=once(api,'async function ensurePrintReadyJpeg(row) {',
 fs.readFileSync('scripts/r1714-heic-async-server.js.txt','utf8')+'\nasync function ensurePrintReadyJpeg(row) {','server queue helper');
const anchor = "        if (req.method === 'POST' && url.pathname === '/api/customer/uploads/complete') {";
const statusRoute = [
"        // Short, authenticated polling endpoint for an already-uploaded HEIC.",
"        const pb1714StatusMatch = url.pathname.match(/^\/api\/customer\/uploads\/status\/([0-9a-f-]{36})$/i);",
"        if (req.method === 'GET' && pb1714StatusMatch) {",
"            const q = await pool.query('SELECT * FROM order_files WHERE id=$1 AND lab_id=$2 AND customer_id=$3', [pb1714StatusMatch[1], labId, a.userId]);",
"            if (!q.rowCount) return sendJson(res, 404, { error: 'not_found' });",
"            const row = q.rows[0];",
"            if (String(row.original_state || '') === 'active') return sendJson(res, 200, { ok: true, status: 'ready', fileId: row.id });",
"            if (String(row.original_state || '') !== 'pending' || !pb1666IsHeic(row)) return sendJson(res, 409, { error: 'invalid_upload_state' });",
"            const job = pb1714PendingJobs.get(String(row.id));",
"            if (job?.status === 'failed' || (!job && String(row.print_conversion_status || '') === 'failed')) {",
"                return sendJson(res, 422, { error: 'print_jpeg_conversion_failed', fileId: row.id, fileName: row.original_name || '', reason: job?.reason || 'تبدیل فایل به JPEG کامل نشد؛ دوباره تلاش کنید', phase: job?.phase || 'decode' });",
"            }",
"            if (!job) pb1714Enqueue(row); // recover conversion after a process restart",
"            return sendJson(res, 202, { ok: true, status: 'processing', fileId: row.id, retryAfterMs: 1600 });",
"        }",
""
].join('\n');
api=once(api,anchor,statusRoute+anchor,'status polling route');
const a=api.indexOf(anchor), b=api.indexOf("\n    return sendJson(res, 404, { error: 'not_found' });",a);
if(a<0||b<=a)throw Error('R1714 completion route bounds unavailable');
let section=api.slice(a,b);
section=once(section,"            const row = q.rows[0];\n            if (String(row.object_key || '').startsWith('local/')) {",
"            const row = q.rows[0];\n            if (String(row.original_state || '') === 'active') return sendJson(res, 200, { ok: true, status: 'ready', fileId: row.id });\n            if (String(row.original_state || '') !== 'pending') return sendJson(res, 409, { error: 'invalid_upload_state' });\n            if (String(row.object_key || '').startsWith('local/')) {",'idempotent completion');
section=once(section,"            try {\n                await ensurePrintReadyJpeg(row);\n            }",
"            if (pb1666IsHeic(row)) {\n                pb1714Enqueue(row);\n                return sendJson(res, 202, { ok: true, status: 'processing', fileId: row.id, retryAfterMs: 1600 });\n            }\n            try {\n                await ensurePrintReadyJpeg(row);\n            }",'HEIC async route');
api=api.slice(0,a)+section+api.slice(b);
fs.writeFileSync(file,api);
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});

const hash=content=>crypto.createHash('sha256').update(content).digest('hex');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const jsPath=root+'/assets/index-UIRefine-v655-r84.js';
 let js=fs.readFileSync(jsPath,'utf8');
 if(js.includes('async function pb1714FinishUpload('))throw Error('R1714 duplicate UI helper '+root);
 js=once(js,'await Me("/api/customer/uploads/complete",{method:"POST",body:JSON.stringify({fileId:Gt.fileId})})',
   'await pb1714FinishUpload(Gt.fileId,ue.signal)','print UI completion '+root);
 js=once(js,'await Me("/api/customer/uploads/complete",{method:"POST",body:JSON.stringify({fileId:An.fileId})})',
   'await pb1714FinishUpload(An.fileId,ht.signal)','album UI completion '+root);
 // If async conversion outlives a browser timeout, never destroy its uploaded draft.
 const tick=String.fromCharCode(96),dollar=String.fromCharCode(36);
 const old='P!=null&&P.id&&await Me('+tick+'/api/customer/orders/'+dollar+'{P.id}/draft'+tick+',{method:"DELETE"}).catch(()=>{})';
 const revised='P!=null&&P.id&&!ye?.pb1714Pending&&await Me('+tick+'/api/customer/orders/'+dollar+'{P.id}/draft'+tick+',{method:"DELETE"}).catch(()=>{})';
 js=once(js,old,revised,'preserve pending print draft '+root);
 js+='\n'+fs.readFileSync('scripts/r1714-heic-async-client.js.txt','utf8');
 fs.writeFileSync(jsPath,js);
 execFileSync(process.execPath,['--check',jsPath],{stdio:'inherit'});
 const htmlPath=root+'/index.html';
 let html=fs.readFileSync(htmlPath,'utf8');
 let occurrences=0;
 html=html.replace(/index-UIRefine-v655-r84\.js\?[^"']*/g,s=>{occurrences++;return s+'&heicAsync=r1714'});
 if(occurrences!==1)throw Error('R1714 missing cache URL '+root+': '+occurrences);
 fs.writeFileSync(htmlPath,html);
 if(root.endsWith('lab-desktop-ui')){
  const mf=root+'/manifest.json',m=JSON.parse(fs.readFileSync(mf,'utf8'));
  for(const name of ['assets/index-UIRefine-v655-r84.js','index.html']){
   const entry=m.files.find(x=>x.name===name);
   if(!entry)throw Error('R1714 missing desktop manifest '+name);
   entry.sha256=hash(fs.readFileSync(root+'/'+name));
  }
  m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();
  fs.writeFileSync(mf,JSON.stringify(m));
 }
}
console.log('[R1714] HEIC upload-finalization returns 202, serialized decode, authenticated status polling and safe draft retention active.');
