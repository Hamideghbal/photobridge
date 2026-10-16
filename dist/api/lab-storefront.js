import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {renderLabPage,labSitePages,labSitemap} from './lab-site-content.js';
export function labHomepage(lab,origin,saved={},options={}){return renderLabPage(lab,saved,origin,options).html;}
export async function handleLabDomain(req,res,url,domain,d){
 const reply=(status,body)=>{d.sendJson(res,status,body);return true;};
 const lab=(await d.pool.query('SELECT id,name,slug,province,city,walkin_enabled,walkin_show_prices FROM labs WHERE id=$1 AND active=true AND COALESCE(suspended,false)=false AND COALESCE(service_only,false)=false AND (active_from IS NULL OR active_from<=now()) AND (active_until IS NULL OR active_until>=now())',[domain.lab_id])).rows[0];
 if(!lab)return reply(404,{error:'lab_unavailable'});
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method==='GET'&&url.pathname==='/robots.txt'){res.writeHead(200,{'content-type':'text/plain; charset=utf-8'});res.end('User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /walkin/\nSitemap: https://'+domain.hostname+'/sitemap.xml\n');return true;}
 if(req.method==='GET'&&url.pathname==='/sitemap.xml'){res.writeHead(200,{'content-type':'application/xml; charset=utf-8'});res.end(labSitemap(lab,domain.hostname));return true;}
 if(req.method==='GET'&&url.pathname==='/lab-storefront.css'){res.writeHead(200,{'content-type':'text/css; charset=utf-8'});res.end(fs.readFileSync(path.join(d.webRoot,'lab-storefront.css')));return true;}
 const siteAssets={'/lab-site/print-studio.webp':'print-studio.webp','/lab-site/print-detail.webp':'print-detail.webp','/lab-site/print-wall.webp':'print-wall.webp'};
 if(req.method==='GET'&&Object.hasOwn(siteAssets,url.pathname)){res.writeHead(200,{'content-type':'image/webp','cache-control':'public,max-age=86400'});res.end(fs.readFileSync(path.join(d.webRoot,'lab-site',siteAssets[url.pathname])));return true;}
 if(req.method==='GET'&&url.pathname.length>1&&url.pathname.endsWith('/')&&labSitePages(lab).some(([p])=>p===url.pathname.slice(0,-1))){res.writeHead(308,{location:url.pathname.slice(0,-1)});res.end();return true;}
 if(req.method==='GET'&&labSitePages(lab).some(([p])=>p===url.pathname)){
  const saved=(await d.pool.query('SELECT config FROM lab_public_site_content WHERE lab_id=$1',[lab.id])).rows[0]?.config||{};
  const prices=url.pathname==='/prices'&&lab.walkin_enabled&&lab.walkin_show_prices!==false?(await d.pool.query(`SELECT s.label,w.luster,w.silk,w.metallic FROM print_sizes s JOIN walkin_prices w ON w.lab_id=$1 AND w.size_id=s.id WHERE s.active=true AND (s.owner_lab_id IS NULL OR s.owner_lab_id=$1) AND NOT EXISTS(SELECT 1 FROM lab_hidden_print_sizes h WHERE h.lab_id=$1 AND h.size_id=s.id) AND (w.luster IS NOT NULL OR w.silk IS NOT NULL OR w.metallic IS NOT NULL) ORDER BY s.width_cm,s.height_cm,s.label`,[lab.id])).rows:[];
  const nonce=crypto.randomBytes(16).toString('base64'),page=renderLabPage(lab,saved,d.publicOrigin,{pathname:url.pathname,hostname:domain.hostname,prices,nonce});
  res.writeHead(page.status,{'content-type':'text/html; charset=utf-8','content-security-policy':"default-src 'self'; script-src 'self' 'nonce-"+nonce+"'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'"});res.end(page.html);return true;
 }
 // Reuse the complete, existing public print UI and its upload/crop workflow.
 // A custom host never grants a photographer session or exposes other labs.
 if(req.method==='GET'&&url.pathname==='/walkin/'+encodeURIComponent(lab.slug))return false;
 if(url.pathname.startsWith('/api/public/walkin/')){
  if(!lab.walkin_enabled)return reply(403,{error:'walkin_unavailable'});
  if(req.method!=='GET'&&req.headers.origin!=='https://'+domain.hostname)return reply(403,{error:'invalid_origin'});
  const prefix='/api/public/walkin/',rest=url.pathname.slice(prefix.length);
  const slugRoute=rest===encodeURIComponent(lab.slug)||rest===encodeURIComponent(lab.slug)+'/orders';
  const tokenRoute=/^orders\/[0-9a-f-]+\/(?:uploads\/presign|submit)$/.test(rest)||/^uploads\/local\/[0-9a-f-]+$/.test(rest)||rest==='uploads/complete';
  if(!slugRoute&&!tokenRoute)return reply(404,{error:'not_found'});
  if(req.method==='POST'&&rest===encodeURIComponent(lab.slug)+'/orders'&&!d.rateAllowed(req,domain.hostname))return reply(429,{error:'try_again_later'});
  req.labDomainId=lab.id;return false;
 }
 if(req.method==='GET'&&['/api/me','/api/auth/me'].includes(url.pathname))return reply(401,{error:'unauthorized'});
 if(req.method==='GET'&&url.pathname==='/api/network/country')return false;
 // Only static browser resources pass through, never arbitrary application pages.
 if(req.method==='GET'&&/^\/(?:assets\/|photobridge-)[a-zA-Z0-9_./-]+\.(?:js|css|woff2?|png|jpg|svg|ico)$/.test(url.pathname))return false;
 if(req.method==='GET'&&!url.pathname.startsWith('/api/')){const saved=(await d.pool.query('SELECT config FROM lab_public_site_content WHERE lab_id=$1',[lab.id])).rows[0]?.config||{};const page=renderLabPage(lab,saved,d.publicOrigin,{pathname:url.pathname,hostname:domain.hostname});res.writeHead(404,{'content-type':'text/html; charset=utf-8','x-robots-tag':'noindex, nofollow'});res.end(page.html);return true;}
 return reply(404,{error:'not_found'});
}
