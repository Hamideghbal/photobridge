import {patchLabReferralTabs} from './lab-referral-tabs.cjs';
import fs from 'node:fs';import crypto from 'node:crypto';import {execFileSync} from 'node:child_process';
const once=(s,a,b,label=a.slice(0,80))=>{if(s.split(a).length!==2)throw Error('Lab referral anchor: '+label);return s.replace(a,b)};
const path='dist/api/server.js';let s=fs.readFileSync(path,'utf8');fs.copyFileSync('scripts/lab-referrals.js.txt','dist/api/lab-referrals.js');s="import {labReferralInvite,bindNewLabReferral,assertLabReferralEligible,lockLabSignupIdentity,referralBestPrice,labReferralPrice,awardLabReferral,labReferralSummary,paySubscriptionFromWallet} from './lab-referrals.js';\n"+s;
const trial="    if (req.method === 'POST' && url.pathname === '/api/public/lab-trial') {",verify="    if (req.method === 'POST' && url.pathname === '/api/public/lab-trial/verify') {";let a=s.indexOf(trial),b=s.indexOf(verify,a);if(a<0||b<a)throw Error('Referral signup route');let c=s.slice(a,b);c=once(c,'const credentialRecords=await credentialRows(pool,mobile);',`const referralCode=String(b.labReferralCode||'').trim();
        const credentialRecords=await credentialRows(pool,mobile);
        if(referralCode){try{await labReferralInvite(pool,referralCode)}catch(error){return sendJson(res,error.status||400,{error:error.message})}}`);c=once(c,"            const challenge = await createSignupMobileChallenge('lab_trial', mobile,","            if(referralCode)await assertLabReferralEligible(pool,{userId:existing?.id||null,mobile});\n            const challenge = await createSignupMobileChallenge('lab_trial', mobile,");c=once(c,'existingUserId: existing?.id || null }','existingUserId: existing?.id || null, labReferralCode:referralCode||null }');s=s.slice(0,a)+c+s.slice(b);
