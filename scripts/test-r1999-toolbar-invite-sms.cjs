'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const read=p=>fs.readFileSync(p,'utf8');
const css=read('dist/web/photobridge-r1989-model2-segmented.css');
const ui=read('dist/web/assets/index-UIRefine-v655-r84.js');
const server=read('dist/api/server.js');

test('R1999: Print/Album/Finance/Video outer capsule has no border, active blue button stays readable',()=>{
 const last=css.slice(css.indexOf('/* PB1999 borderless navigation shells */'));
 assert(last.length>250,'latest outer frame override exists');
 assert.match(last,/\.pb1127PrintModes\.pb1989ModelTwo/);
 assert.match(last,/\.photographerPrintModeNav\.pb1989ModelTwo/);
 assert.match(last,/\.pb1127PrintUtilities/);
 assert.match(last,/\.photographerPrintModeUtilityCluster/);
 assert.match(last,/border:0!important;border-inline-start:0!important;border-inline-end:0!important/);
 assert.match(last,/outline:0!important;box-shadow:none!important;background:transparent!important/);
 assert.match(css,/background:var\(--pb1989-blue\)!important; border-color:var\(--pb1989-blue\)!important/,'active blue mode button is preserved');
 assert.match(css,/-webkit-text-fill-color:#fff!important/,'selected Print/Album labels remain white');
 assert.match(css,/button:not\(:first-child\)::before/,'internal button separators remain');
});
test('R1999: photographer SMS action explicitly uses the photographer cookie; Lab action unchanged',()=>{
 assert.match(ui,/Me\("\/api\/photographer-invites\/send-sms",\{method:"POST",headers:\{"x-photobridge-portal":"photographer"\},body:JSON\.stringify\(\{mobile:A\}\)\}\)/);
 assert.match(ui,/Me\("\/api\/photographer-invites\/send-sms",\{method:"POST",body:JSON\.stringify\(\{mobile:A,inviteId:de\.id,previousDebt:D/,'Lab's existing send call remains distinct and may include temporaryName');
 assert.match(server,/function inviteIssuerScope\(a,portal = ''\)/);
 assert.match(server,/if\(portal==='photographer'&&a\.labRole==='customer'\)return \{type:'photographer',labId:null\}/);
});

function recipientLookup(db){
 const a=server.indexOf('async function photographerInviteRecipientRegistered(mobile) {');
 const b=server.indexOf('async function mobileAlreadyRegistered(mobile)',a);
 assert(a>=0&&b>a,'recipient predicate must remain a distinct helper');
 return new Function('pool',server.slice(a,b)+'\nreturn photographerInviteRecipientRegistered;')(db);
}
test('R1999: recipient lookup uses indexed exact matches then bounded SQL legacy fallback, not all user mobiles',async()=>{
 let calls=[];
 const db={query:async(sql,args)=>{calls.push({sql,args});return {rows:[],rowCount:0}}};
 const registered=recipientLookup(db);
 assert.equal(await registered('09121234567'),false);
 assert.equal(calls.length,2);
 assert.match(calls[0].sql,/SELECT 1 FROM users WHERE mobile=ANY\(\$1::text\[\]\) LIMIT 1/);
 assert.deepEqual(calls[0].args[0],['09121234567','989121234567','+989121234567','00989121234567','9121234567']);
 assert.match(calls[1].sql,/right\(regexp_replace/);
 assert.match(calls[1].sql,/LIMIT 1/);
 assert.deepEqual(calls[1].args,['9121234567']);
 assert.doesNotMatch(server.slice(server.indexOf('/* PB1999 photographer recipient lookup */'),server.indexOf('async function mobileAlreadyRegistered')),/SELECT mobile FROM users WHERE mobile IS NOT NULL/);
 calls=[];db.query=async(sql,args)=>{calls.push(sql);return {rowCount:1,rows:[{}]}};
 assert.equal(await registered('09121234567'),true);
 assert.equal(calls.length,1,'normal mobile match is only one simple SQL query');
});

function makeSmsHandler(deps={}){
 const a=server.indexOf("if (req.method === 'POST' && url.pathname === '/api/photographer-invites/send-sms') {");
 const b=server.indexOf("        if (scope.type !== 'lab' || !scope.labId)",a);
 assert(a>0&&b>a,'exact SMS photographer branch must be present');
 const branch=server.slice(a,b);
 assert.match(branch,/await photographerInviteRecipientRegistered\(mobile\)/);
 assert.match(branch,/await repairPhotographerInviteRuntimeSchema\(\)/);
 assert.match(branch,/const full = await photographerInviteByCode\(inv\.code\)\.catch\(\(\) => inv\) \|\| inv;/);
 const ctx={
  req:{method:'POST',headers:{'x-photobridge-portal':'photographer'}},res:{},url:{pathname:'/api/photographer-invites/send-sms'},a:{userId:'user-a',labRole:'customer'},pool:{query:async()=>({rowCount:0,rows:[]})},
  inviteIssuerScope:(a,portal)=>portal==='photographer'?{type:'photographer'}:null,
  requestPortal:req=>req.headers['x-photobridge-portal']||'default',bodyJson:async()=>({mobile:'09121234567'}),
  normalizeMobile:x=>x,photographerInviteRecipientRegistered:async()=>false,
  sendJson:(_r,status,payload)=>({status,payload}),repairPhotographerInviteRuntimeSchema:async()=>{},
  newPhotographerInviteCode:()=> 'PB-123',photographerInviteMobileBinding:()=> 'binding',
  PUBLIC_APP_URL:'https://photobridge.ir',PUBLIC_GUIDE_URL:'https://photobridge.ir/guide',
  sendSms:async()=>({reference:'provider-ack'}),audit:async()=>{},photographerInviteByCode:async()=>{throw Error('presentation_down')},
  photographerInvitePublicView:inv=>({id:inv.id,code:inv.code})
 };
 Object.assign(ctx,deps);
 const keys=Object.keys(ctx);
 const execute=new Function(...keys,'return (async()=>{'+branch+'\n}\n})()');
 return ()=>execute(...keys.map(k=>ctx[k]));
}
test('R1999: schema mismatch repairs once; sent SMS stays success if optional invite read fails',async()=>{
 const inv={id:'invite-1',code:'PB-123'};
 let inserts=0,repairs=0,sends=0;
 const pool={query:async(sql)=>{
  if(sql.includes("SELECT * FROM photographer_invites WHERE issuer_type='photographer'"))return {rowCount:0,rows:[]};
  if(sql.startsWith('INSERT INTO photographer_invites')){inserts++;if(inserts===1)throw Object.assign(Error('schema'),{code:'23514'});return {rowCount:1,rows:[inv]};}
  if(sql.startsWith('SELECT name FROM users'))return {rowCount:1,rows:[{name:'عکاسی'}]};
  throw Error('unexpected SQL '+sql);
 }};
 const result=await makeSmsHandler({pool,repairPhotographerInviteRuntimeSchema:async()=>{repairs++},sendSms:async()=>{sends++;return {reference:'p-1'}}})();
 assert.equal(result.status,200);
 assert.equal(result.payload.sms.sent,true);
 assert.equal(result.payload.invite.id,inv.id);
 assert.equal(repairs,1);
 assert.equal(inserts,2);
 assert.equal(sends,1);
});
test('R1999: already registered photographer still cannot obtain a targeted new-signup SMS',async()=>{
 let sends=0;
 const result=await makeSmsHandler({photographerInviteRecipientRegistered:async()=>true,sendSms:async()=>{sends++}})();
 assert.equal(result.status,409);
 assert.equal(result.payload.error,'already_registered');
 assert.equal(sends,0);
});
test('R1999: provider failure remains retryable, without claiming SMS sent',async()=>{
 const inv={id:'invite-1',code:'PB-123'};
 const pool={query:async sql=>{
  if(sql.includes('SELECT * FROM photographer_invites WHERE issuer_type='))return {rowCount:1,rows:[inv]};
  if(sql.startsWith('SELECT name FROM users'))return {rowCount:1,rows:[{name:'استودیو'}]};
  throw Error('unexpected '+sql);
 }};
 const result=await makeSmsHandler({pool,sendSms:async()=>{throw Object.assign(Error('sms_provider_rejected'),{status:502})},console:{error:()=>{}}})();
 assert.equal(result.status,502);
 assert.equal(result.payload.inviteCreated,true);
 assert.equal(result.payload.canRetry,true);
 assert.equal(result.payload.error,'sms_provider_rejected');
});
test('R1999: final HTML contains both new asset revisions',()=>{
 const html=read('dist/web/index.html');
 assert.match(html,/photobridge-r1989-model2-segmented\.css[^"'<>\s]*bareFrame=r1999/);
 assert.match(html,/index-UIRefine-v655-r84\.js[^"'<>\s]*inviteSend=r1999/);
 assert.doesNotThrow(()=>new vm.Script(ui.replace(/^import[^;]+;/gm,'')),'UI syntax');
});
