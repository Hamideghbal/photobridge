// Isolated authenticated CRM API. The caller must pass the server-validated portal
// session. No user-supplied owner ids are ever used.
import {prepareServiceInvoice,renderServiceInvoiceHtml} from '../../features/customer-crm/service-invoice.mjs';
import {renderSmsTemplate} from '../../features/customer-crm/sms-personalization.mjs';
import {countSmsSegments} from '../../features/customer-crm/sms-segment-counter.mjs';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const asId=x=>uuid.test(String(x||''))?String(x):null;
const digits=x=>String(x??'').replace(/[۰-۹]/g,c=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c))).replace(/[٠-٩]/g,c=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)));
function phone(x){let s=digits(x).replace(/[\s()+-]/g,'');if(s.startsWith('0098'))s='0'+s.slice(4);else if(s.startsWith('98'))s='0'+s.slice(2);else if(s.startsWith('9'))s='0'+s;return /^09\d{9}$/.test(s)?s:''}
function txt(v,n=180){return String(v??'').trim().replace(/\s+/g,' ').slice(0,n+1)}
function fail(reason,status=400){const e=new Error(reason);e.status=status;throw e}
function ownerOf(a,portal){
 if(portal==='lab'&&a?.labRole==='lab_admin'&&asId(a.labId))return {kind:'lab',id:a.labId};
 if(portal==='photographer'&&a?.labRole==='customer'&&asId(a.userId))return {kind:'photographer',id:a.userId};
 return null;
}
function validOccasionDate(kind,year,month,day){
 if(!['jalali','gregorian'].includes(kind)||!Number.isInteger(month)||!Number.isInteger(day)||month<1||month>12||day<1||year!==null&&(!Number.isInteger(year)||year<1||year>9999))return false;
 if(kind==='gregorian'){
  if(year===null)return day<=([31,29,31,30,31,30,31,31,30,31,30,31][month-1]);
  return day<=([31,(year%4===0&&(year%100!==0||year%400===0))?29:28,31,30,31,30,31,31,30,31,30,31][month-1]);
 }
 if(month<=6)return day<=31;
 if(month<12)return day<=30;
 if(day>30)return false;
 if(day<30||year===null)return true;
 if(year<1200||year>1700)return false; // Verified Intl supported range
 const fmt=new Intl.DateTimeFormat('en-US-u-ca-persian',{timeZone:'Asia/Tehran',year:'numeric',month:'numeric',day:'numeric'});
 for(let d=new Date(Date.UTC(year+620,2,15));d<=new Date(Date.UTC(year+622,2,25));d.setUTCDate(d.getUTCDate()+1)){
  const p=Object.fromEntries(fmt.formatToParts(d).filter(x=>['year','month','day'].includes(x.type)).map(x=>[x.type,Number(x.value)]));
  if(p.year===year&&p.month===12&&p.day===30)return true;
 }
 return false;
}
function dateParts(date,calendar){
 const locale=calendar==='jalali'?'en-US-u-ca-persian':'en-US-u-ca-gregory';
 return Object.fromEntries(new Intl.DateTimeFormat(locale,{timeZone:'Asia/Tehran',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(date).filter(x=>['year','month','day'].includes(x.type)).map(x=>[x.type,Number(x.value)]));
}
function dueDates(rows,range){
 const now=new Date(),current=dateParts(now,'jalali'),found=[];
 for(let offset=0;offset<(range==='week'?7:35);offset++){
  const day=new Date(now.getTime()+offset*86400000),jalali=dateParts(day,'jalali'),gregorian=dateParts(day,'gregorian');
  if(range==='month'&&(jalali.year!==current.year||jalali.month!==current.month))continue;
  for(const r of rows){
   const date=r.calendar_kind==='gregorian'?gregorian:jalali;
   if(date.month!==Number(r.event_month)||date.day!==Number(r.event_day))continue;
   if(r.event_year!==null&&Number(r.event_year)>date.year)continue;
   if(r.repeats_yearly===false&&Number(r.event_year)!==date.year)continue;
   found.push({...r,daysUntil:offset,dueAt:day.toISOString().slice(0,10)});
  }
 }
 return found.sort((a,b)=>a.daysUntil-b.daysUntil);
}
function validateTemplate(value){
 const s=txt(value,1000);if(!s||s.length>1000)fail('invalid_message_text');
 if(!renderSmsTemplate(s,{customerName:'مشتری',occasion:'مناسبت',studioName:'آتلیه'}).valid)fail('invalid_template_token');
 return s;
}
const presets=['عکاسی کودک','تولد کودک','نامزدی','عروسی','خانوادگی','پرتره','عکس پرسنلی'];
const eventTypes=new Set(['birthday','engagement_anniversary','wedding_anniversary','shoot_anniversary','other']);
async function buildPreview(c,kind,id,body,name){
 if(!asId(body.shootTypeId))fail('invalid_shoot_type_id');
 const ids=body.customerIds;if(!Array.isArray(ids)||ids.length<1||ids.length>100||ids.some(x=>!asId(x)))fail('invalid_customer_ids');
 const q=await c.query('SELECT s.name,t.message_text,t.enabled FROM pb_crm.shoot_types s LEFT JOIN pb_crm.sms_templates t ON t.shoot_type_id=s.id AND t.owner_kind=$1 AND t.owner_id=$2 WHERE s.id=$3 AND s.owner_kind=$1 AND s.owner_id=$2 AND s.archived_at IS NULL',[kind,id,body.shootTypeId]);
 if(!q.rowCount)fail('shoot_type_missing',404);
 const text=body.messageText===undefined?q.rows[0].message_text:validateTemplate(body.messageText);
 if(!text||body.messageText===undefined&&!q.rows[0].enabled)fail('sms_template_unavailable');
 const rows=await c.query('SELECT id,full_name,mobile,marketing_permission FROM pb_crm.customers WHERE owner_kind=$1 AND owner_id=$2 AND id=ANY($3::uuid[]) AND deleted_at IS NULL',[kind,id,ids]);
 const found=new Map(rows.rows.map(x=>[String(x.id),x]));
 const unique=new Set();
 const messages=ids.map(customerId=>{
  const customer=found.get(customerId);
  if(!customer)return {customerId,valid:false,errors:['مشتری پیدا نشد']};
  const rendered=renderSmsTemplate(text,{customerName:customer.full_name,occasion:txt(body.occasion,100),studioName:name});
  const errors=[...rendered.errors];
  if(customer.marketing_permission!=='opted_in')errors.push('رضایت تبلیغاتی ثبت نشده است');
  const normalized=phone(customer.mobile);
  if(!normalized)errors.push('شماره نامعتبر');
  if(normalized&&unique.has(normalized))errors.push('شماره تکراری');
  unique.add(normalized);
  const metrics=countSmsSegments(rendered.text);
  return {customerId,customerName:customer.full_name,mobile:normalized,text:rendered.text,segments:metrics.segments,encoding:metrics.encoding,valid:!errors.length,errors};
 });
 return {messages,totalSegments:messages.filter(x=>x.valid).reduce((s,x)=>s+x.segments,0),validRecipients:messages.filter(x=>x.valid).length,estimatedCostToman:null,pricingVerified:false,canSend:false,notice:'ارسال تا اتصال تعرفه معتبر و کیف پول مستقل CRM غیرفعال است'};
}
export async function handleCustomerCRM(ctx){
 const {req,res,url,a,pool,bodyJson,sendJson,portal}=ctx;
 if(!url.pathname.startsWith('/api/crm/'))return false;
 const o=ownerOf(a,portal);
 if(!o){sendJson(res,403,{error:'crm_forbidden'});return true}
 if(a.mustChangePassword){sendJson(res,428,{error:'password_change_required'});return true}
 // Same-origin mutations; cookies alone are not enough to authorize cross-site POST.
 const origin=String(req.headers.origin||'');
 if(!['GET','HEAD'].includes(req.method)&&(!origin||(()=>{try{return new URL(origin).host!==String(req.headers.host||'')}catch{return true}})())){
  sendJson(res,403,{error:'crm_origin_required'});return true;
 }
 const {kind,id}=o;
 const c=await pool.connect();
 try{
  await c.query('BEGIN');
  await c.query("SELECT set_config('pb_crm.owner_kind',$1,true),set_config('pb_crm.owner_id',$2,true)",[kind,id]);
  const p=url.pathname,method=req.method,body=['POST','PUT','DELETE'].includes(method)?await bodyJson(req,32000):{};
  const args=[kind,id],match=(expr)=>p.match(expr);
  let status=200,value;
  if(p==='/api/crm/bootstrap'&&method==='GET'){
   const queries=await Promise.all([
    c.query('SELECT id,full_name "fullName",mobile,notes,marketing_permission "marketingPermission",permission_source "permissionSource" FROM pb_crm.customers WHERE owner_kind=$1 AND owner_id=$2 AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1000',args),
    c.query('SELECT id,name,is_preset "isPreset",sort_order "sortOrder" FROM pb_crm.shoot_types WHERE owner_kind=$1 AND owner_id=$2 AND archived_at IS NULL ORDER BY sort_order,created_at LIMIT 200',args),
    c.query('SELECT * FROM pb_crm.sessions WHERE owner_kind=$1 AND owner_id=$2 ORDER BY created_at DESC LIMIT 2000',args),
    c.query('SELECT * FROM pb_crm.occasions WHERE owner_kind=$1 AND owner_id=$2 ORDER BY created_at DESC LIMIT 2000',args),
    c.query('SELECT * FROM pb_crm.sms_templates WHERE owner_kind=$1 AND owner_id=$2',args),
    c.query('SELECT id,customer_id,invoice_number,status,total_toman,due_toman,issued_at FROM pb_crm.service_invoices WHERE owner_kind=$1 AND owner_id=$2 ORDER BY issued_at DESC LIMIT 300',args)
   ]);
   value={ok:true,customers:queries[0].rows,shootTypes:queries[1].rows,sessions:queries[2].rows,occasions:queries[3].rows,templates:queries[4].rows,invoices:queries[5].rows,presets};
  }
  else if(p==='/api/crm/types/seed'&&method==='POST'){
   for(let i=0;i<presets.length;i++)await c.query('INSERT INTO pb_crm.shoot_types(owner_kind,owner_id,name,is_preset,sort_order) VALUES($1,$2,$3,true,$4) ON CONFLICT DO NOTHING',[kind,id,presets[i],i]);
   value={ok:true};
  }
  else if(p==='/api/crm/customers'&&method==='POST'){
   const name=txt(body.fullName),number=phone(body.mobile),notes=txt(body.notes,1000),permission=body.marketingPermission||'unknown',source=txt(body.permissionSource,150);
   if(!name||name.length>180||!number||!['unknown','opted_in','opted_out'].includes(permission)||permission==='opted_in'&&!source)fail('invalid_customer');
   const r=await c.query('INSERT INTO pb_crm.customers(owner_kind,owner_id,full_name,mobile,notes,marketing_permission,permission_source,permission_changed_at) VALUES($1,$2,$3,$4,$5,$6,$7,now()) RETURNING id',[kind,id,name,number,notes,permission,source]);
   status=201;value={ok:true,id:r.rows[0].id};
  }
  else if(match(/^\/api\/crm\/customers\/([0-9a-f-]{36})$/i)&&(method==='PUT'||method==='DELETE')){
   const cid=p.split('/').pop();if(!asId(cid))fail('invalid_customer_id');
   let r;
   if(method==='DELETE')r=await c.query('UPDATE pb_crm.customers SET deleted_at=now(),updated_at=now() WHERE id=$3 AND owner_kind=$1 AND owner_id=$2 AND deleted_at IS NULL RETURNING id',[kind,id,cid]);
   else{
    const name=txt(body.fullName),number=phone(body.mobile),notes=txt(body.notes,1000),permission=body.marketingPermission||'unknown',source=txt(body.permissionSource,150);
    if(!name||name.length>180||!number||!['unknown','opted_in','opted_out'].includes(permission)||permission==='opted_in'&&!source)fail('invalid_customer');
    r=await c.query('UPDATE pb_crm.customers SET full_name=$4,mobile=$5,notes=$6,marketing_permission=$7,permission_source=$8,permission_changed_at=now(),updated_at=now() WHERE owner_kind=$1 AND owner_id=$2 AND id=$3 AND deleted_at IS NULL RETURNING id',[kind,id,cid,name,number,notes,permission,source]);
   }
   if(!r.rowCount)fail('customer_missing',404);value={ok:true};
  }
  else if(p==='/api/crm/types'&&method==='POST'){
   const name=txt(body.name,100);if(!name||name.length>100)fail('invalid_type_name');
   const r=await c.query('INSERT INTO pb_crm.shoot_types(owner_kind,owner_id,name) VALUES($1,$2,$3) RETURNING id',[kind,id,name]);
   status=201;value={ok:true,id:r.rows[0].id};
  }
  else if(match(/^\/api\/crm\/types\/([0-9a-f-]{36})$/i)&&(method==='PUT'||method==='DELETE')){
   const typeId=p.split('/').pop();if(!asId(typeId))fail('invalid_type_id');
   let r;
   if(method==='DELETE')r=await c.query('UPDATE pb_crm.shoot_types SET archived_at=now(),updated_at=now() WHERE owner_kind=$1 AND owner_id=$2 AND id=$3 AND archived_at IS NULL RETURNING id',[kind,id,typeId]);
   else{const name=txt(body.name,100);if(!name||name.length>100)fail('invalid_type_name');r=await c.query('UPDATE pb_crm.shoot_types SET name=$4,updated_at=now() WHERE owner_kind=$1 AND owner_id=$2 AND id=$3 AND archived_at IS NULL RETURNING id',[kind,id,typeId,name])}
   if(!r.rowCount)fail('shoot_type_missing',404);value={ok:true};
  }
  else if(p==='/api/crm/sessions'&&method==='POST'){
   if(!asId(body.customerId)||!asId(body.shootTypeId)||body.shootDate&&!/^\d{4}-\d{2}-\d{2}$/.test(String(body.shootDate)))fail('invalid_session');
   const r=await c.query('INSERT INTO pb_crm.sessions(owner_kind,owner_id,customer_id,shoot_type_id,shoot_date,notes) VALUES($1,$2,$3,$4,$5,$6) RETURNING id',[kind,id,body.customerId,body.shootTypeId,body.shootDate||null,txt(body.notes,1000)]);
   status=201;value={ok:true,id:r.rows[0].id};
  }
  else if(match(/^\/api\/crm\/sessions\/([0-9a-f-]{36})$/i)&&method==='DELETE'){
   const r=await c.query('DELETE FROM pb_crm.sessions WHERE owner_kind=$1 AND owner_id=$2 AND id=$3 RETURNING id',[kind,id,p.split('/').pop()]);
   if(!r.rowCount)fail('session_missing',404);value={ok:true};
  }
  else if(p==='/api/crm/occasions'&&method==='POST'){
   const year=body.eventYear===null||body.eventYear===''||body.eventYear===undefined?null:Number(digits(body.eventYear)),month=Number(digits(body.eventMonth)),day=Number(digits(body.eventDay));
   const cal=body.calendarKind||'jalali';
   if(!asId(body.customerId)||!eventTypes.has(body.occasionType)||!validOccasionDate(cal,year,month,day))fail('invalid_occasion');
   const r=await c.query('INSERT INTO pb_crm.occasions(owner_kind,owner_id,customer_id,occasion_type,title,calendar_kind,event_year,event_month,event_day,repeats_yearly,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id',[kind,id,body.customerId,body.occasionType,txt(body.title,120),cal,year,month,day,body.repeatsYearly!==false,txt(body.notes,500)]);
   status=201;value={ok:true,id:r.rows[0].id};
  }
  else if(match(/^\/api\/crm\/occasions\/([0-9a-f-]{36})$/i)&&method==='DELETE'){
   const r=await c.query('DELETE FROM pb_crm.occasions WHERE owner_kind=$1 AND owner_id=$2 AND id=$3 RETURNING id',[kind,id,p.split('/').pop()]);
   if(!r.rowCount)fail('occasion_missing',404);value={ok:true};
  }
  else if(p==='/api/crm/due'&&method==='GET'){
   const r=await c.query('SELECT o.*,c.full_name customer_name,c.mobile,c.marketing_permission FROM pb_crm.occasions o JOIN pb_crm.customers c ON c.id=o.customer_id AND c.owner_kind=o.owner_kind AND c.owner_id=o.owner_id AND c.deleted_at IS NULL WHERE o.owner_kind=$1 AND o.owner_id=$2 LIMIT 10000',args);
   value={ok:true,range:url.searchParams.get('range')==='week'?'week':'month',occasions:dueDates(r.rows,url.searchParams.get('range')==='week'?'week':'month')};
  }
  else if(match(/^\/api\/crm\/templates\/([0-9a-f-]{36})$/i)&&method==='PUT'){
   const typeId=p.split('/').pop();if(!asId(typeId))fail('invalid_type_id');
   const msg=validateTemplate(body.messageText);
   const r=await c.query('INSERT INTO pb_crm.sms_templates(owner_kind,owner_id,shoot_type_id,message_text,enabled) SELECT $1,$2,id,$4,$5 FROM pb_crm.shoot_types WHERE owner_kind=$1 AND owner_id=$2 AND id=$3 AND archived_at IS NULL ON CONFLICT(owner_kind,owner_id,shoot_type_id) DO UPDATE SET message_text=EXCLUDED.message_text,enabled=EXCLUDED.enabled,updated_at=now() RETURNING id',[kind,id,typeId,msg,body.enabled!==false]);
   if(!r.rowCount)fail('shoot_type_missing',404);value={ok:true};
  }
  else if(p==='/api/crm/sms-preview'&&method==='POST'){
   let name=a.name||'آتلیه';
   if(kind==='lab'){const l=await c.query('SELECT name FROM labs WHERE id=$1',[id]);name=l.rows[0]?.name||name}
   value={ok:true,...await buildPreview(c,kind,id,body,name)};
  }
  else if(p==='/api/crm/invoices'&&method==='POST'){
   const customerId=asId(body.customerId);if(!customerId)fail('invalid_customer_id');
   const invoice=prepareServiceInvoice(body);
   await c.query('SELECT pg_advisory_xact_lock(hashtext($1),hashtext($2))',[kind,id]);
   const customer=await c.query('SELECT full_name,mobile FROM pb_crm.customers WHERE owner_kind=$1 AND owner_id=$2 AND id=$3 AND deleted_at IS NULL',[kind,id,customerId]);
   if(!customer.rowCount)fail('customer_missing',404);
   let businessName=a.name||'آتلیه';
   if(kind==='lab'){const l=await c.query('SELECT name FROM labs WHERE id=$1',[id]);businessName=l.rows[0]?.name||businessName}
   const number=await c.query('SELECT COALESCE(MAX(invoice_number),0)+1 AS next FROM pb_crm.service_invoices WHERE owner_kind=$1 AND owner_id=$2',[kind,id]);
   const r=await c.query('INSERT INTO pb_crm.service_invoices(owner_kind,owner_id,customer_id,invoice_number,customer_name,customer_mobile,business_name,items,subtotal_toman,discount_toman,total_toman,paid_toman,due_toman,notes,created_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,$11,$12,$13,$14,$15) RETURNING id,invoice_number',[kind,id,customerId,number.rows[0].next,customer.rows[0].full_name,customer.rows[0].mobile,businessName,JSON.stringify(invoice.items),invoice.subtotalToman,invoice.discountToman,invoice.totalToman,invoice.paidToman,invoice.dueToman,invoice.notes,a.userId]);
   status=201;value={ok:true,id:r.rows[0].id,invoiceNumber:Number(r.rows[0].invoice_number)};
  }
  else if(match(/^\/api\/crm\/invoices\/([0-9a-f-]{36})\/print$/i)&&method==='GET'){
   const invoiceId=p.split('/')[4];if(!asId(invoiceId))fail('invalid_invoice_id');
   const q=await c.query('SELECT * FROM pb_crm.service_invoices WHERE owner_kind=$1 AND owner_id=$2 AND id=$3',[kind,id,invoiceId]);
   if(!q.rowCount)fail('invoice_missing',404);
   const r=q.rows[0];
   if(r.status!=='issued')fail('invoice_void',409);
   const html=renderServiceInvoiceHtml({invoiceNumber:Number(r.invoice_number),customerName:r.customer_name,customerMobile:r.customer_mobile,businessName:r.business_name,businessPhone:r.business_phone,businessAddress:r.business_address,issuedAt:r.issued_at,items:r.items,discountToman:Number(r.discount_toman),paidToman:Number(r.paid_toman),notes:r.notes},url.searchParams.get('format'));
   await c.query('COMMIT');
   res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store, max-age=0','x-content-type-options':'nosniff','x-frame-options':'DENY','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"});
   res.end(html);return true;
  }
  else if(match(/^\/api\/crm\/invoices\/([0-9a-f-]{36})\/void$/i)&&method==='POST'){
   const invoiceId=p.split('/')[4],reason=txt(body.reason,200);
   if(!asId(invoiceId)||!reason)fail('invalid_void_request');
   const r=await c.query("UPDATE pb_crm.service_invoices SET status='void',voided_at=now(),voided_by=$4,void_reason=$5 WHERE owner_kind=$1 AND owner_id=$2 AND id=$3 AND status='issued' RETURNING id",[kind,id,invoiceId,a.userId,reason]);
   if(!r.rowCount)fail('invoice_missing_or_void',404);
   value={ok:true};
  }
  else fail('crm_route_not_found',404);
  await c.query('COMMIT');sendJson(res,status,value);return true;
 }catch(error){
  await c.query('ROLLBACK').catch(()=>{});
  const key=error.code==='23505'?'crm_duplicate':error.code==='23503'?'crm_invalid_related_record':error.message||'crm_error';
  const status=error.code==='23505'?409:error.code==='23503'?400:error.status||((error.code&&String(error.code).startsWith('23'))?400:500);
  if(status>=500)console.error('[CRM]',error);
  sendJson(res,status,{error:status>=500?'crm_internal_error':key});return true;
 }finally{
  c.release();
 }
}
