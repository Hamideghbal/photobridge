const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const path=require('node:path');

const jsx=(type,props)=>({type,...props});
const nodes=value=>!value?[]:Array.isArray(value)?value.flatMap(nodes):typeof value==='object'?[value,...nodes(value.children)]:[];

test('photographer invite has four explicitly placed first-row controls even on narrow screens',()=>{
 const css=fs.readFileSync('dist/web/photobridge-r1436-settings-invites.css','utf8');
 const start=css.indexOf('/* R1626: force all FOUR');
 assert(start>=0);
 const s=css.slice(start);
 for(let i=1;i<=4;i++)assert.match(s,new RegExp('grid-column:'+i+'!important;grid-row:1!important'));
 assert.match(s,/grid-template-columns:minmax\(0,1\.12fr\) minmax\(0,1fr\) minmax\(0,1fr\) max-content!important/);
 assert.match(s,/min-width:620px!important/);
});

test('referral URL and phone controls share a desktop row separated by a vertical rule; copy is inside address field',()=>{
 const css=fs.readFileSync('dist/web/photobridge-lab-referral-program.css','utf8');
 const s=css.slice(css.indexOf('/* R1626: one desktop row'));
 assert(s.length>200);
 assert.match(s,/grid-template-columns:minmax\(0,1\.25fr\) 1px minmax\(0,1fr\)!important/);
 assert.match(s,/\.labReferralInviteLink button\{[^}]*position:absolute!important;left:auto!important;right:5px!important/);
 assert.match(s,/\.labReferralInviteLink input\{[^}]*padding:8px 112px 8px 12px!important/);
 assert.match(s,/\.labReferralInviteDivider\{[^}]*width:1px!important/);
 assert.match(s,/\.labReferralInviteSend>button\{[^}]*grid-row:1!important;grid-column:2!important/);
});

test('only unregistered referral recipients have resend buttons; existing members display joined labels',()=>{
 const s=fs.readFileSync('scripts/lab-referral-ui.js.txt','utf8');
 const start=s.indexOf('function PBLabReferralPanel()'),end=s.indexOf('function PBLabReferralWelcome()',start);
 assert(start>=0&&end>start);
 const src=s.slice(start,end);
 const fresh={mobile:'09120000003',joined:false,registered:false,status:'sent'};
 const registered={mobile:'09120000002',joined:false,registered:true,status:'sent'};
 const joined={mobile:'09120000001',joined:true,registered:true,status:'sent',labName:'لابراتوار جدید'};
 const data={inviteUrl:'https://photobridge.ir/trial?labInvite=abc',smsHistory:[joined,registered,fresh],totalEarned:0,referrals:[]};
 let index=0;
 const states=[data,'', '',false,'',''];
 const x={useState:()=>[states[index++],()=>{}],useEffect:()=>{}};
 const panel=new Function('x','e','Me','V','PBLabReferralGuide',src+'return PBLabReferralPanel;')(x,{jsx,jsxs:jsx,Fragment:'fragment'},async()=>{},String,()=>null);
 const all=nodes(panel());
 assert.equal(all.filter(n=>n.type==='button'&&n.children==='ارسال مجدد').length,1);
 assert(all.some(n=>typeof n.children==='string'&&n.children.includes('عضو شده · لابراتوار جدید')));
 assert(all.some(n=>n.children==='قبلاً عضو لابراتوار شده'));
 assert(all.some(n=>typeof n.children==='string'&&n.children.includes('ثبت‌نام لابراتوار دعوت‌شده تکمیل شده')));
});

test('inviter status refreshes automatically and silently, without resetting typed invitation fields',()=>{
 const s=fs.readFileSync('scripts/lab-referral-ui.js.txt','utf8');
 const src=s.slice(s.indexOf('function PBLabReferralPanel()'),s.indexOf('function PBLabReferralWelcome()'));
 let count=0,timer,visibility='visible',timerCleared=false,focus,removed=false;
 const hooks=[],setters=[];
 const x={useState:v=>{const i=setters.length;setters.push((n)=>hooks.push({index:i,value:n}));return [v,setters[i]]},useEffect:cb=>{hooks.push({effect:cb})}};
 const win={addEventListener:(event,cb)=>{if(event==='focus')focus=cb},removeEventListener:(event,cb)=>{if(event==='focus'&&cb===focus)removed=true}};
 const doc={get visibilityState(){return visibility}};
 const load=async()=>{count++;return{inviteUrl:'link',smsHistory:[],referrals:[]}};
 const panel=new Function('x','e','Me','V','PBLabReferralGuide','window','document','setInterval','clearInterval',src+'return PBLabReferralPanel;')(x,{jsx,jsxs:jsx,Fragment:'fragment'},load,String,()=>null,win,doc,(cb,ms)=>{assert.equal(ms,12000);timer=cb;return 1},()=>{timerCleared=true});
 panel();
 const effect=hooks.find(entry=>entry.effect)?.effect;
 assert.equal(typeof effect,'function');
 const clean=effect();
 assert.equal(count,1);
 timer();assert.equal(count,2);
 visibility='hidden';timer();assert.equal(count,2);
 visibility='visible';focus();assert.equal(count,3);
 clean();assert(timerCleared&&removed);
});

test('referral SMS history identifies completed signup by matched phone and inviter, not SMS delivery',async()=>{
 const m=await import(pathToFileURL(path.resolve('dist/api/lab-referrals.js')).href);
 const sends=[{value:{mobile:'09120000001',status:'sent'},updated_at:'2026-11-05T13:00:00Z'},{value:{mobile:'09120000002',status:'sent'},updated_at:'2026-11-05T13:00:00Z'},{value:{mobile:'09120000003',status:'failed'},updated_at:'2026-11-05T13:00:00Z'}];
 let lookup=0;
 const db={query:async(sql,args=[])=>{
  if(sql.startsWith('INSERT INTO lab_referral_invites'))return{rows:[]};
  if(sql.startsWith('SELECT code,enabled FROM lab_referral_invites'))return{rows:[{code:'a'.repeat(48),enabled:true}]};
  if(sql.startsWith('SELECT l.name,f.registered_at,count'))return{rows:[]};
  if(sql.startsWith('SELECT COALESCE(sum(reward_amount)'))return{rows:[{total:0}]};
  if(sql.startsWith('SELECT l.name inviter_name'))return{rows:[]};
  if(sql.startsWith('SELECT value,updated_at FROM platform_settings'))return{rows:sends};
  if(sql.includes('FROM lab_memberships m')){
   lookup++;
   assert.match(sql,/f\.inviter_lab_id=\$1 AND f\.registered_user_id=u\.id/);
   assert.deepEqual(args[1],['9120000001','9120000002','9120000003']);
   return{rows:[{phone10:'9120000001',lab_name:'لابراتوار تازه',joined_at:'2026-11-05T13:05:00Z'},{phone10:'9120000002',lab_name:'لابراتوار قبلی',joined_at:null}]};
  }
  throw Error('Unexpected query: '+sql);
 }};
 const data=await m.labReferralSummary(db,'inviter-lab','inviter-user','https://photobridge.ir');
 assert.equal(lookup,1);
 assert.equal(data.smsHistory.length,3);
 assert.equal(data.smsHistory[0].joined,true);
 assert.equal(data.smsHistory[0].labName,'لابراتوار تازه');
 assert.equal(data.smsHistory[1].registered,true);
 assert.equal(data.smsHistory[1].joined,false);
 assert.equal(data.smsHistory[2].registered,false);
 assert.equal(data.smsHistory[2].joined,false);
});
