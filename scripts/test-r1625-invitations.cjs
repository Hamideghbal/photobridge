const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('photographer invitation keeps three fields plus send button in one desktop row',()=>{
 const css=fs.readFileSync('dist/web/photobridge-r1436-settings-invites.css','utf8');
 const ui=fs.readFileSync('scripts/r1436-lab-invites.js','utf8');
 assert.match(css, /@media\(min-width:601px\)\{\.pb1436LabInvites \.pb1436InviteSend/);
 assert.match(css, /grid-template-columns:minmax\(0,1\.15fr\) minmax\(0,1fr\) minmax\(0,1fr\) max-content/);
 assert.match(css, /\.pb1436InviteSend>button\{grid-column:4/);
 assert.match(ui,/نام عکاس یا نام عکاسی \(موقت\)/);
 assert.match(ui,/ارسال دعوت‌نامه/);
});

test('lab invitation link is full-width with copy action inside the field and separated from SMS controls',()=>{
 const css=fs.readFileSync('dist/web/photobridge-lab-referral-program.css','utf8');
 const ui=fs.readFileSync('scripts/lab-referral-ui.js.txt','utf8');
 const start=ui.indexOf('function PBLabReferralPanel()');
 const end=ui.indexOf('function PBLabReferralWelcome()',start);
 assert(start>=0&&end>start);
 const panel=ui.slice(start,end);
 const link=panel.indexOf("className:'labReferralInviteLink");
 const separator=panel.indexOf("className:'labReferralInviteDivider'");
 const mobile=panel.indexOf("className:'labReferralInviteSend");
 assert(link>=0&&separator>link&&mobile>separator);
 assert.match(css,/\.labReferralInviteControls \.labReferralInviteLink input\{[^}]*width:100%/);
 assert.match(css,/\.labReferralInviteControls \.labReferralInviteLink button\{[^}]*position:absolute/);
 assert.match(css,/\.labReferralInviteDivider\{[^}]*height:1px/);
 assert.match(panel,/onClick:copy,children:'کپی'/);
 assert.match(panel,/lab_referral_new_accounts_only/);
 assert.doesNotMatch(panel,/(?:'aria-label'|placeholder)\s*:\s*['"]نام لابراتوار/);
 assert.doesNotMatch(panel,/\btemporaryName\b/);
 assert.match(panel,/ثبت‌نام لابراتوار دعوت‌شده تکمیل شده است/);
});

test('referral SMS refuses already-registered lab numbers before any SMS or throttle write',async()=>{
 const server=fs.readFileSync('dist/api/server.js','utf8');
 const start=server.indexOf('/* R1624 laboratory referral SMS */');
 const end=server.indexOf('        const labAccess = await pool.query',start);
 assert(start>0&&end>start);
 const route=server.slice(start,end);
 assert.match(route,/await assertLabReferralEligible\(pool,\{mobile\}\)/);
 assert.match(route,/lab_referral_new_accounts_only/);
 const handle=new Function('d','const {req,res,url,a,pool,labReferralSummary,normalizeMobile,bodyJson,assertLabReferralEligible,sendSms,sendJson,PUBLIC_APP_URL}=d; const labId=a.labId;return (async()=>{'+route+'})()');
 let writes=0,sms=0,eligibility=0,summaries=0;
 const link='https://photobridge.ir/trial?labInvite='+'a'.repeat(48);
 const deps={
  req:{method:'POST'},res:{},url:{pathname:'/api/lab/referrals/send-sms'},a:{labRole:'lab_admin',labId:'lab-id',userId:'user-id'},
  pool:{query:async()=>{writes++;return{rowCount:1,rows:[{}]}}},
  labReferralSummary:async()=>{summaries++;return{inviteUrl:link}},
  normalizeMobile:v=>v,bodyJson:async()=>({mobile:'09120000000'}),
  assertLabReferralEligible:async()=>{eligibility++;throw Object.assign(new Error('lab_referral_new_accounts_only'),{status:409})},
  sendSms:async()=>{sms++;return{}},sendJson:(_r,status,payload)=>({status,payload}),PUBLIC_APP_URL:'https://photobridge.ir'
 };
 const rejected=await handle(deps);
 assert.equal(rejected.status,409);
 assert.equal(rejected.payload.error,'lab_referral_new_accounts_only');
 assert.equal(eligibility,1);
 assert.equal(writes,0);
 assert.equal(sms,0);
 assert.equal(summaries,0);
 deps.assertLabReferralEligible=async()=>{};
 deps.sendSms=async args=>{sms++;assert.match(args.message,/۳۰٪ تخفیف همیشگی/);assert.doesNotMatch(args.message,/جمع نمی‌شوند|جمع می‌شوند|تخفیف‌ها جمع/);assert(args.message.includes(link));return{reference:'mock'}};
 const accepted=await handle(deps);
 assert.equal(accepted.status,200);
 assert.equal(sms,1);
});
