import crypto from 'node:crypto';
const fail=(code,status=400)=>{throw Object.assign(new Error(code),{status});};
export function normalizeSiteReview(input){
 if(!input||typeof input!=='object'||Array.isArray(input))fail('invalid_review');
 const name=typeof input.name==='string'?input.name.trim():'',body=typeof input.body==='string'?input.body.trim():'';
 if(name.length<2||name.length>80||body.length<5||body.length>2000||!Number.isInteger(input.rating)||input.rating<1||input.rating>5||input.website)fail('invalid_review');
 return {name,body,rating:input.rating};
}
export async function publicSiteReviews(req,res,url,shop,host,d){
 if(url.pathname!=='/api/storefront/reviews')return false;
 const reply=(s,b)=>{d.sendJson(res,s,b);return true;};
 if(req.method==='GET')return reply(200,{reviews:(await d.pool.query("SELECT id,author_name,rating,body,created_at FROM equipment_store_site_reviews WHERE shop_id=$1 AND status='approved' ORDER BY created_at DESC LIMIT 100",[shop.id])).rows});
 if(req.method!=='POST')return reply(405,{error:'method_not_allowed'});
 if(req.headers.origin!==`https://${host}`)return reply(403,{error:'invalid_origin'});
 if(!d.rateAllowed(req,'reviews:'+host))return reply(429,{error:'try_again_later'});
 const value=normalizeSiteReview(await d.bodyJson(req,12000));
 await d.pool.query('INSERT INTO equipment_store_site_reviews(id,shop_id,hostname,author_name,rating,body) VALUES($1,$2,$3,$4,$5,$6)',[crypto.randomUUID(),shop.id,host,value.name,value.rating,value.body]);
 return reply(201,{ok:true,status:'pending'});
}
export async function manageSiteReviews(req,res,url,actor,shop,d){
 const match=url.pathname.match(/^\/api\/rental\/storefront\/reviews(?:\/([0-9a-f-]{36}))?$/i);if(!match)return false;
 const reply=(s,b)=>{d.sendJson(res,s,b);return true;};
 if(actor?.rentalRole!=='shop_admin'||!shop)return reply(403,{error:'forbidden'});
 if(req.method==='GET'&&!match[1])return reply(200,{reviews:(await d.pool.query("SELECT id,author_name,rating,body,status,created_at FROM equipment_store_site_reviews WHERE shop_id=$1 ORDER BY (status='pending') DESC,created_at DESC LIMIT 100",[shop.id])).rows});
 if(req.method!=='PATCH'||!match[1])return reply(405,{error:'method_not_allowed'});
 if(req.headers.origin!==d.publicOrigin)return reply(403,{error:'invalid_origin'});
 const body=await d.bodyJson(req,1000);if(!['approved','rejected'].includes(body?.status))return reply(400,{error:'invalid_review_status'});
 const result=await d.pool.query('UPDATE equipment_store_site_reviews SET status=$3,reviewed_by=$4,reviewed_at=now() WHERE id=$1 AND shop_id=$2 RETURNING id',[match[1],shop.id,body.status,actor.userId]);
 if(!result.rows.length)return reply(404,{error:'review_not_found'});
 await d.audit(actor.userId,undefined,'storefront.review_'+body.status,'equipment_store_site_review',match[1],{shopId:shop.id});return reply(200,{ok:true});
}
export const reviewsMarkup=`<section class="site-reviews"><h2>نظر و امتیاز شما</h2><p>تجربهٔ خود را از فروشگاه بنویسید. نظر شما پس از بررسی مدیر نمایش داده می‌شود.</p><form id="siteReviewForm"><label>نام شما<input name="name" minlength="2" maxlength="80" autocomplete="name" required></label><label>امتیاز شما<select name="rating" required><option value="">انتخاب امتیاز</option><option value="5">۵ — عالی</option><option value="4">۴ — خوب</option><option value="3">۳ — متوسط</option><option value="2">۲ — ضعیف</option><option value="1">۱ — بسیار ضعیف</option></select></label><label class="review-trap" aria-hidden="true">وب‌سایت<input name="website" tabindex="-1" autocomplete="off"></label><label class="review-body">نظر شما<textarea name="body" minlength="5" maxlength="2000" rows="4" required></textarea></label><button class="primary" type="submit">ارسال نظر</button><p id="reviewNotice" role="status" aria-live="polite"></p></form><h2>نظر کاربران</h2><p id="reviewSummary"></p><div id="siteReviewsList" aria-live="polite"></div></section>`;
