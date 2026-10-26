'use strict';
// Capabilities are created only by the native multi-file picker, never renderer paths.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const fail=(code,message)=>Object.assign(Error(message),{code});
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const same=(a,b)=>a.dev===b.dev&&a.ino===b.ino&&a.size===b.size&&a.mtimeMs===b.mtimeMs;
function installIntakeSources(storage,selectFiles){
 const tickets=new Map(),identities=new Map();let picking=false;
 const operation=storage.operation.bind(storage),reset=storage.reset.bind(storage);
 const check=t=>{storage.checkAccount(t.account);if(t.generation!==generation)throw fail('source_expired','انتخاب عکس منقضی شده است؛ دوباره انتخاب کنید.');};let generation=0;
 async function current(t){check(t);const real=await fs.realpath(t.path),stat=await fs.lstat(t.path);if(real!==t.path||stat.isSymbolicLink()||!stat.isFile()||!same(stat,t.stat))throw fail('source_changed','فایل مبدأ پس از انتخاب تغییر کرده است.');check(t);return stat;}
 async function bytes(t){await current(t);const value=await fs.readFile(t.path);await current(t);if(hash(value)!==t.hash)throw fail('source_changed','فایل مبدأ پس از انتخاب تغییر کرده است.');return value;}
 storage.operation=async(action,payload={})=>{
  if(!action.startsWith('intake-'))return operation(action,payload);
  if(action==='intake-pick'){
   const account=storage.account(),epoch=generation;if(picking)throw fail('picker_busy','پنجرهٔ انتخاب عکس باز است.');picking=true;
   try{const result=await selectFiles();storage.checkAccount(account);if(epoch!==generation)throw fail('source_expired','انتخاب عکس منقضی شده است.');if(result.canceled)return {canceled:true};
    let root;try{root=await storage.record()}catch(e){if(e.code!=='folder_not_selected')throw e;}const picked=[];for(const input of result.filePaths||[]){if(!/\.(jpe?g|png|tiff?|webp)$/i.test(input))continue;const candidate=path.resolve(input),real=await fs.realpath(candidate),stat=await fs.lstat(candidate);if(real!==candidate||stat.isSymbolicLink()||!stat.isFile())throw fail('unsafe_source','فقط فایل عکس واقعی را انتخاب کنید.');await fs.access(real,require('node:fs').constants.R_OK);const key=account+'\0'+real;let t=identities.get(key);if(!t||!same(stat,t.stat)){const value=await fs.readFile(real);if(!same(stat,await fs.lstat(real)))throw fail('source_changed','فایل مبدأ تغییر کرده است.');t={id:crypto.randomUUID(),path:real,account,generation,stat,hash:hash(value)};}storage.checkAccount(account);if(epoch!==generation)throw fail('source_expired','انتخاب عکس منقضی شده است.');const relative=root&&path.relative(root.path,t.path);t.rootIdentity=relative&&!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)?{rootId:root.id,parts:relative.split(path.sep)}:{};picked.push([key,t]);}
    if(tickets.size+picked.filter(([,t])=>!tickets.has(t.id)).length>2000)throw fail('source_limit','تعداد عکس‌های انتخاب‌شده زیاد است؛ فرم را ببندید و دوباره باز کنید.');
    for(const[key,t]of picked){tickets.set(t.id,t);identities.set(key,t);}return {files:picked.map(([,t])=>({sourceId:t.id,kind:'file',name:path.basename(t.path),...t.rootIdentity}))};
   }finally{picking=false;}
  }
  const t=tickets.get(payload.sourceId);if(!t)throw fail('source_expired','عکس را دوباره انتخاب کنید.');await current(t);
  if(action==='intake-permission')return 'granted';
  if(action==='intake-stat')return {size:t.stat.size,lastModified:t.stat.mtimeMs};
  if(action==='intake-read'){const offset=payload.offset,length=payload.length;if(!Number.isSafeInteger(offset)||offset<0||!Number.isInteger(length)||length<1||length>1024*1024)throw fail('invalid_read','اندازهٔ خواندن معتبر نیست.');const file=await fs.open(t.path,require('node:fs').constants.O_RDONLY|(require('node:fs').constants.O_NOFOLLOW||0));try{const buffer=Buffer.alloc(length),result=await file.read(buffer,0,length,offset);await current(t);return new Uint8Array(buffer.subarray(0,result.bytesRead));}finally{await file.close();}}
  if(action==='intake-remove'){await bytes(t);check(t);await fs.unlink(t.path);tickets.delete(t.id);identities.delete(t.account+'\0'+t.path);return true;}
  throw fail('invalid_operation','عملیات عکس معتبر نیست.');
 };
 storage.reset=async()=>{generation++;tickets.clear();identities.clear();await reset();};
 return storage;
}
module.exports={installIntakeSources};