a=s.indexOf(verify);b=s.indexOf("    if (req.method === 'POST' && url.pathname === '/api/public/rental-invite-file/presign')",a);c=s.slice(a,b);c=once(c,"let userId = String(p.existingUserId || '');","await lockLabSignupIdentity(c,mobile);\n            let userId = String(p.existingUserId || '');");c=once(c,"                const mq = await c.query(`SELECT 1 FROM lab_memberships m JOIN users u","                if(p.labReferralCode)await assertLabReferralEligible(c,{userId,mobile});\n                const mq = await c.query(`SELECT 1 FROM lab_memberships m JOIN users u");const membership="await c.query(`INSERT INTO lab_memberships(lab_id,user_id,role,active) VALUES($1,$2,'lab_admin',true)`, [lq.rows[0].id, userId]);";c=once(c,membership,membership+"\n            if(p.labReferralCode)await bindNewLabReferral(c,{code:p.labReferralCode,labId:lq.rows[0].id,userId,mobile,isNewLab:true});");s=s.slice(0,a)+c+s.slice(b);
s=once(s,trial,`    const labReferralPreview=url.pathname.match(/^\\/api\\/public\\/lab-referral\\/([a-f0-9]{48})$/);
    if(req.method==='GET'&&labReferralPreview){try{const invite=await labReferralInvite(pool,labReferralPreview[1]);return sendJson(res,200,{inviterName:invite.name,discountPercent:30,rewardPercent:10})}catch(error){return sendJson(res,error.status||400,{error:error.message})}}
`+trial);
// Older native hosts forward their existing gateway-request route live, never queue it.
{const start=s.indexOf("        if (req.method === 'POST' && url.pathname === '/api/lab/subscription/zibal/request') {"),end=s.indexOf("        if (req.method === 'POST' && url.pathname === '/api/lab/subscription/renewals/presign')",start);let route=s.slice(start,end);route=once(route,"            if (!zibalConfigured)","            const b=await bodyJson(req);\n            if(b.paymentMethod==='wallet')return labReferralWalletCheckout(b);\n            if (!zibalConfigured)");route=once(route,'            const b = await bodyJson(req);\n','');s=s.slice(0,start)+route+s.slice(end);}
// Both existing payment creation paths retain their original pricing/storage logic.
const special='const special = applySpecialDiscount(planAmount, plan.subscription_discount_enabled, plan.subscription_discount_amount, plan.subscription_discount_percent);';if(s.split(special).length!==3)throw Error('Referral expected exactly bank+receipt plan pricing');s=s.replaceAll(special,'const special = await labReferralPrice(pool,labId,publicCalc.grossAmount,planAmount,applySpecialDiscount(planAmount, plan.subscription_discount_enabled, plan.subscription_discount_amount, plan.subscription_discount_percent));');
const sub="        if (req.method === 'GET' && url.pathname === '/api/lab/subscription') {";s=once(s,sub,fs.readFileSync('scripts/lab-referral-wallet-route.js.txt','utf8')+'\n'+sub);
a=s.indexOf(sub);b=s.indexOf("        if (req.method === 'POST' && url.pathname === '/api/lab/subscription/zibal/request')",a);c=s.slice(a,b);c=once(c,'const pricedPlans = plans.rows.map',"const referralEligible=(await pool.query('SELECT 1 FROM lab_referrals WHERE referred_lab_id=$1',[labId])).rowCount>0;\n            const walletBalance=Number((await pool.query('SELECT balance FROM lab_service_wallets WHERE lab_id=$1',[labId])).rows[0]?.balance||0);\n            const pricedPlans = plans.rows.map");c=once(c,'const special = applySpecialDiscount(planAmount, discountEnabled, specialDiscountAmount, labRow?.subscription_discount_percent);','const original=applySpecialDiscount(planAmount, discountEnabled, specialDiscountAmount, labRow?.subscription_discount_percent);const special=referralEligible?referralBestPrice(publicCalc.grossAmount,planAmount,original):original;');c=once(c,'{ lab: labRow, plans: pricedPlans,','{ lab: labRow, walletBalance,referral:referralEligible?{discountPercent:30,combineDiscounts:false}:null,plans: pricedPlans,');s=s.slice(0,a)+c+s.slice(b);
a=s.indexOf('async function finalizePaidSubscriptionRenewal(');b=s.indexOf('async function statusEvent(',a);c=s.slice(a,b);c=once(c,'    return newUntil;','    await awardLabReferral(c,row.id,{ensureWallet:serviceWalletEnsure});\n    return newUntil;');s=s.slice(0,a)+c+s.slice(b);
const review=s.indexOf("`subscription.${action}`");a=s.lastIndexOf("            else {",review);b=s.indexOf("            await c.query('COMMIT');",a);c=s.slice(a,b);const paid="[row.lab_id, labName, row.id, Number(row.amount)]);";c=once(c,paid,paid+'\n                await awardLabReferral(c,row.id,{ensureWallet:serviceWalletEnsure});');s=s.slice(0,a)+c+s.slice(b);
// R1624: forward the optional temporary photographer name on the original SMS endpoint.
{
 const routeStart=s.indexOf("url.pathname === '/api/photographer-invites/send-sms'");
 const pendingStart=s.indexOf('const pendingCustomer=await ensureLabInviteCustomer(',routeStart);
 if(routeStart<0||pendingStart<routeStart||pendingStart-routeStart>13000)throw Error('R1624 photographer SMS path changed');
 const bodyMatches=[...s.slice(routeStart,pendingStart).matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+bodyJson\(req\)/g)];
 if(bodyMatches.length!==1)throw Error('R1624 SMS body binding changed');
 const pendingEnd=s.indexOf(');',pendingStart),prior=s.slice(pendingStart,pendingEnd+2);
 if(!prior.includes('actorId:a.userId'))throw Error('R1624 pending invite helper changed');
 s=s.slice(0,pendingStart)+prior.replace('actorId:a.userId','actorId:a.userId,temporaryName:'+bodyMatches[0][1]+'.temporaryName')+s.slice(pendingEnd+2);
}
// Display the saved temporary photography name in the lab's invitation history.
{
 const getStart=s.indexOf("if (req.method === 'GET' && url.pathname === '/api/photographer-invites')");
 const getEnd=s.indexOf("if (req.method === 'PUT' && url.pathname === '/api/admin/photographer-invites/commission')",getStart);
 if(getStart<0||getEnd<=getStart)throw Error('R1624 invite history route changed');
 let route=s.slice(getStart,getEnd);
 const oldSelect='SELECT link.invite_id,link.mobile,link.last_sent_at,link.previous_debt,';
 const newSelect="SELECT link.invite_id,link.mobile,link.last_sent_at,link.previous_debt,(SELECT NULLIF(i.target_name,'') FROM invitations i WHERE i.lab_id=$1 AND right(regexp_replace(i.target_mobile,'[^0-9]','','g'),10)=right(regexp_replace(link.mobile,'[^0-9]','','g'),10) AND i.uses=0 ORDER BY i.created_at DESC LIMIT 1) AS temporary_name,";
 if(route.split(oldSelect).length!==2)throw Error('R1624 history SQL changed');
 route=route.replace(oldSelect,newSelect);
 const oldMap='inviteId:r.invite_id,customerId:r.customer_id,mobile:r.mobile';
 if(route.split(oldMap).length!==2)throw Error('R1624 history JSON changed');
 route=route.replace(oldMap,oldMap+',name:r.temporary_name||null');
 s=s.slice(0,getStart)+route+s.slice(getEnd);
}
const r1624LabAnchor='        const labId = a.labId;';
const r1624SmsRoute=String.raw`
        /* R1624 laboratory referral SMS */
        if(req.method==='POST'&&url.pathname==='/api/lab/referrals/send-sms'){
         if(a.labRole!=='lab_admin')return sendJson(res,403,{error:'forbidden'});
         const body=await bodyJson(req),mobile=normalizeMobile(String(body.mobile||''));
         if(!/^09\d{9}$/.test(mobile))return sendJson(res,400,{error:'invalid_mobile'});
         // Match signup eligibility before dispatching any SMS: existing lab administrators cannot be invited as new labs.
         try{await assertLabReferralEligible(pool,{mobile})}catch(error){if(error?.message==='lab_referral_new_accounts_only')return sendJson(res,409,{error:'lab_referral_new_accounts_only'});throw error}
         const summary=await labReferralSummary(pool,labId,a.userId,PUBLIC_APP_URL);
         if(!summary.inviteUrl)return sendJson(res,409,{error:'lab_referral_invalid'});
         const key='lab-referral-sms:'+labId+':'+mobile;
         const claim=await pool.query("INSERT INTO platform_settings(key,value,updated_at) VALUES($1,$2::jsonb,now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now() WHERE platform_settings.updated_at<now()-interval '90 seconds' RETURNING key",[key,JSON.stringify({mobile,status:'dispatching'})]);
         if(!claim.rowCount)return sendJson(res,429,{error:'lab_referral_sms_rate_limited'});
         try{
          const message='PhotoBridge\nدعوت به عضویت لابراتوار با ۳۰٪ تخفیف همیشگی:\n'+summary.inviteUrl;
          const result=await sendSms({mobile,message,purpose:'lab_referral_invitation',eventKey:'lab_referral_invite',userId:a.userId,labId,metadata:{referralLink:summary.inviteUrl}});
          await pool.query('UPDATE platform_settings SET value=$2::jsonb,updated_at=now() WHERE key=$1',[key,JSON.stringify({mobile,status:'sent',reference:result?.reference||null})]);
          return sendJson(res,200,{accepted:true,mobile});
         }catch(error){
          await pool.query('UPDATE platform_settings SET value=$2::jsonb,updated_at=now() WHERE key=$1',[key,JSON.stringify({mobile,status:'failed'})]).catch(()=>{});
          return sendJson(res,502,{error:'lab_referral_sms_failed'});
         }
        }
`;
s=once(s,r1624LabAnchor,r1624LabAnchor+'\n'+r1624SmsRoute,'R1624 laboratory route injection');
fs.writeFileSync(path,s);execFileSync(process.execPath,['--check',path]);execFileSync(process.execPath,['--check','dist/api/lab-referrals.js']);
for(const root of ['dist/web','dist/web/lab-desktop-ui']){const nav=root+'/photobridge-r1372-third-header.js';fs.writeFileSync(nav,patchLabReferralTabs(fs.readFileSync(nav,'utf8')));execFileSync(process.execPath,['--check',nav]);const file=root+'/assets/index-UIRefine-v655-r84.js';s=fs.readFileSync(file,'utf8');const customersStart=s.indexOf('function Kj('),customersEnd=s.indexOf('function wb(',customersStart);if(customersStart<0||customersEnd<customersStart)throw Error('Lab referral customer tabs missing');let customers=s.slice(customersStart,customersEnd);
 customers=once(customers,'return S==="collaboration"||location.hash==="#customers-collaboration"','return S==="lab-invites"||location.hash==="#customers-lab-invites"?"lab-invites":S==="collaboration"||location.hash==="#customers-collaboration"');
 customers=once(customers,'["invites","دعوت‌نامه‌ها","کد ثابت"]','["invites","دعوت‌نامهٔ عکاس‌ها","کد ثابت"],["lab-invites","دعوت‌نامهٔ لابراتوارها","۳۰٪ / ۱۰٪"]');
 customers=once(customers,'c==="photographers"&&e.jsxs(','c==="lab-invites"&&e.jsx("section",{className:"labReferralInvitesWorkspace",children:e.jsx(PBLabReferralPanel,{})}),c==="photographers"&&e.jsxs(');
 s=s.slice(0,customersStart)+customers+s.slice(customersEnd);
 a=s.indexOf('function u0(');b=s.indexOf('function h0(',a);c=s.slice(a,b);c=once(c,'mobile:t.mobile,password:t.password})','mobile:t.mobile,password:t.password,labReferralCode:new URLSearchParams(location.search).get("labInvite")||undefined})');c=once(c,'S=C=>C==="account_password_unification_required"','S=C=>C==="lab_referral_new_accounts_only"?"این دعوت فقط برای لابراتوار جدید است؛ این شماره قبلاً مدیر لابراتوار بوده است.":C==="lab_referral_invalid"?"دعوت‌نامه معتبر نیست یا غیرفعال شده است.":C==="account_password_unification_required"');c=once(c,'children:[e.jsxs("div",{children:[e.jsx("span",{className:"eyebrow",children:"ساخت حساب لابراتوار"})','children:[e.jsx(PBLabReferralWelcome,{}),e.jsxs("div",{children:[e.jsx("span",{className:"eyebrow",children:"ساخت حساب لابراتوار"})');s=s.slice(0,a)+c+s.slice(b);
 const divider='e.jsx("div",{className:"manualReceiptDivider"';s=once(s,divider,'e.jsx(PBLabWalletSubscription,{plan:C,balance:t.walletBalance,labId:t.lab?.id,onSaved:I},C?.id),'+divider);s=once(s,'O.payment_method==="zibal"?"زیبال · ":""','O.payment_method==="wallet"?"کیف پول · ":O.payment_method==="zibal"?"زیبال · ":""');s+='\n'+fs.readFileSync('scripts/lab-referral-ui.js.txt','utf8');fs.writeFileSync(file,s);execFileSync(process.execPath,['--check',file]);const css='photobridge-lab-referral-program.css';fs.copyFileSync('scripts/lab-referral-ui.css',root+'/'+css);const html=root+'/index.html';s=fs.readFileSync(html,'utf8').replace(/(photobridge-r1372-third-header\.js\?[^"']*)/g,'$1&labInvites=r1621').replace('</head>',`<link rel="stylesheet" href="/${css}?v=lab-referral-v4-mobile-eligibility-layout"></head>`).replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,'$1&labReferral=v4-mobile-eligibility-layout');fs.writeFileSync(html,s)}
const root='dist/web/lab-desktop-ui',mp=root+'/manifest.json',m=JSON.parse(fs.readFileSync(mp)),hash=b=>crypto.createHash('sha256').update(b).digest('hex');for(const name of ['assets/index-UIRefine-v655-r84.js','index.html','photobridge-lab-referral-program.css','photobridge-r1372-third-header.js']){let item=m.files.find(x=>x.name===name);if(!item){item={name,url:'/lab-desktop-ui/'+name};m.files.push(item)}item.sha256=hash(fs.readFileSync(root+'/'+name))}m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(mp,JSON.stringify(m));
