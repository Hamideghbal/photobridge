import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8'),one=(s,a,b)=>{if(s.split(a).length!==2)throw Error('[R1801] anchor '+a.slice(0,70));return s.replace(a,b)};
let server=read('dist/api/server.js');
const route=String.raw`        /* R1801: alias settings bypass native offline business-document routing. */
        const latinFolderAlias=url.pathname.match(/^\/api\/lab\/photographer-folder-alias\/([0-9a-f-]{36})$/i);
        if(latinFolderAlias&&req.method==='PUT'){
            const b=await bodyJson(req);
            if(!b||typeof b!=='object'||Array.isArray(b)||!Object.hasOwn(b,'folderLatinName')||Object.keys(b).some(k=>!['folderLatinName','desktopOperationId'].includes(k))||b.desktopOperationId!=null&&(typeof b.desktopOperationId!=='string'||b.desktopOperationId.length>128))return sendJson(res,400,{error:'invalid_folder_alias_request'});
            const alias=await updateLabPhotographerFolderAlias({pool,labId,userId:latinFolderAlias[1],alias:b.folderLatinName});
            if(!alias.ok)return sendJson(res,alias.status,{error:alias.error});
            await audit(a.userId,labId,'customer.folder_latin_name_edit','user',latinFolderAlias[1],{folderLatinName:alias.name}).catch(()=>{});
            return sendJson(res,200,{ok:true,folderLatinName:alias.name});
        }
`;
server=one(server,"        const cm = url.pathname.match(/^\\/api\\/lab\\/customers\\/([0-9a-f-]+)$/);",route+"        const cm = url.pathname.match(/^\\/api\\/lab\\/customers\\/([0-9a-f-]+)$/);");
fs.writeFileSync('dist/api/server.js',server);execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const p=root+'/assets/index-UIRefine-v655-r84.js';let s=read(p),a=s.indexOf('function PB1769LatinFolderEdit('),b=s.indexOf('\n}',a);if(a<0||b<a)throw Error('Latin editor bounds');s=s.slice(0,a)+read('scripts/r1801-latin-folder-editor.js.txt').trim()+s.slice(b+2);fs.writeFileSync(p,s);execFileSync(process.execPath,['--check',p],{stdio:'inherit'});
 const h=root+'/index.html';fs.writeFileSync(h,read(h).replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u+'&latinSave=r1801'));
}
const root='dist/web/lab-desktop-ui',p=root+'/manifest.json',m=JSON.parse(read(p)),hash=v=>crypto.createHash('sha256').update(v).digest('hex');for(const name of ['assets/index-UIRefine-v655-r84.js','index.html'])m.files.find(f=>f.name===name).sha256=hash(fs.readFileSync(root+'/'+name));m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(p,JSON.stringify(m));
