import path from 'node:path';
import crypto from 'node:crypto';
const fail=(code,display,status=400)=>Object.assign(Error(code),{status,display});
export function normalizeStoragePath(value){
 const raw=String(value??'').trim().replace(/\//g,'\\');
 if(raw.length>240||!/^[A-Za-z]:\\/.test(raw))throw fail('storage_path_invalid','مسیر کامل یک پوشه روی هارد ویندوز را وارد کنید؛ مانند D:\\PhotoBridge\\Lab.');
 const parts=raw.slice(3).split('\\').filter(Boolean);
 if(!parts.length||parts.some(p=>p==='.'||p==='..'||/[<>:"|?*\x00-\x1f]/.test(p)||/[ .]$/.test(p)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)))throw fail('storage_path_invalid','یک پوشهٔ معتبر انتخاب کنید؛ ریشهٔ درایو یا مسیر نسبی مجاز نیست.');
 return raw[0].toUpperCase()+path.win32.normalize(raw).slice(1).replace(/\\$/,'');
}
export async function storageTargetRequest({pool,labId,deviceId,user,method,action,body={}}){
 if(user?.labRole!=='lab_admin')throw fail('lab_admin_required','این تنظیمات فقط برای مدیر لابراتوار است.',403);
 const publicTarget=row=>{const t=row.ui_preferences?.desktopStorageTarget;if(!t)return {configured:false};return {configured:true,path:t.path,revision:t.revision,active:Boolean(t.activeDeviceId&&row.primary_download_device_id===t.activeDeviceId),isThisDevice:Boolean(deviceId&&t.activeDeviceId===deviceId&&row.primary_download_device_id===deviceId),label:row.primary_download_device_label||null,activatedAt:t.activatedAt||null}};
 const select='SELECT ui_preferences,primary_download_device_id,primary_download_device_label FROM labs WHERE id=$1';
 if(action==='activate'&&method!=='POST'||action!=='activate'&&!['GET','PUT'].includes(method))throw fail('method_not_allowed','عملیات معتبر نیست.',405);
 if(method==='GET')return publicTarget((await pool.query(select,[labId])).rows[0]||{});
 if(!(['PUT','POST'].includes(method))||method==='POST'&&action!=='activate')throw fail('method_not_allowed','عملیات معتبر نیست.',405);
 const pathname=method==='PUT'?normalizeStoragePath(body.path):null;
 if(method==='POST'&&(!/^pblab-[a-zA-Z0-9-]{20,110}$/.test(deviceId||'')||typeof body.revision!=='string'))throw fail('native_device_required','فعال‌سازی باید در نسخهٔ جدید برنامهٔ ویندوز انجام شود.');
 const c=await pool.connect();try{await c.query('BEGIN');const row=(await c.query(select+' FOR UPDATE',[labId])).rows[0];if(!row)throw fail('lab_not_found','لابراتوار پیدا نشد.',404);const old=row.ui_preferences?.desktopStorageTarget;
 let target;if(method==='PUT'){
 if(old?.path===pathname){await c.query('COMMIT');return publicTarget(row)}
 target={path:pathname,revision:crypto.randomUUID(),updatedAt:new Date().toISOString()};
 await c.query("UPDATE labs SET ui_preferences=COALESCE(ui_preferences,'{}'::jsonb)||$2::jsonb,primary_download_device_id=NULL,primary_download_device_label=NULL,primary_download_device_registered_at=NULL,updated_at=now() WHERE id=$1",[labId,JSON.stringify({desktopStorageTarget:target})]);
 }else{
 if(!old||body.revision!==old.revision)throw fail('storage_target_changed','مسیر سایت تغییر کرده است؛ مسیر جدید را بازخوانی و دوباره فعال کنید.',409);
 if(row.primary_download_device_id&&row.primary_download_device_id!==deviceId&&body.force!==true)throw fail('primary_device_exists','سیستم دیگری فعال است؛ انتقال به این کامپیوتر نیاز به تأیید شما دارد.',409);
 target={...old,activeDeviceId:deviceId,activatedAt:new Date().toISOString()};const label=String(body.label||'PhotoBridge Lab').slice(0,120);
 await c.query("UPDATE labs SET ui_preferences=COALESCE(ui_preferences,'{}'::jsonb)||$2::jsonb,primary_download_device_id=$3,primary_download_device_label=$4,primary_download_device_registered_at=now(),updated_at=now() WHERE id=$1",[labId,JSON.stringify({desktopStorageTarget:target}),deviceId,label]);row.primary_download_device_id=deviceId;row.primary_download_device_label=label;
 }
 row.ui_preferences={...row.ui_preferences,desktopStorageTarget:target};if(method==='PUT'){row.primary_download_device_id=null;row.primary_download_device_label=null}await c.query('COMMIT');return publicTarget(row);
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{c.release()}
}
