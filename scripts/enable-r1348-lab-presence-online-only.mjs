import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Restore the native source archive before applying this integration.
// This never changes, deletes or replays any existing outbox records.
export function applyPresenceQueueFix(root=process.cwd()) {
  const dir=path.join(root,'apps/lab-desktop');
  const hostFile=path.join(dir,'host.cjs');
  const storeFile=path.join(dir,'store.cjs');
  if(!fs.existsSync(hostFile)||!fs.existsSync(storeFile))throw Error('Restore the laboratory Windows sources first');
  const hostOriginal=fs.readFileSync(hostFile,'utf8');
  const storeOriginal=fs.readFileSync(storeFile,'utf8');
  let host=hostOriginal,store=storeOriginal;
  function patch(src,anchor,replacement,label){
    if(src.includes(replacement))return src;
    if(src.split(anchor).length!==2)throw Error('R1348 unexpected source anchor: '+label);
    return src.replace(anchor,replacement);
  }
  const policy='const ONLINE_ONLY_POST=/^\\/api\\/lab\\/print-alert\\/presence$/;';
  host=patch(host,'const OFFLINE_BLOCK=',policy+'\nconst OFFLINE_BLOCK=','presence classification');
  const pre="contentType.startsWith('multipart/form-data')||OFFLINE_BLOCK.test(url.pathname)";
  const post=pre+"||(req.method==='POST'&&ONLINE_ONLY_POST.test(url.pathname))";
  host=patch(host,pre,post,'online only path');
  const originalQuery="SELECT * FROM outbox WHERE lab=? AND state IN ('pending','conflict') ORDER BY seq";
  const filter=" AND NOT (method='POST' AND (url='/api/lab/print-alert/presence' OR url LIKE '/api/lab/print-alert/presence?%'))";
  const filteredQuery="SELECT * FROM outbox WHERE lab=? AND state IN ('pending','conflict')"+filter+' ORDER BY seq';
  store=patch(store,originalQuery,filteredQuery,'non-business presence filtering');
  const from="status(){const rows=this.rows();return{labId:";
  const to="status(){const rows=this.rows();const ignoredTelemetry=this.db.prepare(\"SELECT COUNT(*) AS count FROM outbox WHERE lab=? AND state IN ('pending','conflict') AND method='POST' AND (url='/api/lab/print-alert/presence' OR url LIKE '/api/lab/print-alert/presence?%')\").get(this.get('labId')||'').count;return{ignoredTelemetry,labId:";
  store=patch(store,from,to,'visibility of preserved telemetry');
  // Verify every anchor before touching either source file.
  if(host!==hostOriginal)fs.writeFileSync(hostFile,host);
  if(store!==storeOriginal)fs.writeFileSync(storeFile,store);
  console.log('[R1348] Presence heartbeat uses online-only delivery. Legacy presence outbox records remain untouched and are excluded from active sync.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))applyPresenceQueueFix();
