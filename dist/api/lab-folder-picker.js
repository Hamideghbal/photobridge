import crypto from 'node:crypto';
import {normalizeStoragePath} from './lab-storage-target.js';
const fail=(code,display,status=409)=>Object.assign(Error(code),{status,display});
const native=id=>/^pblab-[a-zA-Z0-9-]{20,110}$/.test(id||'');
const terminal=new Set(['completed','cancelled','failed']);
export async function folderPickerRequest({pool,labId,deviceId,user,method,body={},now=Date.now()}){
 if(user?.labRole!=='lab_admin')throw fail('lab_admin_required','این تنظیمات فقط برای مدیر لابراتوار است.',403);
 const select='SELECT ui_preferences,primary_download_device_id,primary_download_device_label FROM labs WHERE id=$1';
 const obsolete=(job,row)=>job?.state==='activating'&&(row.ui_preferences?.desktopStorageTarget?.revision!==job.revision||row.primary_download_device_id!==job.deviceId);
 const view=(job,row)=>!job?null:{id:job.id,deviceId:job.deviceId,state:row&&obsolete(job,row)?'failed':now>=job.expiresAt&&!terminal.has(job.state)&&job.state!=='activating'?'expired':job.state,expiresAt:job.expiresAt,revision:job.revision,path:job.state==='activating'||job.state==='completed'?job.path:undefined,error:row&&obsolete(job,row)?'تنظیمات سایت تغییر کرده است؛ دوباره پوشه را انتخاب کنید.':job.error||null};
 if(method==='GET'){const row=(await pool.query(select,[labId])).rows[0],job=row?.ui_preferences?.desktopFolderPicker;return {job:native(deviceId)&&job?.deviceId!==deviceId?null:view(job,row)}}
 if(method!=='POST')throw fail('method_not_allowed','عملیات معتبر نیست.',405);
 const action=body.action,c=await pool.connect();let result;
 try{await c.query('BEGIN');const row=(await c.query(select+' FOR UPDATE',[labId])).rows[0];if(!row)throw fail('lab_not_found','لابراتوار پیدا نشد.',404);const prefs=row.ui_preferences||{},old=prefs.desktopFolderPicker,current=prefs.desktopStorageTarget;let job=old;
 if(action==='start'){
  const chosen=String(body.deviceId||'');if(!native(chosen)||!prefs.desktopStorageDevices?.[chosen]?.folderPicker)throw fail('picker_upgrade_required','برنامهٔ ویندوز ۱.۰.۲۶ را روی همین کامپیوتر نصب و باز کنید، سپس بازخوانی را بزنید.');
  if(old&&!terminal.has(old.state)&&!obsolete(old,row)&&now<old.expiresAt)throw fail('picker_busy','یک پنجرهٔ انتخاب پوشه در انتظار است؛ ابتدا آن را ببندید یا لغو کنید.');
  job={id:crypto.randomUUID(),deviceId:chosen,state:'pending',expiresAt:now+300000,baseRevision:current?.revision||null};
 }else{
  if(!old||body.id!==old.id)throw fail('picker_request_changed','درخواست انتخاب پوشه تغییر کرده است.');
  if(action==='cancel'){if(!terminal.has(old.state)&&old.state!=='activating')job={...old,state:'cancelled'};else throw fail('picker_already_applied','انتخاب قبلاً اعمال شده یا پایان یافته است؛ بازخوانی کنید.');}
  else{
   if(!native(deviceId)||deviceId!==old.deviceId)throw fail('not_selected_storage_device','این درخواست برای کامپیوتر دیگری است.',403);
   if(now>=old.expiresAt&&old.state!=='activating')throw fail('picker_expired','مهلت انتخاب پوشه تمام شده است؛ دوباره انتخاب کنید.');
   if(action==='claim'){if(old.state!=='pending')throw fail('picker_already_claimed','درخواست قبلاً دریافت شده است.');job={...old,state:'claimed'};}
   else if(action==='fail'){if(!['claimed','pending'].includes(old.state))throw fail('picker_request_changed','وضعیت درخواست تغییر کرده است.');job={...old,state:body.cancelled===true?'cancelled':'failed',error:body.cancelled===true?null:'پوشه انتخاب یا تأیید نشد؛ اتصال هارد و مجوز نوشتن را بررسی کنید.'};}
   else if(action==='finish'){
    if(old.state!=='claimed'||(current?.revision||null)!==old.baseRevision)throw fail('storage_target_changed','تنظیمات سایت حین انتخاب پوشه تغییر کرده است؛ دوباره انتخاب کنید.');
    const folder=normalizeStoragePath(body.path),revision=crypto.randomUUID(),date=new Date(now).toISOString(),label=String(prefs.desktopStorageDevices?.[deviceId]?.label||'PhotoBridge Lab');
    const target={path:folder,revision,selectedDeviceId:deviceId,activeDeviceId:deviceId,updatedAt:date,activatedAt:date};
    job={...old,state:'activating',path:folder,revision};
    await c.query("UPDATE labs SET ui_preferences=COALESCE(ui_preferences,'{}'::jsonb)||$2::jsonb,primary_download_device_id=$3,primary_download_device_label=$4,primary_download_device_registered_at=now(),updated_at=now() WHERE id=$1",[labId,JSON.stringify({desktopStorageTarget:target,desktopFolderPicker:job}),deviceId,label]);
    await c.query('COMMIT');return {job:view(job)};
   }else if(action==='ack'){
    if(old.state!=='activating'||current?.revision!==old.revision||current?.path!==old.path||current?.selectedDeviceId!==deviceId||row.primary_download_device_id!==deviceId)throw fail('storage_target_changed','مسیر یا سیستم اصلی تغییر کرده است.');job={...old,state:'completed'};
   }else throw fail('invalid_picker_action','عملیات معتبر نیست.',400);
  }
 }
 await c.query("UPDATE labs SET ui_preferences=COALESCE(ui_preferences,'{}'::jsonb)||$2::jsonb,updated_at=now() WHERE id=$1",[labId,JSON.stringify({desktopFolderPicker:job})]);await c.query('COMMIT');result={job:view(job)};
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{c.release()}
 return result;
}
