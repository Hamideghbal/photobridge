import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import {domainToASCII} from 'node:url';
import {resolve4} from 'node:dns/promises';
import {isIP} from 'node:net';
import {channelItem,channelPrice,normalizeChannelPricing} from './storefront-pricing.js';
import {isProductionShop} from './frame-production.js';
import {normalizeFrameReceipt,frameBankDetails,normalizeFrameBank} from './frame-payments.js';
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const uuid=value=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value));
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
export function normalizeStoreDomain(value){const raw=String(value||'').trim().toLowerCase();if(/[\s/:@?#\\]/.test(raw))fail('invalid_store_domain');const host=domainToASCII(raw);if(!host||host.length>253||isIP(host)||!host.includes('.')||host.split('.').some(x=>!x||x.length>63||! /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(x))||/\.(local|localhost|internal|test|invalid)$/.test(host))fail('invalid_store_domain');return host;}
export function publicIPv4(value){if(isIP(value)!==4)return false;const [a,b,c]=value.split('.').map(Number);return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&(b===168||b===0||b===2)||a===100&&b>=64&&b<=127||a===198&&(b===18||b===19||b===51&&c===100)||a===203&&b===0&&c===113);}
async function bounded(promise){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('verification_timeout')),8000);timer.unref?.();})]);}finally{clearTimeout(timer);}}
export const pinnedStoreLookup=address=>(_host,options,callback)=>options?.all?callback(null,[{address,family:4}]):callback(null,address,4);
export async function routingProof(host,token,{resolve=resolve4,get=https.get}={}){const ips=await bounded(resolve(host));if(!ips.length||ips.some(ip=>!publicIPv4(ip)))return false;return await new Promise(resolve=>{const req=get({hostname:host,path:'/.well-known/photobridge-storefront',timeout:8000,lookup:pinnedStoreLookup(ips[0])},res=>{let text='';res.on('data',x=>{text+=x;if(text.length>1024)req.destroy();});res.on('end',()=>resolve(res.statusCode===200&&text.trim()===token));});req.on('timeout',()=>req.destroy());req.on('error',()=>resolve(false));});}
// Only platform admins assign a hostname to a shop. A TLS-verified response from
// that exact hostname containing its registered proof establishes the connection;
// a second, manual TXT challenge adds no requirement to this admin-managed flow.
export async function verifyStoreDomain(domain,{probe=routingProof}={}){const routed=await bounded(Promise.resolve().then(()=>probe(domain.hostname,domain.verification_token))).catch(()=>false);return {owned:Boolean(routed),routed:Boolean(routed)};}
async function activateStoreDomain(d,domain){const result=await (d.verifyDomain||verifyStoreDomain)(domain);if(result.routed)await d.pool.query('UPDATE equipment_store_domains SET verified_at=now(),routed_at=now(),active=true,updated_at=now() WHERE hostname=$1',[domain.hostname]);return {...result,status:result.routed?'active':'pending_hosting'};}

