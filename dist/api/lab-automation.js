// R1568: lab-scoped, opt-in automation. No change to existing ready-stage invoice rules.
export const labAutomationKey=labId=>'lab_automation_v1:'+labId;
export const labAutomationDefaults=Object.freeze({autoDownload:false,invoiceTiming:'after_print',autoPrint:false});
export function normalizeLabAutomation(value){
 const v=value&&typeof value==='object'&&!Array.isArray(value)?value:{};
 return {autoDownload:v.autoDownload===true,invoiceTiming:v.invoiceTiming==='before_print'?'before_print':'after_print',autoPrint:v.autoPrint===true};
}
export function validateLabAutomation(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!=='autoDownload,autoPrint,invoiceTiming'||typeof value.autoDownload!=='boolean'||typeof value.autoPrint!=='boolean'||!['before_print','after_print'].includes(value.invoiceTiming))throw Object.assign(Error('invalid_lab_automation'),{status:400});
 return normalizeLabAutomation(value);
}
export async function readLabAutomation(pool,labId){
 const q=await pool.query('SELECT value FROM platform_settings WHERE key=$1 LIMIT 1',[labAutomationKey(labId)]);
 return normalizeLabAutomation(q.rows[0]?.value);
}
export async function saveLabAutomation(pool,labId,value){
 const settings=validateLabAutomation(value);
 await pool.query(`INSERT INTO platform_settings(key,value,updated_at) VALUES($1,$2::jsonb,now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()`,[labAutomationKey(labId),JSON.stringify(settings)]);
 return settings;
}
export function eligibleForAutoDownload(order){
 return !!order&&String(order.mode||'print')==='print'&&!['walkin','manual_invoice','manual'].includes(String(order.source||''))&&['sent','received'].includes(String(order.status||''))&&order.downloaded_at==null&&!(order.settlement_mode==='prepaid'&&order.payment_status!=='paid')&&Number(order.file_count||0)>0;
}
