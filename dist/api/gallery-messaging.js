// Explicit per-gallery consent, using existing settings and photographer wallet services.
export const GALLERY_SMS_SERVICE='sms_customer_notification';
export const gallerySmsSettingsKey=id=>`gallery_sms:${id}`;
const fail=(code,status=400,extra={})=>Object.assign(new Error(code),{status,...extra});
export function createGalleryMessaging({pool,sendSms,price,configured,normalizeMobile,publicAppUrl}){
 async function gallery(id,ownerId){
  const q=await pool.query(`SELECT id,owner_id,title,customer_mobile,public_token,status,expires_at FROM photographer_client_galleries WHERE id=$1 AND owner_id=$2 LIMIT 1`,[id,ownerId]);
  if(!q.rows.length)throw fail('gallery_not_found',404);return q.rows[0];
 }
 async function preferences(id){
  const q=await pool.query('SELECT value FROM platform_settings WHERE key=$1 LIMIT 1',[gallerySmsSettingsKey(id)]);
  const v=q.rows[0]?.value||{};return {ownerEnabled:v.ownerEnabled===true,customerEnabled:v.customerEnabled===true};
 }
 async function quote(ownerId){
  const [service,ready,wallet]=await Promise.all([price(ownerId,GALLERY_SMS_SERVICE),configured(),pool.query('SELECT balance FROM photographer_service_wallets WHERE user_id=$1',[ownerId])]);
  return {available:!!service.enabled&&!!service.customer_enabled&&!!ready,serviceEnabled:!!service.enabled&&!!service.customer_enabled,configured:!!ready,unitPrice:Math.max(0,Math.round(Number(service.effective_price||0))),balance:Number(wallet.rows[0]?.balance||0)};
 }
 async function snapshot(id,ownerId){
  const g=await gallery(id,ownerId);return {...await quote(ownerId),preferences:await preferences(id),customerMobile:normalizeMobile(g.customer_mobile||''),published:g.status==='published'};
 }
 async function save(id,ownerId,b){
  await gallery(id,ownerId);
  if(typeof b.ownerEnabled!=='boolean'||typeof b.customerEnabled!=='boolean')throw fail('invalid_gallery_sms_settings');
  const value={ownerEnabled:b.ownerEnabled,customerEnabled:b.customerEnabled};
  await pool.query(`INSERT INTO platform_settings(key,value) VALUES($1,$2::jsonb) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()`,[gallerySmsSettingsKey(id),JSON.stringify(value)]);
  return {preferences:value};
 }
 async function customer(id,ownerId,{kind,requestId,quotedPrice,automatic=false}){
  if(!['selection','approval'].includes(kind))throw fail('invalid_gallery_sms_kind');
  if(!/^[a-zA-Z0-9:_-]{8,180}$/.test(String(requestId||'')))throw fail('invalid_gallery_sms_request');
  const g=await gallery(id,ownerId),prefs=await preferences(id);
  if(!prefs.customerEnabled){if(automatic)return {sent:false,reason:'disabled'};throw fail('gallery_customer_sms_disabled',409);}
  if(g.status!=='published'||(g.expires_at&&new Date(g.expires_at).getTime()<=Date.now()))throw fail('gallery_not_published',409);
  const mobile=normalizeMobile(g.customer_mobile||'');if(!/^09\d{9}$/.test(mobile))throw fail('gallery_customer_mobile_required');
  if(kind==='approval'){
   const order=await pool.query(`SELECT status FROM photographer_gallery_orders WHERE gallery_id=$1 AND owner_id=$2 AND is_current=true LIMIT 1`,[id,ownerId]);
   if(order.rows[0]?.status!=='awaiting_approval')throw fail('gallery_approval_not_ready',409);
  }
  const q=await quote(ownerId);
  if(!q.available)throw fail('gallery_sms_unavailable',409);
  if(!automatic&&Number(quotedPrice)!==q.unitPrice)throw fail('gallery_sms_price_changed',409);
  if(q.balance<q.unitPrice)throw fail('service_wallet_insufficient',402,{balance:q.balance,required:q.unitPrice});
  // Persist the claim before contacting the provider. Repeated requests never charge twice.
  const key=`gallery_sms_send:${id}:${requestId}`;
  const claim=await pool.query(`INSERT INTO platform_settings(key,value) VALUES($1,$2::jsonb) ON CONFLICT(key) DO NOTHING RETURNING key`,[key,JSON.stringify({state:'sending',ownerId,kind})]);
  if(!claim.rows.length){
   const old=await pool.query('SELECT value FROM platform_settings WHERE key=$1 LIMIT 1',[key]);
   if(old.rows[0]?.value?.state==='sent')return {sent:true,alreadySent:true};
   throw fail('gallery_sms_already_attempted',409);
  }
  try{
   const url=`${publicAppUrl.replace(/\/$/,'')}/g/${encodeURIComponent(g.public_token)}`;
   const message=kind==='approval'?`عکس‌های روتوش‌شده آماده است. برای مشاهده و تأیید وارد گالری شوید:\n${url}`:`گالری عکس شما آماده است. برای مشاهده و انتخاب عکس‌ها وارد شوید:\n${url}`;
   const out=await sendSms({mobile,message,purpose:'gallery_customer_notification',eventKey:`gallery_${kind}`,userId:ownerId,chargePhotographerId:ownerId,serviceKey:GALLERY_SMS_SERVICE,quotedAmount:q.unitPrice,referenceId:id,metadata:{galleryId:id,kind,requestId}});
   await pool.query('UPDATE platform_settings SET value=$2::jsonb,updated_at=now() WHERE key=$1',[key,JSON.stringify({state:'sent',kind,chargedAmount:out.chargedAmount})]);
   return {sent:true,chargedAmount:out.chargedAmount,walletBalance:out.walletBalance};
  }catch(error){await pool.query('UPDATE platform_settings SET value=$2::jsonb,updated_at=now() WHERE key=$1',[key,JSON.stringify({state:'failed',kind,error:String(error.message).slice(0,120)})]).catch(()=>{});throw error;}
 }
 async function owner(args){
  const id=args.metadata?.galleryId;
  if(!id||!(await preferences(id)).ownerEnabled)return {skipped:true};
  await gallery(id,args.userId);
  const q=await quote(args.userId);if(!q.available)throw fail('gallery_sms_unavailable',409);
  return sendSms({...args,chargePhotographerId:args.userId,serviceKey:GALLERY_SMS_SERVICE,quotedAmount:q.unitPrice});
 }
 return {snapshot,save,customer,owner};
}
