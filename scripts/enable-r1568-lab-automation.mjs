// R1568 build stage. Patch the generated production server and frozen native UI.
import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const marker='/* PB1568 AUTO INTAKE */',serverPath='dist/api/server.js';
let s=fs.readFileSync(serverPath,'utf8');
const once=(value,old,next,label)=>{if(value.split(old).length!==2)throw Error('R1568 '+label+' anchor changed');return value.replace(old,next)};
if(!s.includes(marker)){
 s="import {readLabAutomation,saveLabAutomation} from './lab-automation.js';\n"+s;
 const anchor="        if (req.method === 'GET' && url.pathname === '/api/lab/orders') {";
 const route=`
        ${marker}
        if (url.pathname === '/api/lab/automation-settings') {
            if (req.method === 'GET')
                return sendJson(res,200,{settings:await readLabAutomation(pool,labId)});
            if (req.method === 'PUT') {
                try {
                    const settings=await saveLabAutomation(pool,labId,await bodyJson(req));
                    await audit(a.userId,labId,'lab.automation_settings','lab',labId,settings).catch(()=>{});
                    return sendJson(res,200,{settings});
                } catch(error) {
                    if(error.status)return sendJson(res,error.status,{error:error.message});
                    throw error;
                }
            }
            return sendJson(res,405,{error:'method_not_allowed'});
        }
        const pb1568Early=url.pathname.match(/^\\/api\\/lab\\/orders\\/([0-9a-f-]+)\\/early-invoice(?:\\/download)?$/);
        if(pb1568Early&&req.method==='POST'){
            const orderId=pb1568Early[1],settings=await readLabAutomation(pool,labId);
            if(settings.invoiceTiming!=='before_print')return sendJson(res,409,{error:'early_invoice_disabled'});
            const b=await bodyJson(req);
            try {
                // Identical to the existing primary-device and file-manifest verification.
                await acknowledgeLabDownload({pool,labId,deviceId:requestDeviceId,orderId,files:b.files});
            }catch(error){
                if(error.status)return sendJson(res,error.status,{error:error.message});
                throw error;
            }
            const c=await pool.connect();let invoice,order;
            try {
                await c.query('BEGIN');
                await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[labId,orderId]);
                const oq=await c.query('SELECT * FROM orders WHERE id=$1 AND lab_id=$2 FOR UPDATE',[orderId,labId]);
                if(!oq.rowCount)throw Object.assign(Error('not_found'),{status:404});
                order=oq.rows[0];
                if(!order.downloaded_at||order.invoice_required===false||order.mode!=='print'||['cancelled','uploading'].includes(order.status)||['manual_invoice','walkin'].includes(String(order.source||'')))throw Object.assign(Error('early_invoice_not_allowed'),{status:409});
                if(order.settlement_mode==='prepaid'&&order.payment_status!=='paid')throw Object.assign(Error('payment_required'),{status:409});
                invoice=await createOrGetInvoice(c,labId,orderId);
                await c.query('COMMIT');
            } catch(error) {
                await c.query('ROLLBACK').catch(()=>{});
                if(error.code==='invoice_pricing_required'||error.message==='invoice_pricing_required')return sendJson(res,409,{error:'invoice_pricing_required',missingPricing:error.missingPricing||[],pricingRequirements:error.pricingRequirements||[],manualInvoiceRequired:true});
                if(error.status)return sendJson(res,error.status,{error:error.message});
                throw error;
            } finally {c.release()}
            await audit(a.userId,labId,'order.early_invoice','order',orderId,{invoiceId:invoice.id}).catch(()=>{});
            return sendJson(res,200,{order,invoice});
        }
`;
 s=once(s,anchor,route+anchor,'lab automation routes');
 s=once(s,'f.id,COALESCE(f.print_name,f.original_name) original_name,f.original_name source_original_name','f.id,COALESCE(f.print_copies,1) print_copies,COALESCE(f.print_name,f.original_name) original_name,f.original_name source_original_name','detail copies');
 fs.writeFileSync(serverPath,s);
}
execFileSync(process.execPath,['--check',serverPath],{stdio:'inherit'});
const native='dist/web/lab-desktop-ui',asset='assets/index-UIRefine-v655-r84.js';
let js=fs.readFileSync(native+'/'+asset,'utf8');
if(!js.includes(marker)){
 js=once(js,'root = await pb1450Root(true,detail);','root = await pb1450Root(options.automatic!==true,detail);','unattended root selection');
 js=once(js,'if (response.pbFallbackOriginal) alert(','if (response.pbFallbackOriginal && !options.automatic) alert(','nonblocking fallback');
 js+='\n'+marker+'\n'+fs.readFileSync('scripts/r1568-native-worker.js.txt','utf8')+'\n';
 fs.writeFileSync(native+'/'+asset,js);
}
execFileSync(process.execPath,['--check',native+'/'+asset],{stdio:'inherit'});
const settingsScript='photobridge-r1568-lab-automation-settings.js';
for(const dir of ['dist/web',native]){
 let html=fs.readFileSync(dir+'/index.html','utf8');
 if(!html.includes(settingsScript))html=html.replace('</body>','<script defer src="/'+settingsScript+'?v=r1568"></script>\n</body>');
 fs.writeFileSync(dir+'/index.html',html);
}
fs.copyFileSync('dist/web/'+settingsScript,native+'/'+settingsScript);
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),manifestFile=native+'/manifest.json';
const m=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
for(const name of [asset,'index.html',settingsScript]){
 let f=m.files.find(x=>x.name===name);if(!f){f={name,url:'/lab-desktop-ui/'+name};m.files.push(f)}
 f.sha256=hash(fs.readFileSync(native+'/'+name));
}
m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(manifestFile,JSON.stringify(m));
console.log('[R1568] Opt-in automation preferences, verified early invoice and native download worker',m.build.slice(0,12));
