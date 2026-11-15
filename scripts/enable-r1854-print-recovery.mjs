import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1854 anchor mismatch: '+a.slice(0,110));return s.replace(a,b)};
const apiFile='dist/api/server.js';let api=fs.readFileSync(apiFile,'utf8');
api=once(api,'async function api(req, res, url) {',fs.readFileSync('scripts/r1854-server-recovery.js.txt','utf8')+'\nasync function api(req, res, url) {');
const orderAlias="        // R1854 recovery-only paths fail closed on older servers.\n        if(req.method==='POST'&&url.pathname==='/api/customer/recovery-orders'){req.PB1854recoveryOnly='order';url.pathname='/api/customer/orders';}\n";
const create="if (req.method === 'POST' && url.pathname === '/api/customer/orders') {";
let start=api.indexOf(create),end=api.indexOf('const customerOrder =',start),part=api.slice(start,end);
part=once(part,"            let albumData = null;",`            const recoveryId=b.recoveryId;
            if(req.PB1854recoveryOnly==='order'&&!recoveryId)return sendJson(res,400,{error:'recovery_id_required'});
            if(recoveryId && (mode!=='print'||!pb1854Uuid(recoveryId)))return sendJson(res,400,{error:'invalid_recovery_id'});
            if(recoveryId){
                const existing=await pool.query('SELECT * FROM orders WHERE id=$1 AND lab_id=$2 AND customer_id=$3',[recoveryId,labId,a.userId]);
                if(existing.rowCount){
                    const saved=existing.rows[0];
                    if(saved.mode!=='print'||saved.delivery!==delivery||saved.priority!==priority)return sendJson(res,409,{error:'draft_identity_conflict'});
                    return sendJson(res,200,{order:saved,replay:true});
                }
            }
            let albumData = null;`);
part=once(part,'INSERT INTO orders(lab_id,customer_id,mode,status,delivery,priority,album_data,album_stage,settlement_mode,payment_status) VALUES($1,$2,$3,\'uploading\',$4,$5,$6::jsonb,$7,$8,$9) RETURNING *','INSERT INTO orders(id,lab_id,customer_id,mode,status,delivery,priority,album_data,album_stage,settlement_mode,payment_status) VALUES($10,$1,$2,$3,\'uploading\',$4,$5,$6::jsonb,$7,$8,$9) ON CONFLICT(id) DO NOTHING RETURNING *');
part=once(part,'settlement, paymentStatus]);','settlement, paymentStatus, recoveryId||crypto.randomUUID()]);');
part=once(part,"            await audit(a.userId, labId, 'order.create_draft'",`            if(!q.rowCount){
                const replay=await pool.query('SELECT * FROM orders WHERE id=$1 AND lab_id=$2 AND customer_id=$3',[recoveryId,labId,a.userId]);
                const saved=replay.rows[0];
                if(!saved||saved.mode!=='print'||saved.delivery!==delivery||saved.priority!==priority)return sendJson(res,409,{error:'draft_identity_conflict'});
                return sendJson(res,200,{order:saved,replay:true});
            }
            await audit(a.userId, labId, 'order.create_draft'`);
api=api.slice(0,start)+part+api.slice(end);api=once(api,create,orderAlias+create);
const presign="        if (req.method === 'POST' && url.pathname === '/api/customer/uploads/presign') {";
api=once(api,presign,fs.readFileSync('scripts/r1855-exclude-route.js.txt','utf8')+fs.readFileSync('scripts/r1854-retry-route.js.txt','utf8')+"        if(req.method==='POST'&&url.pathname==='/api/customer/uploads/recovery-presign'){req.PB1854recoveryOnly='file';url.pathname='/api/customer/uploads/presign';}\n"+presign);
start=api.indexOf(presign);end=api.indexOf('const localUpload =',start);part=api.slice(start,end);
part=once(part,'            const id = crypto.randomUUID();',`            if(req.PB1854recoveryOnly==='file'&&!b.clientFileId)return sendJson(res,400,{error:'recovery_file_required'});
            if(b.clientFileId && (albumMode||!pb1854Uuid(b.clientFileId)||!/^[0-9a-f]{64}$/.test(String(b.checksum||''))))return sendJson(res,400,{error:'invalid_recovery_file'});
            if(b.clientFileId){
                try{const existing=await pb1854ExistingFile(b.clientFileId,orderId,labId,a.userId,b);if(existing)return sendJson(res,200,{fileId:existing.id,replay:true,state:existing.original_state});}
                catch(error){return sendJson(res,error.status||409,{error:error.message});}
            }
            const id = b.clientFileId||crypto.randomUUID();`);
