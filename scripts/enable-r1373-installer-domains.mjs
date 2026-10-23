import fs from 'node:fs';
const file='dist/api/server.js';let s=fs.readFileSync(file,'utf8');
if(!s.includes('/* PB1373 installer stream:')){
 s="import {serveLabInstaller} from './lab-installer-download.js';\nimport {handleLabDomainRequests} from './lab-domain-requests.js';\n"+s;
 const anchor="if (release?.objectKey && storageConfigured) {\n                try { downloadUrl = await storagePresign('download', release.objectKey); source = 'admin-upload'; } catch { downloadUrl = null; }\n            }";
 if(s.split(anchor).length!==2)throw Error('R1373 changed installer download route');
 s=s.replace(anchor,`/* PB1373 installer stream: same S3 client as verified upload; no public signed-host redirect. */
            if(release?.objectKey&&storageConfigured)return await serveLabInstaller(req,res,url,release,{stat:storageStat,getObject:(key,range)=>s3.send(new GetObjectCommand({Bucket:S3_BUCKET,Key:key,...(range?{Range:range}:{})})),sendJson});`);
 const lab='if(await handleLabOptionalFeatures({req,res,url,a,pool,bodyJson,sendJson,audit,publicOrigin:new URL(PUBLIC_APP_URL).origin}))return;';
 if(s.split(lab).length!==3)throw Error('R1373 changed lab features router');
 s=s.slice(0,s.lastIndexOf(lab))+s.slice(s.lastIndexOf(lab)).replace(lab,lab+'\n        if(await handleLabDomainRequests({req,res,url,a,pool,bodyJson,sendJson,audit,publicOrigin:new URL(PUBLIC_APP_URL).origin}))return;');
 const admin="if(url.pathname.startsWith('/api/admin/labs/')&&url.pathname.endsWith('/optional-features')){";
 if(!s.includes(admin))throw Error('R1373 changed admin router');
 s=s.replace(admin,"if(url.pathname.startsWith('/api/admin/labs/')&&url.pathname.includes('/domain-requests')){if(await handleLabDomainRequests({req,res,url,a,pool,bodyJson,sendJson,audit,publicOrigin:new URL(PUBLIC_APP_URL).origin}))return;}\n    "+admin);
 fs.writeFileSync(file,s);
}
const path='dist/web/index.html';let html=fs.readFileSync(path,'utf8');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&domainRequest=')?u.replace(/&domainRequest=[^&"']*/g,'&domainRequest=r1373'):u+'&domainRequest=r1373');fs.writeFileSync(path,html);
