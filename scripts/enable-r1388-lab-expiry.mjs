import fs from 'node:fs';
const file='dist/api/server.js';let s=fs.readFileSync(file,'utf8');
if(!s.includes('/* R1388 lab write access */')){
 const anchor='        const labId = a.labId;';
 if(s.split(anchor).length!==2)throw Error('R1388 lab boundary changed');
 s="import {labWriteAccess,labWriteExempt} from './lab-write-access.js';\n"+s.replace(anchor,anchor+`
        /* R1388 lab write access */
        const writeLab=(await pool.query('SELECT active,suspended,active_from,active_until FROM labs WHERE id=$1',[labId])).rows[0];
        const writeAccess=labWriteAccess(writeLab);
        if(req.method==='GET'&&url.pathname==='/api/lab/write-access')return sendJson(res,200,{labId,serverNow:new Date().toISOString(),...writeAccess,activeFrom:writeLab?.active_from||null,activeUntil:writeLab?.active_until||null});
        if(!labWriteExempt(req.method,url.pathname)&&!writeAccess.allowed)return sendJson(res,403,{error:writeAccess.reason,message:'اعتبار استفاده از برنامه فعال نیست؛ مشاهده و چاپ سوابق در دسترس است. برای کار جدید اعتبار را تمدید کنید.'});
`);fs.writeFileSync(file,s);
}
