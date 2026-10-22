// Optional services are lab-scoped. Payment eligibility comes only from verified renewals.
const uuid=x=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(x));
export const labFeatureKey=id=>'lab_optional_features:'+id;
export function labFeatureState(lab,settings={}){
 const paid=lab?.paid_subscription===true;
 return {desktopEnabled:settings.desktopEnabled===true,siteEnabled:settings.siteEnabled===true,
  siteAvailable:settings.siteEnabled===true&&paid,paidSubscription:paid,
  siteRequestedAt:settings.siteRequestedAt||null,activeUntil:lab?.active_until||null};
}
export async function getLabFeatures(pool,labId){
 const q=await pool.query(`SELECT l.id,l.active_until,
  (l.active=true AND COALESCE(l.suspended,false)=false AND COALESCE(l.service_only,false)=false AND (l.active_from IS NULL OR l.active_from<=now()) AND l.active_until>now() AND EXISTS(
   SELECT 1 FROM subscription_renewals r JOIN platform_payments p ON p.renewal_id=r.id
   WHERE r.lab_id=l.id AND r.status='approved' AND r.amount>0 AND r.new_active_until>now() AND p.status='paid' AND p.amount>0
  )) AS paid_subscription FROM labs l WHERE l.id=$1`,[labId]);
 if(!q.rows[0])return null;
 const setting=await pool.query('SELECT value FROM platform_settings WHERE key=$1 LIMIT 1',[labFeatureKey(labId)]);
 return labFeatureState(q.rows[0],setting.rows[0]?.value||{});
}
export async function requireLabSiteAccess(pool,labId){
 const features=await getLabFeatures(pool,labId);
 if(!features?.siteAvailable)throw Object.assign(new Error(features?.paidSubscription?'lab_site_not_enabled':'paid_subscription_required'),{status:features?.paidSubscription?403:402});
 return features;
}
export async function handleLabOptionalFeatures({req,res,url,a,pool,bodyJson,sendJson,audit,publicOrigin}){
 const admin=url.pathname.match(/^\/api\/admin\/labs\/([0-9a-f-]{36})\/optional-features$/i);
 const lab=url.pathname==='/api/lab/optional-features',request=url.pathname==='/api/lab/optional-features/site-request';
 if(!admin&&!lab&&!request)return false;
 const reply=(status,data)=>{res.setHeader?.('Cache-Control','private, no-store');sendJson(res,status,data);return true;};
 if(admin?a?.platformRole!=='platform_admin':a?.labRole!=='lab_admin'||!a.labId)return reply(403,{error:'forbidden'});
 const labId=admin?admin[1]:a.labId;
 if(!uuid(labId))return reply(400,{error:'invalid_lab_id'});
 const state=await getLabFeatures(pool,labId);if(!state)return reply(404,{error:'lab_not_found'});
 if(req.method==='GET'&&!request)return reply(200,{features:state});
 if(req.headers.origin&&req.headers.origin!==publicOrigin)return reply(403,{error:'invalid_origin'});
 if(!String(req.headers['content-type']||'').startsWith('application/json'))return reply(415,{error:'json_required'});
 if(admin&&req.method==='PUT'){
  const body=await bodyJson(req);
  if(!body||typeof body.desktopEnabled!=='boolean'||typeof body.siteEnabled!=='boolean'||Object.keys(body).some(k=>!['desktopEnabled','siteEnabled'].includes(k)))return reply(400,{error:'invalid_optional_features'});
  await pool.query(`INSERT INTO platform_settings(key,value,updated_at) VALUES($1,$2::jsonb,now())
   ON CONFLICT(key) DO UPDATE SET value=platform_settings.value||EXCLUDED.value,updated_at=now()`,[labFeatureKey(labId),JSON.stringify(body)]);
  await audit(a.userId,labId,'platform_admin.lab_optional_features','lab',labId,body);
  return reply(200,{features:{...state,...body,siteAvailable:body.siteEnabled&&state.paidSubscription}});
 }
 if(request&&req.method==='POST'){
  if(!state.paidSubscription)return reply(402,{error:'paid_subscription_required',renewUrl:'/lab/settings/subscription'});
  // Insert/merge atomically; a simultaneous admin change must never be overwritten.
  const q=await pool.query(`INSERT INTO platform_settings(key,value,updated_at) VALUES($1,jsonb_build_object('siteRequestedAt',now()),now())
   ON CONFLICT(key) DO UPDATE SET value=CASE WHEN platform_settings.value ? 'siteRequestedAt' THEN platform_settings.value ELSE platform_settings.value||EXCLUDED.value END,updated_at=now()
   RETURNING value`,[labFeatureKey(labId)]);
  await audit(a.userId,labId,'lab.site_requested','lab',labId,{});
  return reply(200,{features:labFeatureState({paid_subscription:state.paidSubscription,active_until:state.activeUntil},q.rows[0]?.value||{})});
 }
 return reply(405,{error:'method_not_allowed'});
}
