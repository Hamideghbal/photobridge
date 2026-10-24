import fs from 'node:fs';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1393 changed anchor '+a.slice(0,100));return s.replace(a,b)};
const section=(s,start,end,fn)=>{const a=s.indexOf(start),b=s.indexOf(end,a+start.length);if(a<0||b<a)throw Error('R1393 missing section '+start);return s.slice(0,a)+fn(s.slice(a,b))+s.slice(b)};
const file='dist/api/server.js';let s=fs.readFileSync(file,'utf8');
if(!s.includes('/* R1393 shared business credentials */')){
 s="import {credentialRows,matchesBusinessPassword,businessLoginState,prepareSignupCredential,lockSignupCredential,finishSignupCredential,setSharedPassword,sharedResetIdentity} from './shared-credentials.js';\n/* R1393 shared business credentials */\n"+s;
 s=once(s,'    await ensureSignupVerificationKindsRuntimeSchema();\n    const cfg = await resolvedSMSSettings();',"    await ensureSignupVerificationKindsRuntimeSchema();\n    payload=await prepareSignupCredential(pool,{kind,mobile,payload,password,verifyPassword:passwordVerify});\n    const cfg = await resolvedSMSSettings();");
 s=section(s,'async function lockAndVerifySignupChallenge(', 'function photographerSignupRetryableDbError',r=>once(r,"    await c.query(`UPDATE signup_mobile_verifications SET status='verified',verified_at=now() WHERE id=$1`, [id]);","    await lockSignupCredential(c,row);\n    await c.query(`UPDATE signup_mobile_verifications SET status='verified',verified_at=now() WHERE id=$1`, [id]);"));
 const consumed="await c.query(`UPDATE signup_mobile_verifications SET status='used',used_at=now() WHERE id=$1`, [challengeId]);";if(s.split(consumed).length!==5)throw Error('R1393 expected four verified signup callers');s=s.replaceAll(consumed,'await finishSignupCredential(c,userId,challenge);\n        '+consumed);
 // All newly created photographer profiles use the already existing account password.
 s=section(s,'async function ensurePhotographerProfile(', 'async function ensureCustomerLabMembership',r=>once(r,"    const studioName =", "    const baseCredential=(await db.query('SELECT password_hash FROM users WHERE id=$1',[args.userId])).rows[0]?.password_hash;\n    args={...args,passwordHash:baseCredential||args.passwordHash};\n    const studioName ="));
 for(const [start,end,shop] of [["    if (req.method === 'POST' && url.pathname === '/api/public/equipment-rental-trial') {","    if (req.method === 'POST' && url.pathname === '/api/public/equipment-rental-trial/verify') {",true],["    if (req.method === 'POST' && url.pathname === '/api/public/lab-trial') {","    if (req.method === 'POST' && url.pathname === '/api/public/lab-trial/verify') {",false]]){
  s=section(s,start,end,r=>{
   if(shop)r=once(r,"        if (password.length < 8) return sendJson(res, 400, { error: 'password_too_short' });",'');
   const qstart=r.indexOf('        const uq = await pool.query('),qend=r.indexOf('        const credentialMatches =',qstart);if(qstart<0||qend<qstart)throw Error('R1393 signup credentials query');r=r.slice(0,qstart)+'        const credentialRecords=await credentialRows(pool,mobile);\n        const uq={rows:credentialRecords,rowCount:credentialRecords.length};\n'+r.slice(qend);
   r=once(r,'row.active && passwordVerify(password, row.password_hash)','matchesBusinessPassword(row,password,passwordVerify)');
   if(shop){r=once(r,"else if (credentialMatches.length === 1) existing = credentialMatches[0];\n        else if (credentialMatches.length > 1) return sendJson(res, 409, { error: 'mobile_ambiguous' });","else if (credentialMatches.length >= 1) existing = credentialMatches[0];");r=once(r,'        if (existing) {',"        if (!existing && password.length < 8) return sendJson(res,400,{error:'password_too_short'});\n        if (existing) {");}
   else r=once(r,"else if (credentialMatches.length === 1)\n            existing = credentialMatches[0];\n        else if (credentialMatches.length > 1)\n            return sendJson(res, 409, { error: 'mobile_ambiguous' });","else if (credentialMatches.length >= 1)\n            existing = credentialMatches[0];");
   const table=shop?'equipment_rental_shop_memberships':'lab_memberships',role=shop?'shop_admin':'lab_admin';
   r=once(r,`SELECT 1 FROM ${table} WHERE user_id=$1 AND role='${role}' AND active=true LIMIT 1`,`SELECT 1 FROM ${table} m JOIN users u ON u.id=m.user_id WHERE right(regexp_replace(coalesce(u.mobile,''),'[^0-9]','','g'),10)=right($1,10) AND m.role='${role}' AND m.active=true LIMIT 1`);r=once(r,'[existing.id]);','[mobile]);');return r;
  });
 }
 // Recheck membership by phone, inside the locked verification transaction too.
 for(const [table,role] of [['lab_memberships','lab_admin'],['equipment_rental_shop_memberships','shop_admin']]){
  const anchor=`SELECT 1 FROM ${table} WHERE user_id=$1 AND role='${role}' AND active=true LIMIT 1\`, [userId]);`;
  s=once(s,anchor,`SELECT 1 FROM ${table} m JOIN users u ON u.id=m.user_id WHERE right(regexp_replace(coalesce(u.mobile,''),'[^0-9]','','g'),10)=right($1,10) AND m.role='${role}' AND m.active=true LIMIT 1\`, [mobile]);`);
 }
 s=section(s,"    if (req.method === 'POST' && url.pathname === '/api/public/photographer-signup')", "    if (req.method === 'POST' && url.pathname === '/api/public/photographer-signup/verify')", r=>once(r,"            if (password.length < 8)","            if (!existing && password.length < 8)"));
 s=section(s,'    const loginWithMobile = async (expected) => {',"    if (req.method === 'POST' && url.pathname === '/api/auth/lab-login')",r=>{
  r=once(r,'        let user = null, selectedMembership = null, selectedRentalMembership = null;',`        if(!wantsAdmin){const state=businessLoginState(mobileMatches,password,passwordVerify);if(state.needsUnification)return sendJson(res,409,{error:'account_password_unification_required',message:'رمزهای قدیمی این شماره متفاوت‌اند؛ با تأیید پیامکی یک رمز مشترک برای عکاس، لابراتوار و فروشگاه تعیین کنید.'});}
        let user = null, selectedMembership = null, selectedRentalMembership = null;`);
  if(r.split('passwordVerify(password, r.photographer_password_hash || r.password_hash)').length!==3)throw Error('R1393 photographer login anchors');return r.replaceAll('passwordVerify(password, r.photographer_password_hash || r.password_hash)','passwordVerify(password, r.password_hash)');
 });
 // Every owner-verified reset converges all business credentials; never reset one profile alone.
 s=section(s,"    if (req.method === 'POST' && url.pathname === '/api/auth/password-reset/complete') {",'    const loginWithMobile = async (expected) => {',r=>{
  const a=r.indexOf("            if (String(row.portal || '') === 'photographer') {"),b=r.indexOf("            await c.query(`UPDATE password_reset_challenges SET status='used'",a);if(a<0||b<a)throw Error('R1393 reset boundary');
  r=r.slice(0,a)+`            const locked=(await c.query('SELECT * FROM password_reset_challenges WHERE id=$1 FOR UPDATE',[id])).rows[0];
            if(!locked||locked.status!=='verified'||!locked.reset_token_hash||new Date(locked.expires_at)<=new Date()||tokenHash(resetToken)!==locked.reset_token_hash)throw Object.assign(Error('reset_invalid'),{status:400});
            await setSharedPassword(c,locked.user_id,nextPasswordHash,{proof:true,mobile:locked.mobile});
`+r.slice(b);return r;
 });
 s=section(s,"    if (req.method === 'POST' && url.pathname === '/api/auth/complete-password-change') {", "    if (req.method === 'POST' && url.pathname === '/api/auth/logout')",r=>once(r,"await c.query(`UPDATE users SET password_hash=$2,force_password_change=false,updated_at=now() WHERE id=$1`, [a.userId, passwordHash(newPassword)]);","await setSharedPassword(c,a.userId,passwordHash(newPassword),{expectedHash:current.password_hash});"));
 // Common owner recovery can be reached even before choosing a new business role.
 s=once(s,"['admin', 'lab', 'photographer', 'rental'].includes(portal)","['admin', 'lab', 'photographer', 'rental','account'].includes(portal)");
 s=once(s,'async function resolvePasswordResetUser(portal, mobile) {',"async function resolvePasswordResetUser(portal, mobile) {\n    if(portal==='account')return await sharedResetIdentity(pool,mobile);");
 // A lab operator must not reset another owner's new shared account password.
 s=section(s,"        if (resetCustomerPassword && req.method === 'POST') {",'        const cm =',r=>{const a=r.indexOf('            const b =');return r.slice(0,a)+"            return sendJson(res,409,{error:'account_owner_password_reset_required',message:'رمز حساب بین نقش‌ها مشترک است؛ مالک شماره باید از بازیابی رمز و تأیید پیامکی استفاده کند.'});\n        }\n"});
 // Retain shared identities and sessions when one lab is deleted or suspended.
 const deleteStart=s.indexOf('await c.query(`DELETE FROM users u WHERE u.id=ANY($1::uuid[])'),deleteEnd=s.indexOf('`, [memberIds]);',deleteStart);if(deleteStart<0||deleteEnd<deleteStart)throw Error('R1393 lab identity cleanup anchor');s=s.slice(0,deleteStart)+'/* Shared identity and other role histories are retained after lab deletion. */'+s.slice(deleteEnd+'`, [memberIds]);'.length);
 // An administrator may create a role on an existing identity, but cannot invent
 // a different password for that existing phone number.
 s=once(s,"const uq = await c.query(`INSERT INTO users(name,mobile,password_hash,force_password_change) VALUES($1,$2,$3,$4) RETURNING id`, [adminDisplayName, adminMobile, passwordHash(adminPassword), b.forcePasswordChange !== false]);",`const existingIdentities=await credentialRows(c,adminMobile,true);
            const accepted=existingIdentities.filter(u=>matchesBusinessPassword(u,adminPassword,passwordVerify));
            if(existingIdentities.length&&(!accepted.length||businessLoginState(existingIdentities,adminPassword,passwordVerify).needsUnification))throw Object.assign(Error('account_password_unification_required'),{status:409});
            const uq=accepted.length?{rows:[accepted[0]]}:await c.query(\`INSERT INTO users(name,mobile,password_hash,force_password_change) VALUES($1,$2,$3,$4) RETURNING id\`,[adminDisplayName,adminMobile,passwordHash(adminPassword),b.forcePasswordChange!==false]);`);
 s=section(s,'                if (adminPassword) {','                else {',r=>`                if (adminPassword) {
                    throw Object.assign(Error('account_owner_password_reset_required'),{status:409});
                }
`);
 // Role suspension/deletion is enforced by role membership checks, without revoking
 // the same user's otherwise valid sessions for the remaining roles.
 s=once(s,"await c.query(`DELETE FROM sessions WHERE user_id=ANY($1::uuid[])`, [memberIds]);",'/* Other role sessions remain valid; the deleted lab membership is checked on every lab request. */');
 s=once(s,"if (next.suspended) await pool.query(`DELETE FROM sessions WHERE user_id IN (SELECT user_id FROM equipment_rental_shop_memberships WHERE shop_id=$1 AND active=true) AND user_id<>$2`, [adminRentalShop[1], a.userId]).catch(()=>{});",'/* Store suspension remains scoped to the store role. */');
 s=once(s,"await c.query(`DELETE FROM sessions WHERE user_id IN (SELECT user_id FROM lab_memberships WHERE lab_id=$1) AND user_id<>$2`, [adminLab[1], a.userId]);",'/* Lab suspension remains scoped to the lab role. */');
 // The owner changing the platform-admin password must not split their business login.
 s=section(s,"    if (req.method === 'PATCH' && url.pathname === '/api/admin/account') {",'    const publicInvite =',r=>{
  r=once(r,'SELECT id,password_hash FROM users WHERE id=$1', 'SELECT id,mobile,password_hash FROM users WHERE id=$1');
  const a=r.indexOf('        if (newPassword) {'),b=r.indexOf('        else {',a);if(a<0||b<a)throw Error('R1393 admin password update missing');
  r=r.slice(0,a)+`        if (newPassword) {
            if(normalizeMobile(current.mobile)!==mobile)return sendJson(res,409,{error:'shared_mobile_change_requires_verification'});
            const c=await pool.connect();try{await c.query('BEGIN');await setSharedPassword(c,a.userId,passwordHash(newPassword),{expectedHash:current.password_hash});await c.query('UPDATE users SET name=$2,updated_at=now() WHERE id=$1',[a.userId,name]);await c.query('COMMIT')}catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{c.release()}
            await createSession(a.userId,res,'admin');
        }
`+r.slice(b);return r;
 });
 s=once(s,"await c.query(`UPDATE audit_log SET actor_id=NULL WHERE actor_id=ANY($1::uuid[])`, [memberIds]);",'/* Retain shared identities as actors in other role audit histories. */');
 s=once(s,'UPDATE users SET name=$5,mobile_verified_at=COALESCE(mobile_verified_at,now())',"UPDATE users SET name=COALESCE(NULLIF(name,''),$5),mobile_verified_at=COALESCE(mobile_verified_at,now())");
 s=once(s,"isRetouchAccount = path.basename(full) === 'retouch-account.html'","isRetouchAccount = ['retouch-account.html','account-recovery.html'].includes(path.basename(full))");
 // No eager data migration: old divergent passwords require explicit mobile ownership proof.
 fs.writeFileSync(file,s);
}
const uiFile='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(uiFile,'utf8');
if(!ui.includes('/* R1393 common account UI */')){
 ui=once(ui,'m(J==="account_suspended"?', 'm(J==="account_password_unification_required"?"رمزهای قدیمی این شماره متفاوت‌اند؛ دکمهٔ یکسان‌سازی یا بازیابی رمز را بزنید و با کد پیامکی یک رمز مشترک تعیین کنید.":J==="account_suspended"?');
 ui=once(ui,'S=C=>C==="existing_account_password_invalid"?', 'S=C=>C==="account_password_unification_required"?"با دکمهٔ یکسان‌سازی یا بازیابی رمز، برای این شماره یک رمز مشترک تعیین کنید.":C==="existing_account_password_invalid"?');
 ui=once(ui,'این شماره حساب PhotoBridge دارد. رمز همان حساب عکاس را در هر دو کادر وارد کن؛ رمز جدید نساز. اگر رمز را فراموش کرده‌ای، از صفحهٔ ورود بازیابی رمز را انجام بده.','این شماره حساب PhotoBridge دارد؛ رمز فعلی یکی از نقش‌های خودت را در هر دو کادر وارد کن. پس از تأیید پیامک، همان رمز برای عکاس، لابراتوار و فروشگاه مشترک خواهد شد.');
 ui=once(ui,'اگر این شماره حساب عکاس یا فروشگاه دارد، رمز همان حساب را در هر دو کادر وارد کن. حساب و اطلاعات قبلی حفظ می‌شوند. برای شمارهٔ جدید، رمز باید حداقل ۸ کاراکتر باشد.','برای افزودن عضویت، شماره و رمز حساب موجودت را وارد کن؛ پس از تأیید پیامک، یک رمز برای عکاس، لابراتوار و فروشگاه خواهی داشت. اطلاعات قبلی حفظ می‌شوند. رمز شمارهٔ جدید باید حداقل ۸ کاراکتر باشد.');
 ui+='\n/* R1393 common account UI */\n';fs.writeFileSync(uiFile,ui);
}
const tags='<link rel="stylesheet" href="/photobridge-r1393-shared-account.css?v=r1393"><script defer src="/photobridge-r1393-shared-account.js?v=r1393"></script>';
for(const file of ['dist/web/index.html','dist/api/equipment-rental-register.html','dist/api/equipment-rental-portal.html']){
 if(!fs.existsSync(file))continue;let html=fs.readFileSync(file,'utf8');if(!html.includes('/photobridge-r1393-shared-account.js')){const end=html.toLowerCase().lastIndexOf('</body>');if(end<0)throw Error('R1393 closing body missing');html=html.slice(0,end)+tags+html.slice(end)};
 if(file.endsWith('index.html'))html=html.replace(/labTrial=r1391/g,'labTrial=r1393');
 if(file.endsWith('register.html'))html=html.replaceAll('minlength="8"','minlength="1"');
 if(file.endsWith('portal.html')&&!html.includes("x.error==='account_password_unification_required'"))html=once(html,"x.error==='invalid_credentials'?","x.error==='account_password_unification_required'?'رمزهای قدیمی این شماره متفاوت‌اند؛ گزینهٔ یکسان‌سازی یا بازیابی رمز را انتخاب کنید.':x.error==='invalid_credentials'?");
 fs.writeFileSync(file,html);
}
