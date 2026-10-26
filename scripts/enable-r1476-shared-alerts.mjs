import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1476 anchor '+a.slice(0,80));return s.replace(a,b)};
let server=fs.readFileSync('dist/api/server.js','utf8');
if(!server.includes('/* PB1476 shared alerts */')){
 server="import {labChatRead} from './lab-chat-read.js';\n"+server;
 server=once(server,"        if (req.method === 'GET' && url.pathname === '/api/lab/notifications') {",`        /* PB1476 shared alerts */
        if (url.pathname === '/api/lab/notifications/chat-read' && ['GET','POST'].includes(req.method)) {
            const result=await labChatRead(pool,labId,a.userId,req.method==='POST'?await bodyJson(req):null);
            return sendJson(res,result.error?400:200,result);
        }
        if (req.method === 'GET' && url.pathname === '/api/lab/notifications') {`);
 const start=server.indexOf("        if (req.method === 'GET' && url.pathname === '/api/lab/notifications') {"),end=server.indexOf("        if (req.method === 'POST' && url.pathname === '/api/lab/notifications/read')",start);
 let block=server.slice(start,end);
 block=once(block,'return sendJson(res, 200, { notifications: items.rows, unread:',`const pending=String(url.searchParams.get('pending')||'').split(',').filter(id=>/^[0-9a-f-]{36}$/i.test(id)).slice(0,200);
            const read=pending.length?await pool.query('SELECT id FROM system_notifications WHERE recipient_lab_id=$1 AND id=ANY($2::uuid[]) AND read_at IS NOT NULL',[labId,pending]):{rows:[]};
            return sendJson(res, 200, { readIds:read.rows.map(n=>n.id),notifications: items.rows, unread:`);
 server=server.slice(0,start)+block+server.slice(end);
 fs.writeFileSync('dist/api/server.js',server);
}
const p='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(p,'utf8');
if(!ui.includes('/* PB1476 shared chat read */')){
 ui=once(ui,"pbMark=(id,messages)=>{const prior=",`pbMark=(id,messages)=>{if(t==='lab')void Me('/api/lab/notifications/chat-read',{method:'POST',body:JSON.stringify({thread:id,ids:messages.filter(m=>m.sender_id!==a.user.userId).map(m=>m.id)})}).catch(()=>{});const prior=`);
 // Load server cursors before computing badges; never move a local cursor backwards.
 const anchor="$=async()=>{const seq=++pbLive.current.badge,ie=B();";
 ui=once(ui,anchor,anchor+`if(t==='lab'){try{const data=await Me('/api/lab/notifications/chat-read');if(!pbLive.current.alive||pbLive.current.account!==pbAccount||seq!==pbLive.current.badge)return;const next={...pbLive.current.seen};for(const [id,stamp] of Object.entries(data.seen||{}))next[id]=Math.max(Number(next[id]||0),Number(stamp)||0);pbLive.current.seen=next;pbSetSeen(next);}catch{}}`);
 ui+='\n/* PB1476 shared chat read */\n';fs.writeFileSync(p,ui);
}
for(const p of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let s=fs.readFileSync(p,'utf8');s=s.replace(/(index-UIRefine-v655-r84\.js\?[^"'\s]*)/g,u=>u.includes('sharedAlerts=r1476')?u:u+'&sharedAlerts=r1476');fs.writeFileSync(p,s);}
