const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');

test('photographer invitation adds a temporary studio name to the existing SMS path',()=>{
 const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 const child=fs.readFileSync('scripts/r1436-lab-invites.js','utf8');
 assert.match(ui,/temporaryName:pbR1624TempName\.current/);
 assert.match(ui,/temporaryNameRef:pbR1624TempName/);
 assert.match(child,/نام عکاس یا نام عکاسی \(موقت\)/);
 const server=fs.readFileSync('dist/api/server.js','utf8');
 assert.match(server,/temporaryName:[A-Za-z_$][\w$]*\.temporaryName/);
 assert.match(server,/AS temporary_name/);
 assert.match(server,/name:r\.temporary_name\|\|null/);
});

test('name remains a pending-invitation label and does not overwrite official user identity',async()=>{
 const m=await import(pathToFileURL(require('node:path').resolve('dist/api/lab-invite-preregistration.js')).href);
 const statements=[];
 const rows=values=>({rows:values,rowCount:values.length});
 const query=async(sql,args=[])=>{
  statements.push({sql,args});
  if(sql.startsWith('SELECT id,name FROM users'))return rows([{id:'user',name:'نام رسمی عکاس'}]);
  if(sql.startsWith('SELECT role,active FROM lab_memberships'))return rows([{role:'customer',active:false}]);
  return rows([]);
 };
 const db={query,release(){}};
 const deps={pool:{connect:async()=>db},crypto:require('node:crypto'),passwordHash:()=>'',ensureFinanceAccounts:async()=>{},postBalancedFinanceTransaction:async()=>{}};
 await m.ensureLabInviteCustomer(deps,{labId:'lab',mobile:'09120000000',actorId:'manager',temporaryName:'آتلیه نمونه'});
 const inserted=statements.find(row=>row.sql.startsWith('INSERT INTO invitations'));
 assert.equal(inserted?.args[4],'آتلیه نمونه');
 assert.equal(statements.some(row=>/UPDATE users SET/.test(row.sql)),false);
});

test('lab referral form sends only a mobile number and canonical referral link, with details below',()=>{
 const script=fs.readFileSync('scripts/lab-referral-ui.js.txt','utf8');
 const start=script.indexOf('function PBLabReferralPanel()');
 const end=script.indexOf('function PBLabReferralWelcome()',start);
 assert(start>=0&&end>start);
 const panel=script.slice(start,end);
 assert.match(panel,/\/api\/lab\/referrals\/send-sms/);
 assert.match(panel,/JSON\.stringify\(\{mobile:phone\}\)/);
 assert.match(panel,/لینک دعوت لابراتوار/);
 assert.match(panel,/شماره موبایل لابراتوار/);
 assert.doesNotMatch(panel,/(?:'aria-label'|placeholder)\s*:\s*['"]نام لابراتوار/);
 assert.doesNotMatch(panel,/\b(?:temporaryName|setName)\b/);
 // Status text about completed registration is not a laboratory-name input.
 assert.match(panel,/ثبت‌نام لابراتوار دعوت‌شده تکمیل شده است/);
 assert(panel.indexOf('labReferralInviteControls')<panel.indexOf('PBLabReferralGuide'));
});

test('lab referral SMS requires lab administrator and throttles retries without debiting SMS wallet',()=>{
 const server=fs.readFileSync('dist/api/server.js','utf8');
 const start=server.indexOf('/* R1624 laboratory referral SMS */');
 assert(start>0);
 const block=server.slice(start,start+3300);
 assert.match(block,/a\.labRole!=='lab_admin'/);
 assert.match(block,/labReferralSummary\(pool,labId,a\.userId,PUBLIC_APP_URL\)/);
 assert.match(block,/lab_referral_sms_rate_limited/);
 assert.match(block,/lab-referral-sms:/);
 assert.match(block,/sendSms\(\{mobile,message/);
 assert.doesNotMatch(block,/chargeLabId|chargeRentalShopId/);
 assert.match(fs.readFileSync('dist/api/lab-referrals.js','utf8'),/smsHistory/);
});

test('expired-subscription notice can be dismissed without changing subscription access',()=>{
 const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
 assert.match(ui,/pb1477SubscriptionClose/);
 assert.match(ui,/setDismissedUntil\(String\(status\.activeUntil\)\)/);
 assert.match(ui,/dismissedUntil===String\(status\.activeUntil\)/);
 const css=fs.readFileSync('dist/web/photobridge-r1477-lab-status.css','utf8');
 assert.match(css,/\.pb1477SubscriptionClose/);
});
