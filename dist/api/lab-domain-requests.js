import {domainToASCII} from 'node:url';
import {requireLabSiteAccess} from './lab-optional-features.js';
const cache=new Map(),checks=new Map();
export function normalizeRequestedDomain(value){const raw=String(value||'').trim().toLowerCase();if(!/^[a-z0-9.-]+$/.test(raw))throw Object.assign(Error('invalid_domain'),{status:400});const domain=domainToASCII(raw);if(!/^(?!-)[a-z0-9-]{1,63}(?<!-)\.(com|net|ir)$/.test(domain))throw Object.assign(Error('invalid_domain'),{status:400});return domain;}
export async function lookupDomain(domain,fetcher=fetch){
 const tld=domain.split('.').pop(),base=tld==='ir'?'https://whois.nic.ir/WHOIS?name=':`https://rdap.verisign.com/${tld}/v1/domain/`;
 try{const r=await fetcher(base+encodeURIComponent(domain),{signal:AbortSignal.timeout(8000),redirect:'error',headers:{accept:tld==='ir'?'text/html':'application/rdap+json'}});
 if(tld==='ir'){if(!r.ok)return {status:'unknown'};const text=(await r.text()).slice(0,131072).replace(/<[^>]*>/g,' ');if(new RegExp('(?:domain|ascii):\\s*'+domain.replaceAll('.','\\.')+'(?:\\s|$)','i').test(text))return {status:'registered'};if(/no entries found/i.test(text))return {status:'unregistered'};return {status:'unknown'};}
 const body=await r.json();if(r.status===404&&body.errorCode===404)return {status:'unregistered'};if(r.ok&&String(body.ldhName||'').toLowerCase()===domain&&body.objectClassName==='domain')return {status:'registered'};
 }catch{}return {status:'unknown'};
}
export async function checkDomain(domain){const old=cache.get(domain);if(old&&old.expires>Date.now())return old.result;const result={domain,...await lookupDomain(domain),checkedAt:new Date().toISOString()};if(cache.size>1000)cache.clear();cache.set(domain,{expires:Date.now()+60000,result});return result;}
export async function handleLabDomainRequests({req,res,url,a,pool,bodyJson,sendJson,audit,publicOrigin,lookup=checkDomain}){
 const admin=url.pathname.match(/^\/api\/admin\/labs\/([0-9a-f-]{36})\/domain-requests$/i),base=url.pathname==='/api/lab/domain-requests',check=url.pathname==='/api/lab/domain-requests/check';if(!admin&&!base&&!check)return false;
 const reply=(status,body)=>{res.setHeader?.('Cache-Control','private, no-store');sendJson(res,status,body);return true};
 if(admin?a?.platformRole!=='platform_admin':a?.labRole!=='lab_admin'||!a.labId)return reply(403,{error:'forbidden'});
 const labId=admin?admin[1]:a.labId;if(!/^[0-9a-f-]{36}$/i.test(labId))return reply(400,{error:'invalid_lab_id'});
 try{if(!admin)await requireLabSiteAccess(pool,labId);const prefix='lab_domain_request:'+labId+':';
 if(req.method==='GET'&&!check){const requests=(await pool.query('SELECT value FROM platform_settings WHERE key LIKE $1 ORDER BY updated_at DESC LIMIT 20',[prefix+'%'])).rows.map(r=>r.value);const domains=admin?[]:(await pool.query('SELECT hostname,active FROM equipment_store_domains WHERE lab_id=$1 AND released_at IS NULL ORDER BY created_at',[labId])).rows;return reply(200,{requests,domains});}
 if(req.method!=='POST'&&!(admin&&req.method==='PATCH'))return reply(405,{error:'method_not_allowed'});
 if(req.headers.origin!==publicOrigin)return reply(403,{error:'invalid_origin'});if(!String(req.headers['content-type']||'').startsWith('application/json'))return reply(415,{error:'json_required'});
 const body=await bodyJson(req,4096),domain=normalizeRequestedDomain(body?.domain),key=prefix+domain;
 if(admin){if(!['reviewing','completed','rejected'].includes(body.status))return reply(400,{error:'invalid_domain_request_status'});const q=await pool.query("UPDATE platform_settings SET value=value||$2::jsonb,updated_at=now() WHERE key=$1 RETURNING value",[key,JSON.stringify({status:body.status,reviewedAt:new Date().toISOString()})]);if(!q.rows[0])return reply(404,{error:'request_not_found'});await audit(a.userId,labId,'lab.domain_request_review','platform_setting',key,{domain,status:body.status});return reply(200,{request:q.rows[0].value});}
 if(check){const now=Date.now(),actor=String(a.userId)+':'+labId;if(now-(checks.get(actor)||0)<3000)return reply(429,{error:'domain_check_rate_limit'});if(checks.size>1000)checks.clear();checks.set(actor,now);return reply(200,await lookup(domain));}
 const existing=(await pool.query('SELECT value FROM platform_settings WHERE key=$1',[key])).rows[0]?.value;if(existing)return reply(200,{request:existing});
 const result=await lookup(domain);if(result.status==='registered')return reply(409,{error:'domain_registered'});if(result.status!=='unregistered')return reply(503,{error:'domain_check_unavailable'});
 const request={domain,status:'pending',requestedAt:new Date().toISOString(),requestedBy:a.userId,checkedAt:result.checkedAt||new Date().toISOString()};
 const saved=(await pool.query(`INSERT INTO platform_settings(key,value,updated_at) SELECT $1,$2::jsonb,now() WHERE (SELECT count(*) FROM platform_settings WHERE key LIKE $3)<20
 ON CONFLICT(key) DO UPDATE SET value=platform_settings.value RETURNING value`,[key,JSON.stringify(request),prefix+'%'])).rows[0];if(!saved)return reply(409,{error:'domain_request_limit'});
 await audit(a.userId,labId,'lab.domain_requested','platform_setting',key,{domain});return reply(201,{request:saved.value});
 }catch(e){if(e.status)return reply(e.status,{error:e.message});throw e;}
}
