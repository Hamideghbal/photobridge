// Uses the CRM caller's authenticated owner and existing transaction/RLS scope.
const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
export function validateAppointment(body){
 const serviceName=String(body.serviceName||'').trim(),notes=String(body.notes||'').trim();
 const durationMinutes=Number(body.durationMinutes),startsAt=String(body.startsAt||'');
 if(!idPattern.test(String(body.customerId||''))||!serviceName||serviceName.length>200||notes.length>1000||!Number.isInteger(durationMinutes)||durationMinutes<5||durationMinutes>720||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00(?:\.000)?Z$/.test(startsAt)||!Number.isFinite(Date.parse(startsAt)))fail('invalid_appointment');
 if(new Date(startsAt).toISOString().replace('.000Z','Z')!==startsAt.replace('.000Z','Z'))fail('invalid_appointment');
 if(body.smsEnabled!==undefined&&typeof body.smsEnabled!=='boolean')fail('invalid_appointment');
 return {customerId:body.customerId,serviceName,notes,durationMinutes,startsAt,smsEnabled:body.smsEnabled===true};
}
export async function handleAppointments({c,p,method,body,kind,id,url,getReminderQuote}){
 if(!p.startsWith('/api/crm/appointments'))return null;
 const args=[kind,id];
 if(p==='/api/crm/appointments/quote'&&method==='GET')return {status:200,value:{ok:true,...await getReminderQuote(kind,id)}};
 if(p==='/api/crm/appointments'&&method==='GET'){
  const from=url.searchParams.get('from'),to=url.searchParams.get('to');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(from||'')||!/^\d{4}-\d{2}-\d{2}$/.test(to||'')||!Number.isFinite(Date.parse(from))||!Number.isFinite(Date.parse(to))||Date.parse(to)<=Date.parse(from)||Date.parse(to)-Date.parse(from)>100*86400000||new Date(from).toISOString().slice(0,10)!==from||new Date(to).toISOString().slice(0,10)!==to)fail('invalid_calendar_range');
  const q=await c.query(`SELECT a.*,c.full_name customer_name,c.mobile customer_mobile,
   (SELECT r.state FROM crm_appointment_reminders r WHERE r.appointment_id=a.id AND r.owner_kind=a.owner_kind AND r.owner_id=a.owner_id AND r.revision=a.reminder_revision AND r.channel='sms') sms_state,
   (SELECT r.error_code FROM crm_appointment_reminders r WHERE r.appointment_id=a.id AND r.owner_kind=a.owner_kind AND r.owner_id=a.owner_id AND r.revision=a.reminder_revision AND r.channel='sms') sms_error
   FROM pb_crm.appointments a JOIN pb_crm.customers c ON c.id=a.customer_id AND c.owner_kind=a.owner_kind AND c.owner_id=a.owner_id
   WHERE a.owner_kind=$1 AND a.owner_id=$2 AND a.starts_at >= ($3::date::timestamp AT TIME ZONE 'Asia/Tehran') AND a.starts_at < ($4::date::timestamp AT TIME ZONE 'Asia/Tehran') ORDER BY a.starts_at,a.created_at LIMIT 2000`,[...args,from,to]);
  return {status:200,value:{ok:true,appointments:q.rows}};
 }
 const match=p.match(/^\/api\/crm\/appointments\/([0-9a-f-]{36})$/i);
 if(match&&!idPattern.test(match[1]))fail('invalid_appointment');
 if(p==='/api/crm/appointments'&&method==='POST'||match&&method==='PUT'){
  const data=validateAppointment(body);
  const appointmentId=match?.[1]||null;
  const status=body.status||'scheduled';if(!['scheduled','completed','cancelled'].includes(status))fail('invalid_appointment');
  const customer=await c.query('SELECT id FROM pb_crm.customers WHERE owner_kind=$1 AND owner_id=$2 AND id=$3 AND (deleted_at IS NULL OR EXISTS (SELECT 1 FROM pb_crm.appointments a WHERE a.id=$4 AND a.owner_kind=$1 AND a.owner_id=$2 AND a.customer_id=$3))',[...args,data.customerId,appointmentId]);
  if(!customer.rowCount)fail('customer_missing',404);
  if(data.smsEnabled&&status==='scheduled'){const quote=await getReminderQuote(kind,id);if(!quote.available)fail('appointment_sms_unavailable',409)}
  // Serialize each owner's calendar so concurrent submissions cannot bypass overlap checks.
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[`crm-calendar:${kind}:${id}`]);
  let reminderChanged=true;
  if(appointmentId){
   const previous=await c.query('SELECT * FROM pb_crm.appointments WHERE owner_kind=$1 AND owner_id=$2 AND id=$3 FOR UPDATE',[...args,appointmentId]);
   if(!previous.rowCount)fail('appointment_missing',404);
   const before=previous.rows[0];
   if(body.expectedRevision!==undefined&&before.revision!==body.expectedRevision)fail('appointment_changed',409);
   reminderChanged=before.customer_id!==data.customerId||before.service_name!==data.serviceName||new Date(before.starts_at).getTime()!==Date.parse(data.startsAt)||before.sms_enabled!==data.smsEnabled||before.status!==status;
  }
  if(status==='scheduled'){
   const conflict=await c.query(`SELECT id FROM pb_crm.appointments WHERE owner_kind=$1 AND owner_id=$2 AND status='scheduled' AND ($3::uuid IS NULL OR id<>$3) AND starts_at < $4::timestamptz + $5::int * interval '1 minute' AND starts_at + duration_minutes * interval '1 minute' > $4::timestamptz LIMIT 1`,[...args,appointmentId,data.startsAt,data.durationMinutes]);
   if(conflict.rowCount)fail('appointment_overlap',409);
  }
  let q;
  const values=[...args,data.customerId,data.serviceName,data.startsAt,data.durationMinutes,data.notes,status,data.smsEnabled];
  if(appointmentId)q=await c.query(`UPDATE pb_crm.appointments SET customer_id=$3,service_name=$4,starts_at=$5,duration_minutes=$6,notes=$7,status=$8,sms_enabled=$9,revision=revision+1,reminder_revision=reminder_revision+$11,updated_at=now() WHERE owner_kind=$1 AND owner_id=$2 AND id=$10 RETURNING *`,[...values,appointmentId,reminderChanged?1:0]);
  else q=await c.query(`INSERT INTO pb_crm.appointments(owner_kind,owner_id,customer_id,service_name,starts_at,duration_minutes,notes,status,sms_enabled) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,values);
  if(!q.rowCount)fail('appointment_missing',404);
  const row=q.rows[0];
  if(reminderChanged)await c.query("UPDATE crm_appointment_reminders SET state='cancelled' WHERE owner_kind=$1 AND owner_id=$2 AND appointment_id=$3 AND state='pending'",[...args,row.id]);
  if(reminderChanged&&status==='scheduled')for(const channel of data.smsEnabled?['internal','sms']:['internal'])await c.query(`INSERT INTO crm_appointment_reminders(appointment_id,owner_kind,owner_id,revision,channel,due_at) VALUES($3,$1,$2,$4,$5,GREATEST(now(),$6::timestamptz - interval '24 hours')) ON CONFLICT DO NOTHING`,[...args,row.id,row.reminder_revision,channel,data.startsAt]);
  return {status:appointmentId?200:201,value:{ok:true,appointment:row}};
 }
 fail('crm_route_not_found',404);
}
export function reminderCopy(appointment){
 const time=new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(appointment.starts_at));
 const date=new Intl.DateTimeFormat('fa-IR',{timeZone:'Asia/Tehran',month:'long',day:'numeric'}).format(new Date(appointment.starts_at));
 return {title:'یادآوری برنامه مشتری',message:`${date} ساعت ${time}، ${appointment.customer_name}؛ ${appointment.service_name}`};
}
export async function deliverAppointmentReminders({pool,push,sendOwnerSms,now=new Date()}){
 // Process a bounded batch; durable processing state prevents duplicate SMS/charges after a crash.
 for(let i=0;i<40;i++){
  const c=await pool.connect();let job,appointment,notification;
  try{
   await c.query('BEGIN');
   const q=await c.query("SELECT * FROM crm_appointment_reminders WHERE state='pending' AND due_at<=$1 ORDER BY due_at LIMIT 1 FOR UPDATE SKIP LOCKED",[now]);
   job=q.rows[0];if(!job){await c.query('COMMIT');break}
   await c.query("SELECT set_config('pb_crm.owner_kind',$1,true),set_config('pb_crm.owner_id',$2,true)",[job.owner_kind,job.owner_id]);
   const a=await c.query(`SELECT a.*,c.full_name customer_name,c.mobile customer_mobile FROM pb_crm.appointments a JOIN pb_crm.customers c ON c.id=a.customer_id AND c.owner_kind=a.owner_kind AND c.owner_id=a.owner_id WHERE a.id=$1 AND a.owner_kind=$2 AND a.owner_id=$3 FOR UPDATE OF a NOWAIT`,[job.appointment_id,job.owner_kind,job.owner_id]);
   appointment=a.rows[0];
   if(!appointment||appointment.reminder_revision!==job.revision||appointment.status!=='scheduled'||new Date(appointment.starts_at)<=now||job.channel==='sms'&&!appointment.sms_enabled){await c.query("UPDATE crm_appointment_reminders SET state='cancelled',processed_at=now() WHERE id=$1",[job.id]);await c.query('COMMIT');continue}
   if(job.channel==='internal'){
    const copy=reminderCopy(appointment),metadata={appointmentId:appointment.id,date:new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(appointment.starts_at))};
    const recipient=job.owner_kind==='lab'?'recipient_lab_id':'recipient_user_id';
    const inserted=await c.query(`INSERT INTO system_notifications(${recipient},event_key,title,message,metadata) VALUES($1,'crm_appointment_reminder',$2,$3,$4::jsonb) RETURNING *`,[job.owner_id,copy.title,copy.message,JSON.stringify(metadata)]);
    notification=inserted.rows[0];
   }
   await c.query("UPDATE crm_appointment_reminders SET state=$2,processed_at=now() WHERE id=$1",[job.id,job.channel==='internal'?'sent':'processing']);
   await c.query('COMMIT');
  }catch(error){await c.query('ROLLBACK').catch(()=>{});if(error.code==='55P03')return;throw error}finally{c.release()}
  if(job.channel==='internal'){
   try{await push(job.owner_kind==='lab'?'lab':'customer',job.owner_id,notification,'crm_appointment_reminder',notification?.metadata||{})}catch(error){console.warn('[CRM appointment push]',String(error.message).slice(0,100))}
  }else{
   try{await sendOwnerSms(job,appointment);await pool.query("UPDATE crm_appointment_reminders SET state='sent',processed_at=now() WHERE id=$1 AND state='processing'",[job.id])}
   catch(error){await pool.query("UPDATE crm_appointment_reminders SET state='failed',error_code=$2,processed_at=now() WHERE id=$1 AND state='processing'",[job.id,String(error.message||'sms_failed').slice(0,100)])}
  }
 }
}