part=once(part,'            await pool.query(`INSERT INTO order_files',`            if(b.clientFileId)pb1779AddonSelection={...pb1779AddonSelection,_uploadRecovery:{identity:pb1854Identity(b)}};
            await pool.query(\`INSERT INTO order_files`);
part=once(part,"$19::jsonb,'pending')`", "$19::jsonb,'pending') ON CONFLICT(id) DO NOTHING`");
part=once(part,'            return sendJson(res, 201, { fileId: id, key, uploadUrl,',`            if(b.clientFileId){try{if(!await pb1854ExistingFile(id,orderId,labId,a.userId,b))return sendJson(res,409,{error:'upload_identity_conflict'});}catch(error){return sendJson(res,error.status||409,{error:error.message});}}
            return sendJson(res, 201, { fileId: id, key, uploadUrl,`);
api=api.slice(0,start)+part+api.slice(end);
// The existing submit transaction keeps all pricing/payment logic. Guard the new
// recovery client before any inventory or invoice work, under the same row lock.
start=api.indexOf('const submitCustomerOrder =');end=api.indexOf('const customerReceiptPresign =',start);part=api.slice(start,end);
part=once(part,"                await c.query('BEGIN');",`                await c.query('BEGIN');
                if(req.headers['x-photobridge-upload-count']!==undefined){
                    const expected=Number(req.headers['x-photobridge-upload-count']);
                    const locked=await c.query('SELECT status FROM orders WHERE id=$1 AND lab_id=$2 AND customer_id=$3 FOR UPDATE',[submitCustomerOrder[1],labId,a.userId]);
                    if(locked.rows[0]?.status!=='uploading'){await c.query('ROLLBACK');return sendJson(res,409,{error:'recovery_already_submitted'});}
                    const count=await c.query("SELECT count(*)::int total,count(*) FILTER(WHERE original_state='active')::int ready FROM order_files WHERE order_id=$1 AND lab_id=$2 AND customer_id=$3 AND original_state<>'deleted'",[submitCustomerOrder[1],labId,a.userId]);
                    if(!Number.isSafeInteger(expected)||expected<1||Number(count.rows[0]?.total)!==expected||Number(count.rows[0]?.ready)!==expected){await c.query('ROLLBACK');return sendJson(res,409,{error:'upload_queue_incomplete'});}
                }`);
api=api.slice(0,start)+part+api.slice(end);
const completeAnchor="        if (req.method === 'POST' && url.pathname === '/api/customer/uploads/complete') {";
start=api.indexOf(completeAnchor);end=api.indexOf("\n    return sendJson(res, 404, { error: 'not_found' });",start);part=api.slice(start,end);
part=once(part,"            await pool.query(`UPDATE order_files SET original_state='active' WHERE id=$1`, [b.fileId]);",`            const pb1855Activated=await pool.query("UPDATE order_files SET original_state='active' WHERE id=$1 AND original_state='pending'",[b.fileId]);
            if(pb1855Activated.rowCount===0){
                const current=await pool.query('SELECT original_state FROM order_files WHERE id=$1 AND lab_id=$2 AND customer_id=$3',[b.fileId,labId,a.userId]);
                if(current.rows[0]?.original_state!=='active')return sendJson(res,409,{error:'upload_not_pending'});
            }`);
