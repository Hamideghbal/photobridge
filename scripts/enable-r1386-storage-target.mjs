import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1386 changed anchor '+a.slice(0,100));return s.replace(a,b)};
const file='dist/api/server.js';let server=fs.readFileSync(file,'utf8');if(!server.includes('/* PB1386 storage target */')){
 server="import {storageTargetRequest} from './lab-storage-target.js';\n/* PB1386 storage target */\n"+server;
 const anchor="        if (req.method === 'GET' && url.pathname === '/api/lab/download-device') {";
 server=once(server,anchor,`        if(['/api/lab/storage-target','/api/lab/storage-target/activate','/api/lab/storage-target/hello'].includes(url.pathname)){
            try{const target=await storageTargetRequest({pool,labId,deviceId:requestDeviceId,user:a,method:req.method,action:url.pathname.endsWith('/activate')?'activate':url.pathname.endsWith('/hello')?'hello':'settings',body:req.method==='GET'?{}:await bodyJson(req,4096)});if(req.method!=='GET')await audit(a.userId,labId,'lab.storage_target.'+(url.pathname.endsWith('/activate')?'activate':'configure'),'lab',labId,{revision:target.revision}).catch(()=>{});return sendJson(res,200,target)}catch(e){if(e.status)return sendJson(res,e.status,{error:e.message,display:e.display});throw e}
        }
`+anchor);server=once(server,'SELECT primary_download_device_id,primary_download_device_label,primary_download_device_registered_at FROM labs WHERE id=$1 FOR UPDATE','SELECT ui_preferences,primary_download_device_id,primary_download_device_label,primary_download_device_registered_at FROM labs WHERE id=$1 FOR UPDATE');
 server=once(server,'const current = q.rows[0] || {};',"const current = q.rows[0] || {};if(current.ui_preferences?.desktopStorageTarget){await c.query('ROLLBACK');return sendJson(res,409,{error:'storage_managed_by_site',message:'سیستم اصلی و مسیر فقط در سایت تعیین می‌شوند.'})}");fs.writeFileSync(file,server);
}
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(bundle,'utf8');if(!ui.includes('/* PB1386 storage panel */')){ui=once(ui,'function Xj(){','function PB1386RetiredStoragePanel(){');ui+='\n/* PB1386 storage panel */\nfunction Xj(){return e.jsx(PB1386StoragePanel,{})}\n'+fs.readFileSync('scripts/r1386-storage-panel.js','utf8');fs.writeFileSync(bundle,ui)}
const index='dist/web/index.html';let html=fs.readFileSync(index,'utf8');if(!html.includes('/photobridge-r1386-storage.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1386-storage.css?v=r1386">\n</head>');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.replace(/&storageTarget=[^&"']*/g,'')+'&storageTarget=r1389');fs.writeFileSync(index,html);

