import {pairedTarget,selectStoragePair,pairFor} from './lab-storage-pair.js';
import path from 'node:path';
import crypto from 'node:crypto';
const fail=(code,display,status=400)=>Object.assign(Error(code),{status,display});
export function normalizeStoragePath(value){const raw=String(value??'').trim().replace(/\//g,'\\'),parts=raw.slice(3).split('\\').filter(Boolean);if(raw.length>240||!/^[A-Za-z]:\\/.test(raw)||!parts.length||parts.some(p=>p==='.'||p==='..'||/[<>:"|?*\x00-\x1f]/.test(p)||/[ .]$/.test(p)||/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)))throw fail('storage_path_invalid','مسیر کامل یک پوشهٔ موجود روی هارد ویندوز را وارد کنید؛ مانند D:\\PhotoBridge\\Lab.');return raw[0].toUpperCase()+path.win32.normalize(raw).slice(1).replace(/\\$/,'');}
const nativeId=id=>/^pblab-[a-zA-Z0-9-]{20,110}$/.test(id||'');
export async function storageTargetRequest({pool,labId,deviceId,user,method,action='settings',body={}}){
 if(method==='PUT'&&body.pairFolderId)return selectStoragePair({pool,labId,deviceId,user,body});
 if(user?.labRole!=='lab_admin')throw fail('lab_admin_required','این تنظیمات فقط برای مدیر لابراتوار است.',403);
 if(!(['settings','activate','hello'].includes(action))||action==='settings'&&!['GET','PUT'].includes(method)||action!=='settings'&&method!=='POST')throw fail('method_not_allowed','عملیات معتبر نیست.',405);
 const devices=row=>Object.entries(row.ui_preferences?.desktopStorageDevices||{}).filter(([id])=>nativeId(id)).map(([id,d])=>({id,label:String(d.label||'PhotoBridge Lab'),lastSeen:d.lastSeen,folderPicker:d.folderPicker===true}));
 const publicTarget=row=>{const paired=pairedTarget(row,deviceId);if(paired)return paired;const t=row.ui_preferences?.desktopStorageTarget,list=devices(row);if(!t)return {configured:false,devices:list};return {configured:true,path:t.path,revision:t.revision,selectedDeviceId:t.selectedDeviceId||null,devices:list,isSelectedDevice:Boolean(deviceId&&t.selectedDeviceId===deviceId),active:Boolean(t.selectedDeviceId&&t.activeDeviceId===t.selectedDeviceId&&row.primary_download_device_id===t.selectedDeviceId),isThisDevice:Boolean(deviceId&&t.activeDeviceId===deviceId&&t.selectedDeviceId===deviceId&&row.primary_download_device_id===deviceId),label:list.find(d=>d.id===t.selectedDeviceId)?.label||row.primary_download_device_label||null,activatedAt:t.activatedAt||null}};
 const select='SELECT ui_preferences,primary_download_device_id,primary_download_device_label FROM labs WHERE id=$1';
 if(method==='GET')return publicTarget((await pool.query(select,[labId])).rows[0]||{});
 const pathname=method==='PUT'?normalizeStoragePath(body.path):null;
 if(method==='POST'&&!nativeId(deviceId))throw fail('native_device_required','این عملیات باید در برنامهٔ ویندوز انجام شود.');
 const c=await pool.connect();try{await c.query('BEGIN');const row=(await c.query(select+' FOR UPDATE',[labId])).rows[0];if(!row)throw fail('lab_not_found','لابراتوار پیدا نشد.',404);const old=row.ui_preferences?.desktopStorageTarget;if(pairFor(row)&&action!=='hello')throw fail('paired_folder_required','پوشه را از دکمه انتخاب مسیر در همین محیط انتخاب کنید.',409);
 if(action==='hello'){const entries=Object.entries(row.ui_preferences?.desktopStorageDevices||{}).filter(([id])=>nativeId(id)&&id!==deviceId).sort((a,b)=>String(b[1].lastSeen).localeCompare(String(a[1].lastSeen))).slice(0,15),registry=Object.fromEntries(entries);registry[deviceId]={label:String(body.label||'PhotoBridge Lab').replace(/[\x00-\x1f]/g,'').slice(0,120),lastSeen:new Date().toISOString(),folderPicker:body.folderPicker===true};await c.query("UPDATE labs SET ui_preferences=COALESCE(ui_preferences,'{}'::jsonb)||$2::jsonb,updated_at=now() WHERE id=$1",[labId,JSON.stringify({desktopStorageDevices:registry})]);row.ui_preferences={...row.ui_preferences,desktopStorageDevices:registry};await c.query('COMMIT');return publicTarget(row)}
 let target;if(method==='PUT'){
 const selected=String(body.deviceId||'');if(!nativeId(selected)||!devices(row).some(d=>d.id===selected))throw fail('storage_device_required','ابتدا برنامهٔ ویندوز را باز کنید و کامپیوتر اصلی را در سایت انتخاب کنید.');
 if(old?.path===pathname&&old.selectedDeviceId===selected){await c.query('COMMIT');return publicTarget(row)}target={path:pathname,selectedDeviceId:selected,revision:crypto.randomUUID(),updatedAt:new Date().toISOString()};
 await c.query("UPDATE labs SET ui_preferences=COALESCE(ui_preferences,'{}'::jsonb)||$2::jsonb,primary_download_device_id=NULL,primary_download_device_label=NULL,primary_download_device_registered_at=NULL,updated_at=now() WHERE id=$1",[labId,JSON.stringify({desktopStorageTarget:target})]);row.primary_download_device_id=null;row.primary_download_device_label=null;
 }else{
 if(!old||body.revision!==old.revision)throw fail('storage_target_changed','مسیر یا سیستم اصلی سایت تغییر کرده است؛ تنظیمات را بازخوانی کنید.',409);
 if(old.selectedDeviceId!==deviceId)throw fail('not_selected_storage_device','این کامپیوتر سیستم اصلی انتخاب‌شده در سایت نیست؛ فعال‌سازی مجاز نیست.',403);
 if(row.primary_download_device_id&&row.primary_download_device_id!==deviceId)throw fail('primary_device_exists','سیستم اصلی با تنظیمات سایت مطابقت ندارد؛ مدیر باید تنظیمات سایت را بازبینی کند.',409);
 target={...old,activeDeviceId:deviceId,activatedAt:new Date().toISOString()};const label=devices(row).find(d=>d.id===deviceId)?.label||'PhotoBridge Lab';await c.query("UPDATE labs SET ui_preferences=COALESCE(ui_preferences,'{}'::jsonb)||$2::jsonb,primary_download_device_id=$3,primary_download_device_label=$4,primary_download_device_registered_at=now(),updated_at=now() WHERE id=$1",[labId,JSON.stringify({desktopStorageTarget:target}),deviceId,label]);row.primary_download_device_id=deviceId;row.primary_download_device_label=label;
 }
 row.ui_preferences={...row.ui_preferences,desktopStorageTarget:target};await c.query('COMMIT');return publicTarget(row);
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{c.release()}
}

