import {confirmDomainPayment,dispatchDomainAdminAlert,releaseDomainCheckout} from './lab-domain-gateway.js';
export async function handleDomainAdminApi({req,res,url,a,pool,sendJson,publicOrigin,gateway,merchant,notifyAdmin}){
 const list=url.pathname==='/api/admin/domain-orders',action=url.pathname.match(/^\/api\/admin\/domain-orders\/([0-9a-f-]{36})\/(recheck|sms|reset)$/i);if(!list&&!action)return false;
 const reply=(status,body)=>{res.setHeader?.('Cache-Control','private, no-store');sendJson(res,status,body);return true};if(a?.platformRole!=='platform_admin')return reply(403,{error:'forbidden'});
 if(list){if(req.method!=='GET')return reply(405,{error:'method_not_allowed'});const orders=await pool.query("SELECT p.value,split_part(p.key,':',2) AS lab_id,l.name AS lab_name FROM platform_settings p LEFT JOIN labs l ON l.id::text=split_part(p.key,':',2) WHERE p.key LIKE 'lab_domain_request:%' ORDER BY p.updated_at DESC LIMIT 200"),payments=await pool.query("SELECT value FROM platform_settings WHERE key LIKE 'lab_domain_payment:%' ORDER BY updated_at DESC LIMIT 200");return reply(200,{orders:orders.rows.map(r=>({...r.value,labId:r.lab_id,labName:r.lab_name})),payments:payments.rows.map(r=>r.value)});}
 if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});if(req.headers.origin!==publicOrigin)return reply(403,{error:'invalid_origin'});
 const id=action[1],key='lab_domain_payment:'+id;const p=(await pool.query('SELECT value FROM platform_settings WHERE key=$1',[key])).rows[0]?.value;if(!p)return reply(404,{error:'payment_not_found'});
 try{if(action[2]==='reset'){await releaseDomainCheckout({pool,paymentId:id});}
 else if(action[2]==='recheck'){await confirmDomainPayment({pool,paymentId:id,trackId:p.trackId,orderId:id,gateway,merchant});await dispatchDomainAdminAlert({pool,notifyAdmin},id);}
 else{if(p.status!=='paid'||!['failed','dispatching'].includes(p.smsState))return reply(409,{error:'sms_retry_unavailable'});await pool.query("UPDATE platform_settings SET value=value||'{\"smsState\":\"pending\"}'::jsonb,updated_at=now() WHERE key=$1 AND value->>'smsState'=$2",[key,p.smsState]);await dispatchDomainAdminAlert({pool,notifyAdmin},id);}
 return reply(200,{ok:true});}catch(e){return reply(e.status||503,{error:e.message||'domain_payment_not_verified'});}
}
