import crypto from 'node:crypto';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const pairFor = row => row?.ui_preferences?.storageFolderPair;
export function storageDeviceAllowed(row, id) {
 const pair = pairFor(row);
 return Boolean(id && (pair ? pair.devices?.[id]?.folderId === pair.folderId : row?.primary_download_device_id === id));
}
export function pairedTarget(row, id) {
 const pair=pairFor(row); if(!pair)return null;
 const active=storageDeviceAllowed(row,id);
 return {paired:true,configured:true,folderId:pair.folderId,revision:pair.revision,path:pair.name,
  active,isThisDevice:active,isSelectedDevice:active,registered:true,label:pair.name,
  message:active?'مسیر ذخیره‌سازی فعال است.':'مسیر ذخیره‌سازی در محیط دیگر تغییر کرده؛ مسیرها را یکسان کنید.',devices:[]};
}
export async function selectStoragePair({pool,labId,deviceId,user,body}) {
 if(user?.labRole!=='lab_admin')throw Object.assign(Error('lab_admin_required'),{status:403,display:'این تنظیمات فقط برای مدیر لابراتوار است.'});
 if(!/^[a-zA-Z0-9_-]{20,120}$/.test(deviceId||'')||!uuid.test(body.pairFolderId||''))throw Object.assign(Error('invalid_folder_identity'),{status:400,display:'شناسه پوشه معتبر نیست؛ دوباره پوشه را انتخاب کنید.'});
 const c=await pool.connect();try{
  await c.query('BEGIN');const row=(await c.query('SELECT ui_preferences,primary_download_device_id,primary_download_device_label FROM labs WHERE id=$1 FOR UPDATE',[labId])).rows[0];
  if(!row)throw Object.assign(Error('lab_not_found'),{status:404,display:'لابراتوار پیدا نشد.'});
  const old=pairFor(row),same=old?.folderId===body.pairFolderId;
  const devices=same?{...old.devices}:{};
  if(!devices[deviceId]&&Object.keys(devices).length>=16)throw Object.assign(Error('folder_device_limit'),{status:409,display:'تعداد اتصال‌های این پوشه بیش از حد است.'});
  devices[deviceId]={folderId:body.pairFolderId,kind:body.kind==='native'?'native':'browser'};
  const pair={folderId:body.pairFolderId,name:String(body.name||'پوشه ذخیره‌سازی').replace(/[\x00-\x1f]/g,'').slice(0,240),revision:same?old.revision:crypto.randomUUID(),devices};
  await c.query("UPDATE labs SET ui_preferences=COALESCE(ui_preferences,'{}'::jsonb)||$2::jsonb,primary_download_device_id=$3,primary_download_device_label=$4,primary_download_device_registered_at=now(),updated_at=now() WHERE id=$1",[labId,JSON.stringify({storageFolderPair:pair}),deviceId,pair.name]);
  await c.query('COMMIT');return pairedTarget({ui_preferences:{storageFolderPair:pair}},deviceId);
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{c.release()}
}
