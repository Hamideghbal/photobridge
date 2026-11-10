// R1753 — lab web deletion must invalidate Windows Lab order queues immediately.
// A cancelled order remains in accounting for audit; we only refresh visible lists.
import fs from 'node:fs';
import crypto from 'node:crypto';
const marker='/* PB1753 lab deletion queue sync */';
const once=(src,needle,replacement,label)=>{
  const hits=src.split(needle).length-1;
  if(hits!==1)throw Error('[R1753] '+label+' anchor count '+hits);
  return src.replace(needle,replacement);
};
const serverPath='dist/api/server.js';
let server=fs.readFileSync(serverPath,'utf8');
if(!server.includes(marker)){
  const deletedAnchor="            await Promise.all(storageKeys.map(key => deleteStoredKeyBestEffort(key).catch(() => false)));\n            await audit(a.userId, labId, 'order.lab_delete_before_download'";
  const emit=`            // The DB transaction has committed: tell ALL open Lab clients to drop the old card.
            // Do not publish when validation fails or the transaction rolls back.
            publishLabEvent(labId, 'order_cancelled', { orderId, number: cancelled?.number,
                status: 'cancelled', source: 'lab_delete',
                updatedAt: cancelled?.updated_at || new Date().toISOString() });
            await Promise.all(storageKeys.map(key => deleteStoredKeyBestEffort(key).catch(() => false)));
            await audit(a.userId, labId, 'order.lab_delete_before_download'`;
  server=once(server,deletedAnchor,emit,'post-commit Lab delete event');
  const notification="    if (event === 'order_cancelled')\n        return { title: 'سفارش لغو شد', message: ";
  // Two order_cancelled notification definitions exist; only the Lab copy changes.
  if(server.split(notification).length-1!==1)throw Error('[R1753] lab notification copy changed');
  server=server.replace(notification,
    "    if (event === 'order_cancelled' && data?.source === 'lab_delete')\n"+
    "        return { title: 'سفارش حذف شد', message: \`سفارش\${notificationOrderNo(data)} توسط لابراتوار از صف حذف شد.\` };\n"+
    notification);
  server+='\n'+marker+'\n';
  fs.writeFileSync(serverPath,server);
}
const bundle='assets/index-UIRefine-v655-r84.js';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const jsPath=root+'/'+bundle,htmlPath=root+'/index.html';
  if(!fs.existsSync(jsPath)||!fs.existsSync(htmlPath))throw Error('[R1753] Lab package missing: '+root);
  let ui=fs.readFileSync(jsPath,'utf8');
  if(!ui.includes('/* PB1753 synced lab deletes */')){
    const oldCancel='N==="order_cancelled"&&(Fe(),W(ve=>ve+1),M({...pe,customerCancelled:!0}),setTimeout(()=>M(null),6500))';
    const newCancel='N==="order_cancelled"&&(Fe(),W(ve=>ve+1),pe?.source!=="lab_delete"&&(M({...pe,customerCancelled:!0}),setTimeout(()=>M(null),6500)))';
    ui=once(ui,oldCancel,newCancel,root+' prevent incorrect new-order toast');
    // SSE 'ready' is delivered after every connect/reconnect, including lost network sessions.
    ui=once(ui,'N!=="ready"&&ie(ve=>ve+1),N==="lab_disabled"',
      'N!=="ready"&&ie(ve=>ve+1),N==="ready"&&W(ve=>ve+1),N==="lab_disabled"',root+' reconnect revalidation');
    // Revalidate after a hidden/disconnected native desktop returns to foreground.
    const oldLoad='x.useEffect(()=>{ye()},[a]);const Ye=';
    const newLoad='x.useEffect(()=>{ye()},[a]);x.useEffect(()=>{let last=0;const resume=()=>{const now=Date.now();if(document.visibilityState==="hidden"||now-last<2500)return;last=now;ye().catch(()=>{})};window.addEventListener("focus",resume);document.addEventListener("visibilitychange",resume);return()=>{window.removeEventListener("focus",resume);document.removeEventListener("visibilitychange",resume)}},[a,o]);const Ye=';
    ui=once(ui,oldLoad,newLoad,root+' foreground revalidation');
    ui+='\n/* PB1753 synced lab deletes */\n';
    fs.writeFileSync(jsPath,ui);
  }
  let html=fs.readFileSync(htmlPath,'utf8');
  const re=/assets\/index-UIRefine-v655-r84\.js\?[^"'<>\s]*/g;
  const matches=[...html.matchAll(re)];
  if(matches.length!==1)throw Error('[R1753] module cache key count '+matches.length+' in '+root);
  html=html.replace(re,url=>url.includes('&orderDelete=r1753')?url:url+'&orderDelete=r1753');
  fs.writeFileSync(htmlPath,html);
  const manifestPath=root+'/manifest.json';
  if(fs.existsSync(manifestPath)){
    const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
    if(manifest.channel!=='lab'||!Array.isArray(manifest.files))throw Error('[R1753] Lab manifest invalid');
    for(const name of ['index.html',bundle]){
      const item=manifest.files.find(f=>f.name===name);
      if(!item)throw Error('[R1753] missing Lab manifest entry '+name);
      item.sha256=sha(fs.readFileSync(root+'/'+name));
    }
    manifest.build=sha(Buffer.from(JSON.stringify(manifest.files)));
    manifest.generatedAt=new Date().toISOString();
    fs.writeFileSync(manifestPath,JSON.stringify(manifest));
  }
}
console.log('[R1753] Lab cancellation propagates to every live Windows/web queue; reconnect/foreground refresh installed.');
