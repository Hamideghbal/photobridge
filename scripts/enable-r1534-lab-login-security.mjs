import fs from 'node:fs';
const file='dist/api/server.js';let s=fs.readFileSync(file,'utf8');
const once=(a,b)=>{if(s.split(a).length!==2)throw Error('R1534 startup anchor changed: '+a.slice(0,90));s=s.replace(a,b)};
if(!s.includes('/* PB1534 lab login security */')){
 s="import {sendLabLoginAlert,disableLabPassword} from './lab-login-security.js';\n/* PB1534 lab login security */\n"+s;
 const helper=`async function notifyLabLoginSecurity(labId,userId,req,kind='login'){try{return await sendLabLoginAlert({pool,sendSms,audit,labId,userId,publicAppUrl:PUBLIC_APP_URL,kind})}catch{await audit(userId,labId,'lab.login_security_sms_failed','user',userId,{kind}).catch(()=>{});}}\n`;
 once('async function notifyLabManagerSms(labId, eventKey, payload) {',helper+'async function notifyLabManagerSms(labId, eventKey, payload) {');
 once('        return sendJson(res, 200, { ok: true, me });\n    };',"        if(labRole==='lab_admin'&&labId)void notifyLabLoginSecurity(labId,user.id,req);\n        return sendJson(res, 200, { ok: true, me });\n    };");
 once("        await createSession(out.userId, res, 'lab');","        await createSession(out.userId, res, 'lab');\n        void notifyLabLoginSecurity(out.lab.id,out.userId,req);");
 once("        await createSession(q.rows[0].id, res, 'lab');","        await createSession(q.rows[0].id, res, 'lab');\n        void notifyLabLoginSecurity(adminEnter[1],q.rows[0].id,req,'admin');");
 once("        const raw = await createSessionToken(q.rows[0].id, '2 hours');","        const raw = await createSessionToken(q.rows[0].id, '2 hours');\n        void notifyLabLoginSecurity(adminTestSession[1],q.rows[0].id,req,'admin');");
 once("        const hash = new URLSearchParams({ impersonation: raw, role: 'lab',", "        void notifyLabLoginSecurity(row.lab_id,row.id,req,'admin');\n        const hash = new URLSearchParams({ impersonation: raw, role: 'lab',");
 // Do not alter the established reset/change-password routes or their guards.
 once("    if (req.method === 'POST' && url.pathname === '/api/auth/password-reset/request') {",`    if(req.method==='POST'&&url.pathname==='/api/auth/lab-login-security/disable-password'){
        try{const input=await bodyJson(req,8192);const result=await disableLabPassword({pool,input,passwordHash,tokenHash,audit});return sendJson(res,200,result);}catch(error){if(['security_confirmation_required','reset_invalid','lab_manager_required','existing_account_invalid'].includes(error.message))return sendJson(res,error.status||400,{error:error.message});throw error;}
    }
    if (req.method === 'POST' && url.pathname === '/api/auth/password-reset/request') {`);
 once("['retouch-account.html','account-recovery.html'].includes(path.basename(full))","['retouch-account.html','account-recovery.html','lab-login-security.html'].includes(path.basename(full))");
 once('    const st = fs.statSync(full), contentType = mime(full)','    if(path.basename(full)===\'lab-login-security.html\'){res.setHeader(\'X-Frame-Options\',\'DENY\');res.setHeader(\'Content-Security-Policy\',"default-src \'self\'; script-src \'self\'; style-src \'self\'; font-src \'self\'; connect-src \'self\'; img-src \'self\'; object-src \'none\'; base-uri \'none\'; form-action \'self\'; frame-ancestors \'none\'");res.setHeader(\'Referrer-Policy\',\'no-referrer\');}\n    const st = fs.statSync(full), contentType = mime(full)');
 fs.writeFileSync(file,s);
}
