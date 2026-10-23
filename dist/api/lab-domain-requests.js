import {startDomainCheckout} from './lab-domain-gateway.js';
import {DOMAIN_PRICE_REFERENCE,domainOrderTransaction,captureDomainCandidates} from './lab-domain-orders.js';
import {lookupWithWhois} from './lab-domain-whois.js';
import {domainToASCII} from 'node:url';
import {requireLabSiteAccess} from './lab-optional-features.js';
const cache=new Map(),checks=new Map();
export function normalizeRequestedDomain(value){const raw=String(value||'').trim().toLowerCase();if(!/^[a-z0-9.-]+$/.test(raw))throw Object.assign(Error('invalid_domain'),{status:400});const domain=domainToASCII(raw);if(!/^(?!-)[a-z0-9-]{1,63}(?<!-)\.(com|ir)$/.test(domain))throw Object.assign(Error('invalid_domain'),{status:400});return domain;}
export async function lookupDomain(domain,fetcher=fetch){
 const tld=domain.split('.').pop(),base=tld==='ir'?'https://whois.nic.ir/WHOIS?name=':`https://rdap.verisign.com/${tld}/v1/domain/`;
 try{const r=await fetcher(base+encodeURIComponent(domain),{signal:AbortSignal.timeout(8000),redirect:'error',headers:{accept:tld==='ir'?'text/html':'application/rdap+json'}});
 if(tld==='ir'){if(!r.ok)return {status:'unknown'};const text=(await r.text()).slice(0,131072).replace(/<[^>]*>/g,' ');if(new RegExp('(?:domain|ascii):\\s*'+domain.replaceAll('.','\\.')+'(?:\\s|$)','i').test(text))return {status:'registered'};if(/no entries found/i.test(text))return {status:'unregistered'};return {status:'unknown'};}
 const body=await r.json();if(r.status===404&&body.errorCode===404)return {status:'unregistered'};if(r.ok&&String(body.ldhName||'').toLowerCase()===domain&&body.objectClassName==='domain')return {status:'registered'};
 }catch{}return {status:'unknown'};
}
export async function checkDomain(domain){const old=cache.get(domain);if(old&&old.expires>Date.now())return old.result;const result={domain,...await lookupWithWhois(domain,lookupDomain),checkedAt:new Date().toISOString()};if(cache.size>1000)cache.clear();cache.set(domain,{expires:Date.now()+60000,result});return result;}
export function domainCandidates(body){const values=Array.isArray(body.domains)?body.domains:String(body.domain||'').split(/[\s,،;]+/);const domains=[...new Set(values.filter(Boolean).map(normalizeRequestedDomain))];if(!domains.length||domains.length>5)throw Object.assign(Error('domain_batch_limit'),{status:400});return domains;}
export async function handleLabDomainRequests({req,res,url,a,pool,bodyJson,sendJson,audit,publicOrigin,lookup=checkDomain,ensureWallet,gateway,merchant,multiplier}){
 const admin=url.pathname.match(/^\/api\/admin\/labs\/([0-9a-f-]{36})\/domain-requests$/i),base=url.pathname==='/api/lab/domain-requests',check=url.pathname==='/api/lab/domain-requests/check',pay=['/api/lab/domain-requests/pay','/api/lab/domain-requests/zibal'].includes(url.pathname);if(!admin&&!base&&!check&&!pay)return false;
 const reply=(status,body)=>{res.setHeader?.('Cache-Control','private, no-store');sendJson(res,status,body);return true};
 if(admin?a?.platformRole!=='platform_admin':a?.labRole!=='lab_admin'||!a.labId)return reply(403,{error:'forbidden'});
 const labId=admin?admin[1]:a.labId;if(!/^[0-9a-f-]{36}$/i.test(labId))return reply(400,{error:'invalid_lab_id'});
 try{if(!admin)await requireLabSiteAccess(pool,labId);const prefix='lab_domain_request:'+labId+':';
 if(req.method==='GET'&&!check&&!pay){const requests=(await pool.query('SELECT value FROM platform_settings WHERE key LIKE $1 ORDER BY updated_at DESC LIMIT 20',[prefix+'%'])).rows.map(r=>r.value);const domains=admin?[]:(await pool.query('SELECT hostname,active FROM equipment_store_domains WHERE lab_id=$1 AND released_at IS NULL ORDER BY created_at',[labId])).rows;return reply(200,{requests,domains,pricing:DOMAIN_PRICE_REFERENCE,walletUrl:'/lab/settings/wallet'});}
 if(req.method!=='POST'&&!(admin&&req.method==='PATCH'))return reply(405,{error:'method_not_allowed'});
 if(req.headers.origin!==publicOrigin)return reply(403,{error:'invalid_origin'});if(!String(req.headers['content-type']||'').startsWith('application/json'))return reply(415,{error:'json_required'});
 const body=await bodyJson(req,4096),domains=domainCandidates(body);
 if(pay){const result=await startDomainCheckout({pool,labId,userId:a.userId,domains,quotes:body.quotes,gateway,merchant,multiplier,publicOrigin});return reply(200,result);}
 if(admin){if(admin&&domains.length!==1)return reply(400,{error:'domain_batch_limit'});const result=await domainOrderTransaction({pool,labId,userId:a.userId,domains,quotes:body.quotes,review:admin?body:null,ensureWallet});await audit(a.userId,labId,admin?'lab.domain_request_review':'lab.domain_order_payment','lab',labId,{domains,charged:result.charged||0,status:body.status||null}).catch(()=>console.error('[domain-orders] audit failed after committed transaction'));return reply(200,{...result,...(admin?{request:result.requests[0]}:{})});}
 if(check){const now=Date.now(),actor=String(a.userId)+':'+labId;if(now-(checks.get(actor)||0)<3000)return reply(429,{error:'domain_check_rate_limit'});if(checks.size>1000)checks.clear();checks.set(actor,now);const results=await Promise.all(domains.map(lookup));return reply(200,{results,...(results.length===1?results[0]:{})});}
 // Unknown candidates stay pending; explicit unregistered results get a server-side reference-price quote.
 const results=await Promise.all(domains.map(async domain=>{try{return [domain,await lookup(domain)]}catch{return [domain,{status:'unknown'}]}}));const requests=await captureDomainCandidates({pool,labId,userId:a.userId,domains,checks:Object.fromEntries(results)});await audit(a.userId,labId,'lab.domain_requested','lab',labId,{domains});
 return reply(201,{requests,request:requests.length===1?requests[0]:null,paymentRequiredAfterReview:requests.some(r=>r.status!=='quoted')});
 }catch(e){if(e.status)return reply(e.status,{error:e.message});throw e;}
}
