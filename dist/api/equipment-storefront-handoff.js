import crypto from 'node:crypto';

const fail=(res,d,status,error)=>{d.sendJson(res,status,{error});return true;};
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const codePattern=/^[a-zA-Z0-9_-]{43}$/;
const primaryHost=(req,d)=>String(req.headers.host||'').replace(/:\d+$/,'').toLowerCase()===d.primaryHostname;

export async function equipmentStorefrontLoginHandoff(req,res,url,shop,hostname,d){
  const p=url.pathname;
  if(shop&&p==='/api/auth/equipment-store-handoff'){
    if(req.method!=='POST')return fail(res,d,405,'method_not_allowed');
    // Only allow an explicit POST made from the live, active shop hostname.
    if(req.headers.origin!==`https://${hostname}`)return fail(res,d,403,'invalid_origin');
    if(req.headers.authorization||req.headers['x-photobridge-impersonation'])return fail(res,d,403,'forbidden');
    if(!d.rateAllowed(req,hostname))return fail(res,d,429,'try_again_later');
    req.headers['x-photobridge-portal']='photographer';
    const actor=await d.auth(req);
    if(!actor||actor.labRole!=='customer')return fail(res,d,401,'photographer_auth_required');
    // The primary and custom hosts share the DB but never their session cookies.
    // Only a SHA-256 digest is stored; code expires after 90 seconds and can
    // be redeemed exactly once.
    const code=crypto.randomBytes(32).toString('base64url');
    await d.pool.query('DELETE FROM equipment_storefront_login_handoffs WHERE expires_at<=now()');
    await d.pool.query(`INSERT INTO equipment_storefront_login_handoffs(code_hash,user_id,shop_id,source_hostname)
      VALUES($1,$2,$3,$4)`,[sha256(code),actor.userId,shop.id,hostname]);
    res.setHeader('Cache-Control','no-store');
    return d.sendJson(res,200,{ok:true,redirectUrl:d.publicOrigin+'/auth/equipment-store-handoff?code='+encodeURIComponent(code)}),true;
  }
  if(!shop&&p==='/auth/equipment-store-handoff'&&primaryHost(req,d)){
    if(req.method!=='GET')return fail(res,d,405,'method_not_allowed');
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('Referrer-Policy','no-referrer');
    res.setHeader('X-Robots-Tag','noindex, nofollow');
    const code=String(url.searchParams.get('code')||'');
    if(!codePattern.test(code))return fail(res,d,410,'handoff_expired');
    // DELETE ... RETURNING is atomic across all Liara instances, preventing replay.
    const row=(await d.pool.query(`DELETE FROM equipment_storefront_login_handoffs
      WHERE code_hash=$1 AND expires_at>now()
      RETURNING user_id,shop_id`,[sha256(code)])).rows[0];
    if(!row)return fail(res,d,410,'handoff_expired');
    const sessionToken=await d.createSessionToken(row.user_id);
    d.setSessionCookie(res,sessionToken,'photographer');
    res.writeHead(303,{Location:'/equipment-rental/book?panel=rental&shopId='+encodeURIComponent(row.shop_id),'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'});
    res.end();
    return true;
  }
  return false;
}