api=api.slice(0,start)+part+api.slice(end);fs.writeFileSync(apiFile,api);execFileSync(process.execPath,['--check',apiFile]);
// UI patch is isolated to the print component after all earlier production patches.
for(const directory of ['dist/web','dist/web/lab-desktop-ui']){
const bundle=directory+'/assets/index-UIRefine-v655-r84.js';let js=fs.readFileSync(bundle,'utf8');
start=js.indexOf('function ej(');end=js.indexOf('function vh(',start);if(start<0||end<start)throw Error('R1854 print component missing');let component=js.slice(start,end);
const payloadMatch=component.match(/body:JSON\.stringify\((\{orderId:P.id,name:tt.file.name,[\s\S]*?cropHandling:\"(?:lab|none)\"\})\)/);
if(!payloadMatch)throw Error('R1854 original payload missing: '+directory);
const payload=payloadMatch[1].replace('orderId:P.id,','');
const maker='const PB1854payload=(bt,file)=>{const tt={...file,file:{name:file.name,size:file.size,type:file.type}},Nt=Zv(bt.label),_t=tt.paperOverride||bt.paperType,yt=Wr(bt,tt,"chassis"),Tt=Wr(bt,tt,"frame"),Wt=String(tt.relativePath||tt.file.name).replace(/^\\/+/, "");return '+payload+';};';
const hooks=maker+fs.readFileSync('scripts/r1854-react-hooks.js.txt','utf8');
component=once(component,'const ot=T.reduce(',hooks+'const ot=T.reduce(');
// Keep all original validation and the mandatory crop-consent dialog.
const runStart=component.indexOf('const ue=new AbortController;',component.indexOf('he=async()=>'));
const runEnd=component.indexOf('},qe=()=>',runStart);if(runStart<0||runEnd<runStart)throw Error('R1854 submit bounds missing');
component=component.slice(0,runStart)+fs.readFileSync('scripts/r1854-react-send.js.txt','utf8')+component.slice(runEnd);
component=once(component,'className:"simplePrintPilot",dir:"rtl",children:[','className:"simplePrintPilot",dir:"rtl",children:[PB1854panel,');
component=component.replaceAll('children:"لغو ارسال"','children:"توقف و حفظ ارسال"');
component=once(component,'onClick:()=>re(Be)','onClick:()=>PB1855preview(Be.id)');
component=once(component,'className:"simplePrintPhotoCard "+','"data-pb1855-file":Be.id,className:"simplePrintPhotoCard "+');

component=component.replace('با تغییر لابراتوار، فایل‌های انتخاب‌شده این صفحه پاک می‌شوند. ادامه می‌دهی؟','انتخاب‌ها و پیشرفت ارسال این لابراتوار ذخیره می‌ماند. به لابراتوار دیگری برویم؟');
// Handler guards also protect programmatic and desktop proxy controls.
component=component.replaceAll('onChange:Ce}', 'onChange:Ce,disabled:!!PB1854snapshot?.orderId||W}').replaceAll('onChange:Fe}', 'onChange:Fe,disabled:!!PB1854snapshot?.orderId||W}');
component=once(component,'_e=(ue,P=null)=>{','_e=(ue,P=null)=>{if(!PB1854ready||PB1854snapshot?.orderId)return;');
for(const marker of ['de=(ue,P)=>k(','Ne=(ue,P,b)=>k(','Ie=(ue,P,b)=>k(','Y=(ue,P,b,oe)=>k('])if(component.includes(marker))component=once(component,marker,marker.replace('=>k(','=>PB1854snapshot?.orderId?undefined:k('));

for(const marker of ['_=async(ue,P)=>{','A=(ue,P)=>{','D=ue=>{','ve=async ue=>{'])if(component.includes(marker))component=once(component,marker,marker+'if(PB1854snapshot?.orderId)return;');
component=once(component,'A=(ue,P)=>{if(PB1854snapshot?.orderId)return;','A=(ue,P)=>{if(PB1854snapshot?.orderId){void PB1855remove(P);return;}');
// A delayed image decoder must not append photographs after the account/lab changed.
for(const marker of ['_=async(ue,P)=>{','ve=async ue=>{'])component=once(component,marker,marker+'const PB1854photoContext=PB1854context.current;');
const photoRead=component.includes('const oe=await d(b);')?'const oe=await d(b);':'const oe=await d(fresh.map(row=>row.file));';
component=once(component,photoRead,photoRead+'if(PB1854photoContext!==PB1854context.current){oe.forEach(zs);return}');
component=once(component,'const[oe]=await d([b]);','const[oe]=await d([b]);if(PB1854photoContext!==PB1854context.current){zs(oe);return}');
// A submitted queue is replaced only when the photographer explicitly starts a new selection.
component=once(component,'k([]),Ge(null),be(0)', 'PB1854manager.current?.reset(),PB1854setSnapshot(null),k([]),Ge(null),be(0)');
js=js.slice(0,start)+component+js.slice(end);
js=fs.readFileSync('scripts/r1854-print-recovery.cjs','utf8')+'\n'+js;
fs.writeFileSync(bundle,js);execFileSync(process.execPath,['--check',bundle]);
fs.copyFileSync('scripts/r1854-print-recovery.css',directory+'/photobridge-print-recovery-r1854.css');
let html=fs.readFileSync(directory+'/index.html','utf8');const prefix=directory==='dist/web'?'/':'./';html=once(html,'</head>',`<link rel="stylesheet" href="${prefix}photobridge-print-recovery-r1854.css?v=r1855"></head>`);html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,'$1&printRecovery=r1855');fs.writeFileSync(directory+'/index.html',html);
}
// Extend passive telemetry to the fresh URL issued after probing the same file.
const health='dist/web/photobridge-upload-health-r1851.js';let monitor=fs.readFileSync(health,'utf8');monitor=once(monitor,"    if(method!=='POST')return '';","    if(method!=='POST')return '';\n    if(path==='/api/customer/recovery-orders')return 'create';\n    if(path==='/api/customer/uploads/recovery-presign')return 'presign';\n    if(/^\\/api\\/customer\\/uploads\\/[0-9a-f-]+\\/retry$/.test(path))return 'presign';");monitor=once(monitor,'var existing=fileMeta(body.fileId),','var existing=fileMeta(body.fileId||body.clientFileId||url.pathname.match(/uploads\\/([0-9a-f-]+)\\/retry$/)?.[1]),');monitor=once(monitor,'logicalFileId=uuid();','logicalFileId=existing?.fileId||uuid();');monitor=once(monitor,'orderId:order,bytes:Number.isSafeInteger(body.bytes)?body.bytes:null','orderId:order||existing?.orderId,bytes:Number.isSafeInteger(body.bytes)?body.bytes:existing?.bytes||null');monitor=once(monitor,'    ensureCard();if(!card)return;','    if(window.__PB1854PrintActive)return;\n    ensureCard();if(!card)return;');fs.writeFileSync(health,monitor);
console.log('[R1854] Print originals and verified file IDs survive retries; no draft deletion on failure.');

const frozen='dist/web/lab-desktop-ui',manifestPath=frozen+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
for(const name of ['index.html','assets/index-UIRefine-v655-r84.js','photobridge-print-recovery-r1854.css']){
 let item=manifest.files.find(item=>item.name===name);if(!item){item={name,url:'/lab-desktop-ui/'+name};manifest.files.push(item)}item.sha256=sha(fs.readFileSync(frozen+'/'+name));
}
manifest.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));manifest.build=sha(JSON.stringify(manifest.files));fs.writeFileSync(manifestPath,JSON.stringify(manifest));
