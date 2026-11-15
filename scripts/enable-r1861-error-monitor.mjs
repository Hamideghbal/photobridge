// R1861 is additive to R1850-R1852 and runs before final HTML writers.
// It changes only the administrator report and introduces a read-only, role-gated API.
import fs from 'node:fs';
const serverFile='dist/api/server.js';
const routeAnchor="    if(url.pathname==='/api/admin/error-incidents' && req.method==='GET'){";
const importLine="import {getDailyErrorReport} from './error-dashboard-data.mjs';\n";
fs.copyFileSync('scripts/r1861-error-dashboard-data.mjs','dist/api/error-dashboard-data.mjs');
fs.copyFileSync('scripts/r1861-error-admin.html','dist/api/error-monitor.html');
let server=fs.readFileSync(serverFile,'utf8');
if(!server.includes("url.pathname==='/api/admin/error-daily'")){
  if(server.split(routeAnchor).length!==2)throw Error('R1861 route anchor mismatch');
  const route=`
    // R1861: read-only aggregated telemetry, only for the existing platform_admin role.
    if(url.pathname==='/api/admin/error-daily' && req.method==='GET'){
      const actor=await auth(req);
      if(!requireRole(actor,'platform_admin'))return sendJson(res,403,{error:'forbidden'});
      try {
        const report=await getDailyErrorReport(pool,Object.fromEntries(url.searchParams));
        res.setHeader('cache-control','no-store');
        return sendJson(res,200,report);
      }catch(error){
        if(error?.status===400)return sendJson(res,400,{error:error.message});
        throw error;
      }
    }
`;
  server=importLine+server.replace(routeAnchor,route+routeAnchor);
  fs.writeFileSync(serverFile,server);
}
console.log('[R1861] admin-only daily lab/photographer error details and accessible responsive dashboard');
