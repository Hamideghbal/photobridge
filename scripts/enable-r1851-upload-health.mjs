// R1851 is applied after R1850 and before the final performance patch.
import fs from 'node:fs';
const revision=fs.readFileSync('DEPLOY_REVISION.txt','utf8').trim();
const serverFile='dist/api/server.js';
function once(source,anchor,replacement){
  if(source.split(anchor).length!==2)throw Error('R1851 anchor mismatch: '+anchor.slice(0,90));
  return source.replace(anchor,replacement);
}
fs.copyFileSync('scripts/r1851-upload-health.mjs','dist/api/upload-health.mjs');
fs.copyFileSync('scripts/r1851-upload-health-client.js','dist/web/photobridge-upload-health-r1851.js');
fs.copyFileSync('scripts/r1851-upload-health-admin.html','dist/api/upload-health.html');
let server=fs.readFileSync(serverFile,'utf8');
if(!server.includes('PB1851UploadHealthRate')){
  server="import {recordUploadHealthEvents,uploadHealthSummarySql,uploadHealthFailureSql} from './upload-health.mjs';\n"+server;
  const rateHelper=String.raw`
const PB1851UploadHealthRate=new Map();
function PB1851allowUploadHealth(actor){
  const key=String(actor),time=Date.now(),last=PB1851UploadHealthRate.get(key);
  const row=!last||time-last.at>60000?{at:time,count:1}:{at:last.at,count:last.count+1};
  PB1851UploadHealthRate.delete(key);PB1851UploadHealthRate.set(key,row);
  while(PB1851UploadHealthRate.size>2000)PB1851UploadHealthRate.delete(PB1851UploadHealthRate.keys().next().value);
  return row.count<=40;
}
`;
  server=once(server,'async function api(req, res, url) {',rateHelper+String.raw`
async function api(req, res, url) {
    if(url.pathname==='/api/admin/upload-health' && req.method==='GET'){
      const actor=await auth(req);
      if(!requireRole(actor,'platform_admin'))return sendJson(res,403,{error:'forbidden'});
      if(process.env.PB_UPLOAD_HEALTH_ENABLED==='0')return sendJson(res,503,{error:'upload_health_disabled'});
      const [summary,failures]=await Promise.all([
        pool.query(uploadHealthSummarySql),pool.query(uploadHealthFailureSql)]);
      return sendJson(res,200,{windowDays:14,summary:summary.rows,failures:failures.rows});
    }
`);
  const route=String.raw`
        if (req.method === 'POST' && url.pathname === '/api/customer/uploads/health-events') {
            if(process.env.PB_UPLOAD_HEALTH_ENABLED==='0')return sendJson(res,503,{error:'upload_health_disabled'});
            const reportOrigin=String(req.headers.origin||'');
            if(reportOrigin && (()=>{try{return new URL(reportOrigin).host!==req.headers.host}catch{return true}})())
                return sendJson(res,403,{error:'invalid_origin'});
            if(!String(req.headers['content-type']||'').startsWith('application/json'))
                return sendJson(res,415,{error:'json_required'});
            if(!PB1851allowUploadHealth(a.userId))return sendJson(res,429,{error:'upload_health_rate_limit'});
            let payload;
            try{payload=await bodyJson(req,12000);}
            catch{return sendJson(res,400,{error:'invalid_upload_health_body'});}
            try{
                const outcome=await recordUploadHealthEvents(pool,{
                    photographerId:a.userId,labId,events:payload?.events});
                return sendJson(res,202,outcome);
            }catch(error){
                if(error?.status>=400&&error?.status<500)
                    return sendJson(res,error.status,{error:error.message});
                throw error;
            }
        }
`;
  const customerAnchor="        if (req.method === 'POST' && url.pathname === '/api/customer/push/subscribe') {";
  server=once(server,customerAnchor,route+customerAnchor);
  const adminPage=String.raw`
        if(url.pathname==='/admin/upload-health' && req.method==='GET'){
            const actor=await auth(req);
            if(!requireRole(actor,'platform_admin'))return sendJson(res,403,{error:'forbidden'});
            res.setHeader('cache-control','no-store');
            return sendText(res,200,fs.readFileSync(path.join(DIST_ROOT,'api','upload-health.html'),'utf8'),'text/html; charset=utf-8');
        }
`;
  const pageAnchor="if(url.pathname==='/admin/error-monitor' && req.method==='GET'){";
  server=once(server,pageAnchor,adminPage+pageAnchor);
  fs.writeFileSync(serverFile,server);
}
// Observability client loads after R1850 error handler and before the bundled UI.
// Append to existing script tag, never monkey-patch the compiled application.
function visit(directory){
  for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
    const file=directory+'/'+entry.name;
    if(entry.isDirectory()){visit(file);continue;}
    if(!entry.name.endsWith('.html'))continue;
    let html=fs.readFileSync(file,'utf8');
    if(html.includes('photobridge-error-monitor-r1850.js')&&!html.includes('photobridge-upload-health-r1851.js')){
      html=html.replace(/(<script src="\/photobridge-error-monitor-r1850\.js[^"]*"><\/script>)/,
        '$1<script src="/photobridge-upload-health-r1851.js?rev='+encodeURIComponent(revision)+'"></script>');
      fs.writeFileSync(file,html);
    }
  }
}
visit('dist/web');
visit('dist/api');
const adminFile='dist/api/error-monitor.html';
let html=fs.readFileSync(adminFile,'utf8');
if(!html.includes('/admin/upload-health')){
  html=once(html,'</h1>','</h1><p><a href="/admin/upload-health">داشبورد سلامت آپلود عکس‌ها</a></p>');
  fs.writeFileSync(adminFile,html);
}
console.log('[R1851] authenticated nonblocking upload telemetry + admin Upload Health');
