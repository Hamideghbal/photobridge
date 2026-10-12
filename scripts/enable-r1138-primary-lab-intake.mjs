import fs from 'node:fs';
const bundlePath='dist/web/assets/index-UIRefine-v655-r84.js';
let bundle=fs.readFileSync(bundlePath,'utf8');
if(!bundle.includes('/* PB1138 canonical lab storage bridge */')){
 const anchor='async function tl(t,a)';
 if(!bundle.includes(anchor))throw Error('Canonical laboratory storage functions not found');
 const bridge=`/* PB1138 canonical lab storage bridge */window.pbLabLocalIntakeStorage={deviceId:()=>localStorage.getItem(Mf)||"",root:qs,permission:Vs,request:Me,fileName:Ya,saveResume:hr,target:async(root,detail,file)=>{const order=detail.order,date=order.downloaded_at?new Date(order.downloaded_at):order._local_download_started_at?new Date(order._local_download_started_at):new Date,day=Ic(date),dateDir=await Hl(root,day),customerDir=await Hl(dateDir,Tg(order)),dir=await Hl(customerDir,Uy(detail,file));return{root,dir,day}},write:async(dir,name,blob)=>{const handle=await dir.getFileHandle(Ya(name,"file"),{create:true}),writer=await handle.createWritable();try{await writer.write(blob);await writer.close()}catch(error){try{await writer.abort()}catch{}throw error}const saved=await handle.getFile();if(saved.size!==blob.size)throw Error("local_copy_size_mismatch");return{name:handle.name,bytes:saved.size}}};`;
 bundle=bundle.replace(anchor,bridge+anchor);
 fs.writeFileSync(bundlePath,bundle);
}
const serverPath='dist/api/server.js';let server=fs.readFileSync(serverPath,'utf8');
if(!server.includes('// PB1138 primary-only local intake')){
 const anchor="        const requestDeviceId = String(req.headers['x-photobridge-device-id'] || '').trim();";
 if(!server.includes(anchor))throw Error('Lab request device scope missing');
 server=server.replace(anchor,anchor+`
        // PB1138 primary-only local intake: use the same device binding as normal downloads.
        const requireLocalIntakePrimary = async (db = pool) => {
            const q = await db.query('SELECT primary_download_device_id FROM labs WHERE id=$1 FOR SHARE', [labId]);
            const primary = q.rows[0]?.primary_download_device_id;
            if (!primary) { sendJson(res, 409, { error: 'download_device_not_registered' }); return false; }
            if (!requestDeviceId || requestDeviceId !== primary) { sendJson(res, 403, { error: 'not_primary_download_device' }); return false; }
            return true;
        };`);
 const create="        if (req.method === 'POST' && url.pathname === '/api/lab/delegated-orders') {\n            const b = await bodyJson(req);";
 if(!server.includes(create))throw Error('Delegated create handler missing');
 server=server.replace(create,create+"\n            if (b.localOnly === true && !await requireLocalIntakePrimary()) return;");
 const old=`            const deviceLocal = b.localOnly === true && req.headers['x-photobridge-desktop-local-file'] === '1'
                && /^pbwin-[0-9a-f-]{36}$/i.test(requestDeviceId);
            if (b.localOnly && !deviceLocal) return sendJson(res, 403, { error: 'desktop_local_file_required' });`;
 if(!server.includes(old))throw Error('Local file guard missing');
 server=server.replace(old,`            const deviceLocal = b.localOnly === true;
            if (deviceLocal && !await requireLocalIntakePrimary()) return;`);
 const files=`SELECT id,print_size_id,chassis,frame,original_state FROM order_files
                    WHERE order_id=$1 AND lab_id=$2`;
 if(!server.includes(files))throw Error('Delegated submit file query missing');
 server=server.replace(files,`SELECT id,print_size_id,chassis,frame,original_state,object_key FROM order_files
                    WHERE order_id=$1 AND lab_id=$2`);
 const before='                if (fq.rows.some(f => f.original_state !== \'active\') || fq.rowCount === 0) {';
 if(!server.includes(before))throw Error('Delegated submit readiness guard missing');
 server=server.replace(before,`                if (fq.rows.some(f => String(f.object_key || '').startsWith('client-local-recovery/')) && !await requireLocalIntakePrimary(c)) {
                    await c.query('ROLLBACK'); return;
                }
`+before);
 fs.writeFileSync(serverPath,server);
}
for(const page of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(page,'utf8');
 if(page==='dist/web/index.html')html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?v=)[^"']+/g,'$1r1138');
 html=html.replace(/(photobridge-r1137-lab-local-intake\.(?:css|js)\?v=)[^"']+/g,'$1r1141');
 fs.writeFileSync(page,html);
}