export function publicOrderTransition(current,action,production){const allowed={awaiting_receipt:{cancel:'cancelled'},pending_review:{approve:production?'in_production':'confirmed',reject:'awaiting_receipt',cancel:'cancelled'},in_production:{ready:'ready',cancel:'cancelled'},confirmed:{ready:'ready',cancel:'cancelled'},ready:{deliver:'delivered',cancel:'cancelled'}};const next=allowed[current]?.[action];if(!next)fail('invalid_store_order_transition',409);return next;}
export async function createPublicOrder(db,{shop,hostname,body}){
 if(shop.sale_enabled===false)fail('store_sales_unavailable',403);
 if(!/^[A-Za-z0-9_-]{43}$/.test(String(body.accessToken||'')))fail('invalid_order_token');
 if(!uuid(body.idempotencyKey)||!Array.isArray(body.items)||!body.items.length||body.items.length>50)fail('invalid_store_cart');
 const name=String(body.name||'').trim(),mobile=String(body.mobile||'').replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c));
 if(name.length<2||name.length>140||!/^09\d{9}$/.test(mobile))fail('invalid_customer_details');
 const address=String(body.address||'').trim();if(!['pickup','courier'].includes(body.deliveryMethod)||body.deliveryMethod==='courier'&&(address.length<10||address.length>1000))fail('delivery_address_required');
 const bank=frameBankDetails(shop);if(!bank.cardNumber&&!bank.iban)fail('bank_details_unavailable',409);
 const quantities=new Map();for(const row of body.items){if(!uuid(row.itemId)||!Number.isInteger(row.quantity)||row.quantity<1||row.quantity>99)fail('invalid_store_cart');quantities.set(row.itemId,(quantities.get(row.itemId)||0)+row.quantity);if(quantities.get(row.itemId)>99)fail('invalid_store_cart');}
 await db.query('BEGIN');try{
 await db.query('SELECT pg_advisory_xact_lock(hashtext($1))',[hostname+':'+body.idempotencyKey]);
 const previous=(await db.query('SELECT * FROM equipment_store_public_orders WHERE hostname=$1 AND idempotency_key=$2',[hostname,body.idempotencyKey])).rows[0];if(previous){if(previous.access_token_hash!==hash(body.accessToken))fail('order_already_submitted',409);await db.query('COMMIT');return {id:previous.id,accessToken:body.accessToken,totalAmount:Number(previous.total_amount),bankDetails:previous.bank_details,status:previous.status};}
 const ids=[...quantities.keys()].sort(),rows=(await db.query('SELECT * FROM equipment_sale_items WHERE shop_id=$1 AND id=ANY($2::uuid[]) AND active=true AND deleted_at IS NULL ORDER BY id FOR UPDATE',[shop.id,ids])).rows;
 if(rows.length!==ids.length)fail('store_cart_changed',409);
 const items=rows.map(row=>{const pricing=channelPrice(row,'website'),quantity=quantities.get(row.id);if(!pricing||!isProductionShop(shop)&&Number(row.stock_total)<quantity)fail('store_cart_changed',409);return {itemId:row.id,title:row.title,model:row.model,specs:((({salesChannels,...rest})=>rest)(row.variant_specs||{})),quantity,unitPrice:pricing.price,grossPrice:pricing.gross,discountPercent:pricing.discountPercent,total:pricing.price*quantity};});
 const total=items.reduce((sum,row)=>sum+row.total,0);if(!Number.isSafeInteger(total)||total<=0)fail('invalid_order_amount');
 const id=crypto.randomUUID(),token=body.accessToken;
 await db.query(`INSERT INTO equipment_store_public_orders(id,shop_id,hostname,access_token_hash,idempotency_key,customer_name,customer_mobile,delivery_method,delivery_address,items,total_amount,bank_details,stock_reserved) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$12::jsonb,$13)`,[id,shop.id,hostname,hash(token),body.idempotencyKey,name,mobile,body.deliveryMethod,body.deliveryMethod==='courier'?address:null,JSON.stringify(items),total,JSON.stringify(bank),false]);
 await db.query('COMMIT');return {id,accessToken:token,totalAmount:total,bankDetails:bank,status:'awaiting_receipt'};
 }catch(e){await db.query('ROLLBACK');throw e;}
}
// Images are served by the canonical PhotoBridge origin. On a merchant's own
// hostname, relative signed album-asset links otherwise hit the restricted
// storefront router and return 404. Do not expose main-app media routes there.
function storefrontImageUrl(url,origin){
 if(typeof url!=='string'||!/^\/(?:api\/album-asset(?:-preview)?\/|equipment-demo\/)/.test(url))return url;
 return new URL(url,origin).href;
}
function storefrontItemImages(item,origin){
 const out={...item};
 for(const key of ['image_url','thumbnail_url'])out[key]=storefrontImageUrl(out[key],origin);
 for(const key of ['image_urls','thumbnail_urls','color_image_urls','pricing_image_urls']){
  if(Array.isArray(out[key]))out[key]=out[key].map(url=>storefrontImageUrl(url,origin));
 }
 return out;
}
async function catalog(db,shop,publicItem,publicOrigin){const rows=shop.sale_enabled===false?[]:(await db.query('SELECT * FROM equipment_sale_items WHERE shop_id=$1 AND active=true AND deleted_at IS NULL ORDER BY title,id',[shop.id])).rows;return {shop:{id:shop.id,name:shop.name,description:shop.description,phone:shop.phone,address:shop.address,production:isProductionShop(shop),rentalEnabled:shop.rental_enabled!==false&&!isProductionShop(shop),saleEnabled:shop.sale_enabled!==false,platformOrigin:publicOrigin},items:rows.filter(row=>isProductionShop(shop)||Number(row.stock_total)>0).map(row=>channelItem(row,'website')).filter(Boolean).map(row=>storefrontItemImages(publicItem(row),publicOrigin))};}
export async function handleStorefrontManagement(req,res,url,a,d){
 const admin=url.pathname.startsWith('/api/admin/storefront/'),manager=url.pathname.startsWith('/api/rental/storefront/');if(!admin&&!manager)return false;
 const reply=(status,body)=>{d.sendJson(res,status,body);return true;};
 try{
 if(req.method!=='GET'&&req.headers.origin!==d.publicOrigin)return reply(403,{error:'invalid_origin'});
 const shop=manager?await d.currentShop(a):null;if(admin&&!d.requireRole(a,'platform_admin')||manager&&!shop)return reply(403,{error:'forbidden'});
 if(admin&&url.pathname==='/api/admin/storefront/domains'){
  if(req.method==='GET'){const domains=(await d.pool.query('SELECT d.*,s.name shop_name FROM equipment_store_domains d JOIN equipment_rental_shops s ON s.id=d.shop_id ORDER BY d.created_at DESC')).rows;return reply(200,{domains,dnsTarget:d.primaryHostname});}
  if(req.method==='POST'){const b=await d.bodyJson(req,10000),hostname=normalizeStoreDomain(b.hostname);if(hostname===d.primaryHostname||hostname.endsWith('.'+d.primaryHostname))fail('reserved_store_domain');if(!uuid(b.shopId))fail('invalid_shop');const exists=(await d.pool.query('SELECT id FROM equipment_rental_shops WHERE id=$1 AND deleted_at IS NULL',[b.shopId])).rows[0];if(!exists)fail('shop_not_found',404);const token='photobridge-'+crypto.randomBytes(24).toString('hex');await d.pool.query('INSERT INTO equipment_store_domains(hostname,shop_id,verification_token,created_by) VALUES($1,$2,$3,$4)',[hostname,b.shopId,token,a.userId]);await d.audit(a.userId,undefined,'storefront.domain_add','equipment_rental_shop',b.shopId,{hostname});const result=await activateStoreDomain(d,{hostname,verification_token:token});return reply(201,{hostname,...result});}
 }
 const domainRoute=url.pathname.match(/^\/api\/admin\/storefront\/domains\/([^/]+)(?:\/(verify))?$/);
 if(admin&&domainRoute){const hostname=normalizeStoreDomain(decodeURIComponent(domainRoute[1])),domain=(await d.pool.query('SELECT * FROM equipment_store_domains WHERE hostname=$1',[hostname])).rows[0];if(!domain)fail('domain_not_found',404);
  if(req.method==='DELETE'){await d.pool.query('UPDATE equipment_store_domains SET active=false,updated_at=now() WHERE hostname=$1',[hostname]);await d.audit(a.userId,undefined,'storefront.domain_disable','equipment_rental_shop',domain.shop_id,{hostname});return reply(200,{ok:true});}
  if(req.method==='POST'&&domainRoute[2]){const result=await activateStoreDomain(d,domain);await d.audit(a.userId,undefined,'storefront.domain_verify','equipment_rental_shop',domain.shop_id,{hostname,...result});return reply(200,result);}
 }
 if(manager&&url.pathname==='/api/rental/storefront/bank'){
 if(req.method==='GET')return reply(200,{bank:frameBankDetails(shop)});
 if(req.method==='PUT'){const bank=normalizeFrameBank(await d.bodyJson(req,10000));await d.pool.query('UPDATE equipment_rental_shops SET payment_card_number=$2,payment_iban=$3,payment_account_holder=$4,updated_at=now() WHERE id=$1',[shop.id,bank.cardNumber||null,bank.iban||null,bank.accountHolder||null]);await d.audit(a.userId,undefined,'storefront.bank_settings','equipment_rental_shop',shop.id,{hasCard:Boolean(bank.cardNumber),hasIban:Boolean(bank.iban)});return reply(200,{ok:true});}
 }
 if(manager&&url.pathname==='/api/rental/storefront/items'&&req.method==='GET')return reply(200,{items:(await d.pool.query('SELECT id,title,model,sale_price,variant_specs FROM equipment_sale_items WHERE shop_id=$1 AND deleted_at IS NULL ORDER BY title,id',[shop.id])).rows});
 if(manager&&url.pathname==='/api/rental/storefront/preview'&&req.method==='GET')return reply(200,{...await catalog(d.pool,shop,d.publicItem,d.publicOrigin),preview:true});
 const itemRoute=url.pathname.match(/^\/api\/rental\/storefront\/items\/([0-9a-f-]{36})$/i);
 if(manager&&itemRoute&&req.method==='PUT'){const b=await d.bodyJson(req,10000),c=await d.pool.connect();try{await c.query('BEGIN');const item=(await c.query('SELECT * FROM equipment_sale_items WHERE id=$1 AND shop_id=$2 AND deleted_at IS NULL FOR UPDATE',[itemRoute[1],shop.id])).rows[0];if(!item)fail('sale_item_not_found',404);const pricing=normalizeChannelPricing(b.salesChannels,item.variant_specs?.salesChannels,item.sale_price);await c.query("UPDATE equipment_sale_items SET variant_specs=jsonb_set(COALESCE(variant_specs,'{}'::jsonb),'{salesChannels}',$3::jsonb),updated_at=now() WHERE id=$1 AND shop_id=$2",[item.id,shop.id,JSON.stringify(pricing)]);await c.query('COMMIT');return reply(200,{ok:true});}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
 if(manager&&url.pathname==='/api/rental/storefront/orders'&&req.method==='GET')return reply(200,{orders:(await d.pool.query('SELECT id,hostname,customer_name,customer_mobile,delivery_method,delivery_address,items,total_amount,status,receipt_submitted_at,review_note,created_at FROM equipment_store_public_orders WHERE shop_id=$1 ORDER BY created_at DESC LIMIT 150',[shop.id])).rows});
 const orderRoute=url.pathname.match(/^\/api\/rental\/storefront\/orders\/([0-9a-f-]{36})(?:\/(receipt))?$/i);
 if(manager&&orderRoute){const id=orderRoute[1];if(req.method==='GET'&&orderRoute[2]){const order=(await d.pool.query('SELECT receipt_object_key FROM equipment_store_public_orders WHERE id=$1 AND shop_id=$2',[id,shop.id])).rows[0];if(!order?.receipt_object_key)fail('receipt_not_found',404);const buffer=await d.readObject(order.receipt_object_key);res.writeHead(200,{'content-type':'image/jpeg','cache-control':'private, no-store','x-content-type-options':'nosniff'});res.end(buffer);return true;}
 if(req.method==='PATCH'&&!orderRoute[2]){const b=await d.bodyJson(req,10000),c=await d.pool.connect();try{await c.query('BEGIN');const row=(await c.query('SELECT * FROM equipment_store_public_orders WHERE id=$1 AND shop_id=$2 FOR UPDATE',[id,shop.id])).rows[0];if(!row)fail('order_not_found',404);if(b.action==='approve'&&!row.receipt_object_key)fail('receipt_required',409);const status=publicOrderTransition(row.status,b.action,isProductionShop(shop));let reserved=row.stock_reserved;if(b.action==='approve'&&!isProductionShop(shop)&&!reserved){for(const item of [...row.items].sort((a,b)=>a.itemId.localeCompare(b.itemId))){const changed=await c.query('UPDATE equipment_sale_items SET stock_total=stock_total-$2,updated_at=now() WHERE id=$1 AND shop_id=$3 AND stock_total>=$2 AND deleted_at IS NULL RETURNING id',[item.itemId,item.quantity,shop.id]);if(!changed.rows.length)fail('store_cart_changed',409);}reserved=true;}if(status==='cancelled'&&reserved)for(const item of row.items)await c.query('UPDATE equipment_sale_items SET stock_total=stock_total+$2,updated_at=now() WHERE id=$1 AND shop_id=$3',[item.itemId,item.quantity,shop.id]);await c.query('UPDATE equipment_store_public_orders SET status=$3,review_note=$4,stock_reserved=CASE WHEN $3=\'cancelled\' THEN false ELSE $5 END,updated_at=now() WHERE id=$1 AND shop_id=$2',[id,shop.id,status,String(b.note||'').slice(0,500),reserved]);await d.audit(a.userId,undefined,'storefront.order_'+b.action,'equipment_store_public_order',id,{shopId:shop.id});await c.query('COMMIT');return reply(200,{ok:true,status});}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}}
 return reply(404,{error:'not_found'});
 }catch(e){if(e.code==='23505')return reply(409,{error:'domain_already_registered'});if(e.status)return reply(e.status,{error:e.message});throw e;}
}
// Fail closed: the branded photographer flow delegates narrowly to the current
// authenticated customer API, which enforces verified identity and memberships.
export function equipmentPhotographerRoute(req,url,shop){
 if(isProductionShop(shop)||shop.rental_enabled!==true)return false;
 if(req.headers.authorization||req.headers['x-photobridge-impersonation'])return false;
 const p=url.pathname,m=req.method;
 if(m==='POST'&&['/api/auth/customer-login','/api/auth/logout','/api/customer/equipment-rental/availability','/api/customer/equipment-rental/bookings','/api/customer/equipment-rental/collaboration-requests'].includes(p))return true;
 if(m==='GET'&&['/api/auth/me','/api/customer/equipment-rental/bookings'].includes(p))return true;
 if(m==='GET'&&p==='/api/customer/equipment-rental/items')return url.searchParams.get('shopId')===String(shop.id);
 if(m==='PUT'&&p===`/api/customer/equipment-rental/shops/${shop.id}/membership-profile`)return true;
 return false;
}
export async function handleCustomStorefront(req,res,url,d){
 const raw=String(req.headers.host||'').toLowerCase(),host=raw.replace(/:\d+$/,'');if(host===d.primaryHostname||host==='www.'+d.primaryHostname||(d.platformHosts||[]).includes(host)||host==='localhost'||host==='127.0.0.1')return false;
 const reply=(status,body)=>{d.sendJson(res,status,body);return true;};
 try{
 const domain=(await d.pool.query('SELECT * FROM equipment_store_domains WHERE hostname=$1',[host])).rows[0];if(!domain)return reply(404,{error:'unknown_store_domain'});
 if(req.method==='GET'&&url.pathname==='/.well-known/photobridge-storefront'){res.writeHead(200,{'content-type':'text/plain','cache-control':'no-store'});res.end(domain.verification_token);return true;}
 if(!domain.active||!domain.verified_at||!domain.routed_at)return reply(503,{error:'store_domain_pending'});
 const shop=(await d.pool.query("SELECT * FROM equipment_rental_shops WHERE id=$1 AND active=true AND (COALESCE(sale_enabled,false)=true OR COALESCE(rental_enabled,false)=true) AND COALESCE(suspended,false)=false AND (active_from IS NULL OR active_from<=now()) AND (active_until IS NULL OR active_until>=now()) AND deleted_at IS NULL",[domain.shop_id])).rows[0];if(!shop)return reply(404,{error:'store_unavailable'});
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
 const assets={'/':['storefront.html','text/html; charset=utf-8'],'/storefront.js':['storefront.js','application/javascript; charset=utf-8'],'/storefront.css':['storefront.css','text/css; charset=utf-8'],'/storefront-rental.js':['storefront-rental.js','application/javascript; charset=utf-8'],'/photobridge-r1207-frame-catalog.js':['photobridge-r1207-frame-catalog.js','application/javascript; charset=utf-8'],'/assets/photobridge-handover-vazirmatn.woff2':['assets/photobridge-handover-vazirmatn.woff2','font/woff2']};
 if(req.method==='GET'&&Object.hasOwn(assets,url.pathname)){const [file,contentType]=assets[url.pathname],body=fs.readFileSync(path.join(d.webRoot,file));res.writeHead(200,{'content-type':contentType,'content-security-policy':"default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"});res.end(body);return true;}
 if(req.method==='GET'&&url.pathname==='/api/storefront/catalog')return reply(200,await catalog(d.pool,shop,d.publicItem,d.publicOrigin));
 // Only these existing photographer API actions may run on equipment-shop hosts.
 // Leave authentication, membership, dates, stock and pricing to their original
 // PhotoBridge handlers; never grant access to /api/admin, /api/rental or labs.
 if(equipmentPhotographerRoute(req,url,shop)){
  if(req.method!=='GET'&&req.headers.origin!==`https://${host}`)return reply(403,{error:'invalid_origin'});
  if(req.method!=='GET'&&!d.rateAllowed(req,host))return reply(429,{error:'try_again_later'});
  req.headers['x-photobridge-portal']='photographer';
  return false;
 }
 if(req.method!=='GET'&&req.headers.origin!==`https://${host}`)return reply(403,{error:'invalid_origin'});
 if(url.pathname==='/api/storefront/orders'&&req.method==='POST'){if(!d.rateAllowed(req,host))return reply(429,{error:'try_again_later'});const body=await d.bodyJson(req,100000),c=await d.pool.connect();try{return reply(201,await createPublicOrder(c,{shop,hostname:host,body}));}finally{c.release();}}
 const route=url.pathname.match(/^\/api\/storefront\/orders\/([0-9a-f-]{36})(?:\/(receipt))?$/i);
 if(route){const token=String(req.headers.authorization||'').replace(/^Bearer /,'');if(!/^[A-Za-z0-9_-]{43}$/.test(token))return reply(404,{error:'order_not_found'});const row=(await d.pool.query('SELECT * FROM equipment_store_public_orders WHERE id=$1 AND shop_id=$2 AND hostname=$3 AND access_token_hash=$4',[route[1],shop.id,host,hash(token)])).rows[0];if(!row)fail('order_not_found',404);
 if(req.method==='GET'&&!route[2])return reply(200,{order:{id:row.id,status:row.status,totalAmount:Number(row.total_amount),items:row.items,bankDetails:row.bank_details,reviewNote:row.review_note,hasReceipt:Boolean(row.receipt_object_key)}});
 if(req.method==='POST'&&route[2]){if(!d.rateAllowed(req,host))return reply(429,{error:'try_again_later'});const buffer=await normalizeFrameReceipt(await d.bodyJson(req,9000000),d.sharp),c=await d.pool.connect();let key;try{await c.query('BEGIN');const locked=(await c.query('SELECT status,receipt_object_key FROM equipment_store_public_orders WHERE id=$1 AND shop_id=$2 FOR UPDATE',[row.id,shop.id])).rows[0];if(locked.status!=='awaiting_receipt')fail('receipt_not_replaceable',409);key=await d.storeReceipt(shop.id,row.id,crypto.randomUUID(),buffer);await c.query("UPDATE equipment_store_public_orders SET receipt_object_key=$2,receipt_submitted_at=now(),status='pending_review',updated_at=now() WHERE id=$1",[row.id,key]);await c.query('COMMIT');if(locked.receipt_object_key)await d.deleteObject(locked.receipt_object_key).catch(()=>{});return reply(200,{ok:true});}catch(e){await c.query('ROLLBACK');if(key)await d.deleteObject(key);throw e;}finally{c.release();}}
 }
 return reply(404,{error:'not_found'});
 }catch(e){if(e.status)return reply(e.status,{error:e.message});throw e;}
}
