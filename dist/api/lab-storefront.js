import fs from 'node:fs';
import path from 'node:path';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function labHomepage(lab,origin){
 const print=lab.walkin_enabled?'<a class="primary" href="/walkin/'+encodeURIComponent(lab.slug)+'">ثبت سفارش چاپ آزاد</a>':'<p>پذیرش اینترنتی چاپ آزاد در حال حاضر غیرفعال است.</p>';
 return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(lab.name)} | چاپ عکس</title><link rel="stylesheet" href="/lab-storefront.css?v=r1264"></head><body><header><a class="brand" href="/">${esc(lab.name)}</a><nav><a href="#services">خدمات</a><a href="#about">معرفی لابراتوار</a><a href="${esc(origin)}/photographer">ورود عکاسان</a></nav></header><main><section class="hero"><span class="eyebrow">لابراتوار چاپ عکس</span><h1>${esc(lab.name)}</h1><p>عکس‌های شما، آمادهٔ چاپ. سفارش خود را با انتخاب اندازه و نوع چاپ، مستقیم برای لابراتوار ارسال کنید.</p><div class="actions">${print}<a class="secondary" href="${esc(origin)}/photographer">ورود عکاسان همکار</a></div><small>چاپ آزاد بدون عضویت عکاسی، با تعرفهٔ آزاد لابراتوار</small></section><section id="services" class="cards"><article><span class="number">۰۱</span><h2>چاپ برای همه</h2><p>عکس‌ها را بارگذاری کنید، اندازه و جنس چاپ را انتخاب کنید و سفارش را ثبت کنید. شمارهٔ سفارش برای پیگیری به شما نمایش داده می‌شود.</p>${print}</article><article><span class="number">۰۲</span><h2>پنل عکاسان</h2><p>با حساب فوتوبریج وارد شوید و به تمام امکانات فعلی پنل خود، از ارسال سفارش تا پیگیری و امور مالی، دسترسی داشته باشید. دسترسی به لابراتوار مطابق عضویت فعلی شماست.</p><a class="secondary" href="${esc(origin)}/photographer">ورود به پنل کامل عکاس</a></article></section><section id="about" class="about"><h2>دربارهٔ ${esc(lab.name)}</h2><p>پذیرش آنلاین سفارش چاپ عکس؛ انتخاب اندازه‌ها و خدمات بر اساس موارد فعال و قیمت‌های ثبت‌شده توسط لابراتوار انجام می‌شود.</p>${lab.province||lab.city?'<p>'+esc([lab.province,lab.city].filter(Boolean).join('، '))+'</p>':''}<p>برای مشتری عمومی، تعرفهٔ چاپ آزاد اعمال می‌شود. قیمت و دسترسی عکاسان همکار در پنل خودشان مطابق تنظیمات همکاری است.</p></section></main><footer>${esc(lab.name)} · پذیرش آنلاین چاپ عکس</footer></body></html>`;
}
export async function handleLabDomain(req,res,url,domain,d){
 const reply=(status,body)=>{d.sendJson(res,status,body);return true;};
 const lab=(await d.pool.query('SELECT id,name,slug,province,city,walkin_enabled FROM labs WHERE id=$1 AND active=true AND COALESCE(suspended,false)=false AND COALESCE(service_only,false)=false AND (active_from IS NULL OR active_from<=now()) AND (active_until IS NULL OR active_until>=now())',[domain.lab_id])).rows[0];
 if(!lab)return reply(404,{error:'lab_unavailable'});
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method==='GET'&&url.pathname==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','content-security-policy':"default-src 'self'; style-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'"});res.end(labHomepage(lab,d.publicOrigin));return true;}
 if(req.method==='GET'&&url.pathname==='/lab-storefront.css'){res.writeHead(200,{'content-type':'text/css; charset=utf-8'});res.end(fs.readFileSync(path.join(d.webRoot,'lab-storefront.css')));return true;}
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
 return reply(404,{error:'not_found'});
}
