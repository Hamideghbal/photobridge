import fs from 'node:fs';
const file='dist/api/server.js';let s=fs.readFileSync(file,'utf8');
if(!s.includes('/* PB1377 direct domain gateway */')){
 s="import {handleDomainCallback,startDomainAlertWorker} from './lab-domain-gateway.js';\nimport {handleDomainAdminApi} from './lab-domain-admin.js';\n"+s;
 const before='handleLabDomainRequests({req,res,url,a,pool,bodyJson,sendJson,audit,ensureWallet:serviceWalletEnsure,publicOrigin:new URL(PUBLIC_APP_URL).origin})';if(s.split(before).length!==3)throw Error('R1377 changed domain routers');s=s.replaceAll(before,before.replace('ensureWallet:serviceWalletEnsure,','ensureWallet:serviceWalletEnsure,gateway:zibalPost,merchant:ZIBAL_MERCHANT,multiplier:ZIBAL_AMOUNT_MULTIPLIER,'));
 const callback="if (req.method === 'GET' && url.pathname === '/api/payments/zibal/service-wallet/callback') {";if(s.split(callback).length!==2)throw Error('R1377 changed callback insertion');s=s.replace(callback,`/* PB1377 direct domain gateway */
    if(await handleDomainCallback({req,res,url,pool,gateway:zibalPost,merchant:ZIBAL_MERCHANT,publicOrigin:new URL(PUBLIC_APP_URL).origin,notifyAdmin:sendDomainOrderAdminAlert}))return;
    `+callback);
 const admin="if(url.pathname.startsWith('/api/admin/labs/')&&url.pathname.includes('/domain-requests'))";if(s.split(admin).length!==2)throw Error('R1377 changed admin insertion');s=s.replace(admin,"if(await handleDomainAdminApi({req,res,url,a,pool,sendJson,publicOrigin:new URL(PUBLIC_APP_URL).origin,gateway:zibalPost,merchant:ZIBAL_MERCHANT,notifyAdmin:sendDomainOrderAdminAlert}))return;\n    "+admin);
 const fn='async function notifyPlatformAdminSms(';if(s.split(fn).length!==2)throw Error('R1377 changed admin SMS adapter');s=s.replace(fn,`async function sendDomainOrderAdminAlert(message,labId){
 const cfg=await resolvedSMSSettings();if(!cfg.configured||!cfg.notificationsEnabled||!cfg.adminAlertsEnabled||cfg.events?.domain_order_paid===false)throw Error('admin_sms_disabled');
 const q=await pool.query("SELECT id,mobile FROM users WHERE platform_role='platform_admin' AND active=true AND mobile IS NOT NULL ORDER BY created_at LIMIT 1");if(!q.rows[0])throw Error('admin_mobile_missing');
 const out=await sendSms({mobile:q.rows[0].mobile,message,purpose:'admin_alert',eventKey:'domain_order_paid',userId:q.rows[0].id,labId,requireNotificationsEnabled:true});return {sent:true,reference:out?.reference||null};
}
`+fn);
 const serve="if(req.method==='GET'&&['/rental/storefront','/admin/storefront'].includes(url.pathname)){";if(s.split(serve).length!==2)throw Error('R1377 changed page insertion');s=s.replace(serve,`if(req.method==='GET'&&url.pathname==='/admin/domain-orders'){
 const actor=await auth(req);if(!requireRole(actor,'platform_admin'))return sendJson(res,403,{error:'forbidden'});const html=fs.readFileSync(path.join(DIST_ROOT,'web','domain-orders-admin.html'));res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-robots-tag':'noindex','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"});return res.end(html);
}
`+serve);
 const worker='startIntakeInvoiceSmsWorker({pool,sendSms,normalizeMobile});';if(s.split(worker).length!==2)throw Error('R1377 changed worker insertion');s=s.replace(worker,worker+'startDomainAlertWorker({pool,notifyAdmin:sendDomainOrderAdminAlert});');fs.writeFileSync(file,s);
}
const main='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(main,'utf8');if(!ui.includes('/* PB1377 domain admin nav */')){const before='children:"لابراتوارها"}),e.jsx("button",{type:"button",className:"pb771AppearanceAdminTab"';if(ui.split(before).length!==2)throw Error('R1377 changed admin tab anchor');ui=ui.replace(before,'children:"لابراتوارها"}),e.jsx("a",{href:"/admin/domain-orders",children:"سفارش‌های دامنه"}),e.jsx("button",{type:"button",className:"pb771AppearanceAdminTab"');ui+='\n/* PB1377 domain admin nav */\n';fs.writeFileSync(main,ui);}
const p='dist/web/index.html';let html=fs.readFileSync(p,'utf8');html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,u=>u.includes('&domainGateway=')?u.replace(/&domainGateway=[^&"']*/g,'&domainGateway=r1377'):u+'&domainGateway=r1377');fs.writeFileSync(p,html);
