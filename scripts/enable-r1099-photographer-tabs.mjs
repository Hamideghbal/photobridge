import fs from 'node:fs';
const serverPath='dist/api/server.js';let server=fs.readFileSync(serverPath,'utf8');
const imp="import { handlePhotographerTabSettings } from './photographer-tab-settings.js';";
if(!server.includes(imp))server=imp+'\n'+server;
const marker='/* PB_R1099_PHOTOGRAPHER_TABS */';
if(!server.includes(marker)){
 const anchor="    const a = await auth(req);\n    if (url.pathname === '/api/admin/maintenance' && req.method === 'GET') {";
 if(server.split(anchor).length-1!==1)throw Error('Photographer settings auth anchor missing');
 server=server.replace(anchor,"    const a = await auth(req);\n    "+marker+"\n    if (await handlePhotographerTabSettings({req,res,url,a,pool,requireRole,bodyJson,sendJson,audit})) return;\n    if (url.pathname === '/api/admin/maintenance' && req.method === 'GET') {");
}
fs.writeFileSync(serverPath,server);
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(file,'utf8');const tag='<script defer src="/photobridge-r1099-photographer-tabs.js?v=1099"></script>';
 if(!html.includes(tag)){const at=html.lastIndexOf('</body>');if(at<0)throw Error('Photographer page body missing');html=html.slice(0,at)+tag+'\n'+html.slice(at);}
 if(html.split(tag).length-1!==1)throw Error('Photographer tab asset duplicate');
 fs.writeFileSync(file,html);
}
console.log('[PhotoBridge R1099] independent photographer navigation settings prepared');
