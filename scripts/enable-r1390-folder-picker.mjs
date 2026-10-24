import fs from 'node:fs';
const file='dist/api/server.js';let s=fs.readFileSync(file,'utf8');
if(!s.includes('/* R1390 site folder picker */')){
 const anchor="        if(['/api/lab/storage-target','/api/lab/storage-target/activate','/api/lab/storage-target/hello'].includes(url.pathname)){";
 if(s.split(anchor).length!==2)throw Error('R1390 storage boundary changed');
 s="import {folderPickerRequest} from './lab-folder-picker.js';\n"+s.replace(anchor,`        /* R1390 site folder picker */
        if(url.pathname==='/api/lab/storage-picker'){
            try{const result=await folderPickerRequest({pool,labId,deviceId:requestDeviceId,user:a,method:req.method,body:req.method==='GET'?{}:await bodyJson(req,4096)});if(req.method!=='GET')await audit(a.userId,labId,'lab.storage_picker','lab',labId,{requestId:result.job?.id,state:result.job?.state}).catch(()=>{});return sendJson(res,200,result)}catch(e){if(e.status)return sendJson(res,e.status,{error:e.message,display:e.display});throw e}
        }
`+anchor);fs.writeFileSync(file,s);
}
const index='dist/web/index.html';let html=fs.readFileSync(index,'utf8').replace(/storageTarget=r1389/g,'storageTarget=r1390');fs.writeFileSync(index,html);
