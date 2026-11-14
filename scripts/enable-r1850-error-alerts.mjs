import fs from 'node:fs';
const revision=fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim();
const serverFile='dist/api/server.js', bundleFile='dist/web/assets/index-UIRefine-v655-r84.js';
let server=fs.readFileSync(serverFile,'utf8'), bundle=fs.readFileSync(bundleFile,'utf8');
function once(text,anchor,value){if(text.split(anchor).length!==2)throw Error('R1850 anchor mismatch: '+anchor.slice(0,90));return text.replace(anchor,value);}
fs.copyFileSync('scripts/r1850-error-monitor.mjs','dist/api/error-monitor.mjs');
fs.copyFileSync('scripts/r1850-upload-statistics.mjs','dist/api/upload-statistics.mjs');
fs.copyFileSync('scripts/r1850-error-client.js','dist/web/photobridge-error-monitor-r1850.js');
fs.copyFileSync('scripts/r1850-upload-statistics-ui.js','dist/web/photobridge-upload-statistics-r1850.js');
fs.copyFileSync('scripts/r1850-error-admin.html','dist/api/error-monitor.html');
if(!server.includes('const PB1850monitor=')){
server="import {createErrorMonitor} from './error-monitor.mjs';\nimport {uploadStatisticsSql,statisticsRange} from './upload-statistics.mjs';\n"+server;
const helper=`
// Error monitoring stays off the response's critical path. Cache only in memory.
let PB1850smsCache=null;
async function PB1850refreshSms(){
  const cfg=await resolvedSMSSettings();
  const admins=await pool.query("SELECT id,mobile FROM users WHERE platform_role='platform_admin' AND active=true AND mobile IS NOT NULL ORDER BY created_at LIMIT 1");
  PB1850smsCache={cfg,admin:admins.rows[0],at:Date.now()};
}
const PB1850monitor=createErrorMonitor({directory:process.env.ERROR_MONITOR_DIR||path.join(path.dirname(LOCAL_UPLOAD_DIR),'error-monitor'),persistExternal:async row=>{await pool.query('INSERT INTO application_error_incidents(id,last_at,payload) VALUES($1,$2,$3::jsonb) ON CONFLICT(id) DO UPDATE SET last_at=EXCLUDED.last_at,payload=EXCLUDED.payload',[row.id,new Date(row.lastAt),JSON.stringify(row)]);},alert:async incident=>{
  if(!PB1850smsCache||Date.now()-PB1850smsCache.at>300000)await PB1850refreshSms();
  const {cfg,admin}=PB1850smsCache;
  if(!admin||!cfg.configured||!cfg.notificationsEnabled||!cfg.adminAlertsEnabled)throw Error('admin_sms_not_configured_or_disabled');
  const adapter=SMS_PROVIDER_ADAPTERS[cfg.provider];if(!adapter)throw Error('sms_provider_unsupported');
  const message='هشدار PhotoBridge\\n'+incident.id+'\\n'+incident.channel+' / '+incident.stage+' / '+incident.code+' / '+incident.status+'\\nتعداد: '+incident.count+'\\nپیگیری: photobridge.ir/admin/error-monitor';
  const result=await adapter(normalizeMobile(admin.mobile),message+'\\n'+cfg.footer,cfg);
  void logSms({provider:cfg.provider,purpose:'admin_alert',eventKey:'application_error',mobile:admin.mobile,userId:admin.id,status:'sent',reference:result.reference,metadata:{incidentId:incident.id}}).catch(()=>{});
}});
function PB1850backgroundError(error){console.error(error);void PB1850monitor.record({source:'server',stage:'background',code:String(error?.code||'background_error'),dependency:/pg-pool|node_modules\\/pg\\//.test(String(error?.stack||''))?'database':'',route:'/background'}).catch(()=>{});}
pool.on('error',PB1850backgroundError);
setTimeout(()=>{void PB1850refreshSms().catch(()=>{});},1000).unref();
setInterval(()=>{void PB1850refreshSms().catch(()=>{});},60000).unref();
`;
// Place after all server definitions, before bootstrap starts handling requests.
server=once(server,'async function bootstrap() {',helper+'\nasync function bootstrap() {');
const routes=`
    if(url.pathname==='/api/diagnostics/errors' && req.method==='POST'){
      const origin=String(req.headers.origin||'');
      if(!origin || (()=>{try{return new URL(origin).host!==req.headers.host}catch{return true}})())return sendJson(res,403,{error:'invalid_origin'});
      if(!String(req.headers['content-type']||'').startsWith('application/json'))return sendJson(res,415,{error:'json_required'});
      if(!PB1850monitor.allow('ip:'+requestIpHash(req)))return sendJson(res,429,{error:'rate_limited'});
      const actor=await auth(req);if(!actor)return sendJson(res,401,{error:'unauthorized'});
      if(!PB1850monitor.allow('user:'+actor.userId))return sendJson(res,429,{error:'rate_limited'});
      let body;try{body=await bodyJson(req,8192);}catch{return sendJson(res,400,{error:'invalid_report'});}
      if(!body||typeof body!=='object'||Array.isArray(body))return sendJson(res,400,{error:'invalid_report'});
      const incidentId=await PB1850monitor.record({...body,dependency:'',source:body.source==='upload'?'upload':body.source==='api'?'api':'browser',userId:actor.userId,revision:process.env.DEPLOY_REVISION||'r1850'});
      return sendJson(res,202,{incidentId});
    }
    if(url.pathname==='/api/admin/upload-statistics' && req.method==='GET'){
      const actor=await auth(req);if(!requireRole(actor,'platform_admin'))return sendJson(res,403,{error:'forbidden'});
      let range;try{range=statisticsRange(url.searchParams.get('from'),url.searchParams.get('to'));}catch{return sendJson(res,400,{error:'invalid_date_range'});}
      const result=await pool.query(uploadStatisticsSql,range);
      return sendJson(res,200,{from:range[0],to:range[1],timezone:'Asia/Tehran',rows:result.rows,truncated:result.rows.length===10000});
    }
    if(url.pathname==='/api/admin/error-incidents' && req.method==='GET'){
      const actor=await auth(req);if(!requireRole(actor,'platform_admin'))return sendJson(res,403,{error:'forbidden'});
      const recent=await PB1850monitor.list();
      const stored=await pool.query('SELECT payload FROM application_error_incidents ORDER BY last_at DESC LIMIT 200');
      const rows=new Map(stored.rows.map(row=>[row.payload.id,row.payload]));
      for(const row of recent)rows.set(row.id,row);
      return sendJson(res,200,[...rows.values()].sort((a,b)=>b.lastAt-a.lastAt).slice(0,200));
    }
`;
server=once(server,'async function api(req, res, url) {','async function api(req, res, url) {'+routes);
server=once(server,"const server = http.createServer(async (req, res) => { try {",`const server = http.createServer(async (req, res) => {
      const PB1850reference='PB-'+crypto.randomUUID().replaceAll('-','').slice(0,16).toUpperCase();
      res.setHeader('x-photobridge-error-reference',PB1850reference);
      res.once('finish',()=>{if(res.statusCode>=500&&!String(req.url||'').startsWith('/api/diagnostics/'))void PB1850monitor.record({source:'server',stage:/presign/.test(req.url||'')?'presign':/uploads/.test(req.url||'')?'complete':/submit/.test(req.url||'')?'submit':'api',code:req.PB1850errorCode||res.PB1850errorCode||'http_'+res.statusCode,dependency:req.PB1850dependency||'',status:res.statusCode,route:req.url,reference:PB1850reference}).catch(()=>{});});
      try {`);
server=once(server,"if (url.pathname.startsWith('/api/'))\n            return await api(req, res, url);",`if(url.pathname==='/admin/error-monitor' && req.method==='GET'){
            const actor=await auth(req);if(!requireRole(actor,'platform_admin'))return sendJson(res,403,{error:'forbidden'});
            return sendText(res,200,fs.readFileSync(path.join(DIST_ROOT,'api','error-monitor.html'),'utf8'),'text/html; charset=utf-8');
        }
        if (url.pathname.startsWith('/api/'))
            return await api(req, res, url);`);
server=once(server,"console.error(e);\n        return sendJson(res, 500, { error: 'internal_error'", "req.PB1850errorCode=String(e?.code||'internal_error'); req.PB1850dependency=/pg-pool|node_modules\\/pg\\//.test(String(e?.stack||''))?'database':'';\n        console.error(e);\n        return sendJson(res, 500, { error: 'internal_error'");
server=once(server,'function sendJson(res, status, body) {','function sendJson(res, status, body) { if(status>=500)res.PB1850errorCode=String(body?.error||"internal_error");');
server=server.replaceAll('.catch(console.error)','.catch(PB1850backgroundError)');
fs.writeFileSync(serverFile,server);
}
if(!bundle.includes('PB1850uploadError')){
const errorHelper=`function PB1850uploadError(xhr,file,kind){let providerCode='',reference='';try{providerCode=(xhr.responseText.match(/<Code>([A-Za-z0-9_.:-]{1,80})<\\/Code>/)||[])[1]||'';reference=(xhr.responseText.match(/<RequestId>([A-Za-z0-9_.:-]{1,120})<\\/RequestId>/)||[])[1]||xhr.getResponseHeader('x-amz-request-id')||''}catch{}return Object.assign(new Error(providerCode||kind),{status:Number(xhr.status)||0,pbStage:'upload',pbFile:file.name,pbReference:reference})}
async function PB1850stage(promise,stage,file){try{return await promise}catch(error){if(error?.name==='AbortError')throw error;error.pbStage=stage;error.pbFile=file?.name||error.pbFile;error.pbLocalReference||=window.PB1850?.reference(stage)||'PB-'+crypto.randomUUID().replaceAll('-','').slice(0,16).toUpperCase();window.PB1850?.report({source:'upload',stage,code:stage==='upload'?error.message:String(error?.data?.error||'request_failed'),status:error.status,providerRequestId:error.pbReference,reference:error.pbLocalReference,route:'/upload/'+stage});throw error}}
async function rs(url,file,progress,signal){return PB1850stage((async()=>{let high=0;for(let attempt=0;attempt<3;attempt++){try{return await PB1850rawUpload(url,file,value=>{high=Math.max(high,value);progress(high)},signal)}catch(error){if(signal?.aborted||error?.name==='AbortError'||![0,408,429,502,503,504].includes(Number(error.status)))throw error;if(attempt===2)throw error;await new Promise((resolve,reject)=>{const abort=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);reject(Object.assign(new Error('upload_aborted'),{name:'AbortError'}))};const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve()},(attempt+1)*1500);if(signal?.aborted)return abort();signal?.addEventListener('abort',abort,{once:true})})}}})(),'upload',file)}
`;
bundle=once(bundle,'function rs(t,a,s,r){',errorHelper+'function PB1850rawUpload(t,a,s,r){');
bundle=once(bundle,'l(new Error("upload_http_"+c.status))','l(PB1850uploadError(c,a,"upload_http_"+c.status))');
bundle=once(bundle,'l(new Error("upload_network_error"))','l(PB1850uploadError(c,a,"upload_network_error"))');
// Preserve business validation messages. Replace the misleading generic gateway claim.
const previous='([502,503,504].includes(Number(ye?.status||0))?"عکس‌ها منتقل شدند، ولی سرور هنگام تأیید نهایی پاسخ نداد (خطای "+String(ye.status)+"). لطفاً کمی بعد دوباره تلاش کن.":"ارسال سفارش کامل نشد؛ دوباره تلاش کن.")';
bundle=once(bundle,previous,'(window.PB1850?.describe(ye)||"ارسال سفارش کامل نشد؛ دوباره تلاش کن.")');
bundle=once(bundle,'const Gt=await Me("/api/customer/uploads/presign",{','const Gt=await PB1850stage(Me("/api/customer/uploads/presign",{');
bundle=once(bundle,'  });\n  ye();\n  await rs(Gt.uploadUrl','  }),"presign",tt.file);\n  ye();\n  await rs(Gt.uploadUrl');
bundle=once(bundle,'await PB1588verifyUpload(Gt.fileId,tt.file);','await PB1850stage(PB1588verifyUpload(Gt.fileId,tt.file),"complete",tt.file);');
bundle=once(bundle,'const Be=await Me(`/api/customer/orders/${P.id}/submit`,{method:"POST"});','const Be=await PB1850stage(Me(`/api/customer/orders/${P.id}/submit`,{method:"POST"}),"submit");');
fs.writeFileSync(bundleFile,bundle);
}
// All HTML pages using scripts gain API/JS reporting, not only the print portal.
function visit(directory){for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const file=directory+'/'+entry.name;if(entry.isDirectory())visit(file);else if(entry.name.endsWith('.html')){let html=fs.readFileSync(file,'utf8');if(/<head\b/i.test(html)&&!html.includes('photobridge-error-monitor-r1850.js')){html=html.replace(/<head\b[^>]*>/i,head=>head+'<script src="/photobridge-error-monitor-r1850.js?v=1850"></script>');}html=html.replace(/(photobridge-(?:error-monitor|upload-statistics)-r1850\.js)\?v=1850/g,(_,asset)=>asset+'?rev='+encodeURIComponent(revision));fs.writeFileSync(file,html);}}}
visit('dist/web');
visit('dist/api');
// Main JS is immutable: a new URL is required for existing browsers.
let html=fs.readFileSync('dist/web/index.html','utf8');
html=html.replace(/(src=["'])([^"']*\/assets\/index-[^"']+\.js)(\?[^"']*)?(["'])/g,(_,open,url,query,close)=>open+url+'?pbErrorRev='+encodeURIComponent(revision)+close);
fs.writeFileSync('dist/web/index.html',html);
console.log('[R1850] bounded error reports, private incident viewer, deduplicated administrator SMS');
