import fs from 'node:fs';
const file='dist/api/server.js';let s=fs.readFileSync(file,'utf8');
const once=(a,b)=>{if(s.split(a).length!==2)throw Error('R2054 missing/ambiguous anchor: '+a.slice(0,90));s=s.replace(a,()=>b)};
if(!s.includes('/* PB2054 store login security */')){
 s="import {sendStoreLoginAlert,secureStorePassword} from './store-login-security.js';\n/* PB2054 store login security */\n"+s;
 once('async function notifyLabManagerSms(labId, eventKey, payload) {',`async function notifyStoreLoginSecurity(shopId,userId,kind='login'){try{return await sendStoreLoginAlert({pool,sendSms,audit,shopId,userId,publicAppUrl:PUBLIC_APP_URL,kind})}catch{await audit(userId,undefined,'store.login_security_sms_failed','equipment_rental_shop',shopId,{kind}).catch(()=>{})}}\nasync function notifyLabManagerSms(labId, eventKey, payload) {`);
 once('        return sendJson(res, 200, { ok: true, me });\n    };',`        if(wantsRental&&rentalShopId&&['shop_admin','handover_staff'].includes(rentalRole))void notifyStoreLoginSecurity(rentalShopId,user.id,rentalRole==='handover_staff'?'staff':'login');\n        return sendJson(res, 200, { ok: true, me });\n    };`);
 once("            await createSession(userId, res, 'rental');","            await createSession(userId, res, 'rental');\n            void notifyStoreLoginSecurity(shopId,userId);");
 once("    if (req.method === 'POST' && url.pathname === '/api/auth/password-reset/request') {",`    if(req.method==='POST'&&url.pathname==='/api/auth/store-login-security/action'){
      try{const input=await bodyJson(req,8192);return sendJson(res,200,await secureStorePassword({pool,input,passwordHash,tokenHash,audit}));}
      catch(e){if(e.status)return sendJson(res,e.status,{error:e.message});throw e;}
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/password-reset/request') {`);
 once("['retouch-account.html','account-recovery.html','lab-login-security.html'].includes(path.basename(full))","['retouch-account.html','account-recovery.html','lab-login-security.html','store-login-security.html'].includes(path.basename(full))");
 once('    const st = fs.statSync(full), contentType = mime(full)',`    if(path.basename(full)==='store-login-security.html'){res.setHeader('X-Frame-Options','DENY');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; img-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");res.setHeader('Referrer-Policy','no-referrer');}
    const st = fs.statSync(full), contentType = mime(full)`);
 fs.writeFileSync(file,s);
}
