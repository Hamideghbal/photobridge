const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const source=()=>fs.readFileSync('dist/web/photobridge-v904r98-invite-stable.js','utf8');
test('public invitation without mobile opens phone-only gate after concurrent invite fetch',async()=>{
 const s=source(),a=s.indexOf('  async function bootstrap(){'),b=s.indexOf('  window.fetch=async function(',a);
 assert.ok(a>=0&&b>a,'R1411 bootstrap must exist');
 let released=false,releasedFull=false;const state={ctx:null,loading:false,contextReady:false};const calls=[];
 const run=vm.runInNewContext('('+s.slice(a,b).trim()+')',{
  state,inviteCode:'PB-TEST',mobile:'',mb:'',digits:v=>String(v||''),nativeFetch:async url=>{
   calls.push(url);return {ok:true,json:async()=>({invite:{active:true,targetMobile:null}})}
  },mergeCtx:x=>state.ctx={...state.ctx,...x},releaseContextGate(){releasedFull=true;state.contextReady=true},
  acceptSignupContext(){throw Error('public invitation must not invent account data')},
  window:{__PB_INVITE_GATE_TIMEOUT__:1},clearTimeout(){},
  document:{getElementById:()=>null,documentElement:{classList:{remove(){released=true}}}},
  scheduleSeries(){},showContextRetry(){throw Error('should not block public link')},encodeURIComponent
 });
 await run();
 assert.equal(state.awaitingMobile,true);
 assert.equal(state.contextReady,false);
 assert.equal(releasedFull,false,'public link must not show unverified signup details');
 assert.ok(released);
 assert.equal(calls.length,1);
 assert.equal(state.ctx.existingAccount,undefined);
});
test('phone-bound invitation retains parallel authoritative account validation',async()=>{
 const s=source(),a=s.indexOf('  async function bootstrap(){'),b=s.indexOf('  window.fetch=async function(',a);
 assert.ok(a>=0&&b>a,'R1411 bootstrap must exist');
 const state={ctx:null,loading:false,contextReady:false},calls=[];let accepted=false;
 const run=vm.runInNewContext('('+s.slice(a,b).trim()+')',{
  state,inviteCode:'PB-TEST',mobile:'09121234567',mb:'signed',digits:v=>String(v||''),
  nativeFetch:async url=>{calls.push(url);return {ok:true,json:async()=>url.includes('photographer-invites')?{invite:{active:true}}:{existingAccount:{exists:true}}}},
  mergeCtx:x=>state.ctx={...state.ctx,...x},
  acceptSignupContext:x=>{accepted=!!x.existingAccount;state.contextReady=accepted;return accepted},
  releaseContextGate(){throw Error('must use account-specific context')},scheduleSeries(){},
  showContextRetry(){throw Error('unexpected retry')},encodeURIComponent
 });
 await run();
 assert.ok(accepted);
 assert.equal(state.awaitingMobile,undefined);
 assert.equal(calls.length,2);
 assert.ok(calls.some(url=>url.includes('/context-fast?')));
});
test('finance pin removed, contextual help retained and updated; transform idempotent',()=>{const paths=['dist/web/assets/index-UIRefine-v655-r84.js','dist/web/index.html','dist/web/photobridge-v904r98-invite-stable.js'];const ui=fs.readFileSync(paths[0],'utf8');assert.ok(!ui.includes('className:"financeQuickPin '));assert.ok(ui.includes('className:"financeHelpButton"'));assert.ok(ui.includes('فاکتور سفارش چاپ و آلبوم هنگام «آماده تحویل»'));const before=paths.map(p=>fs.readFileSync(p,'utf8'));execFileSync(process.execPath,['scripts/enable-r1378-lab-fixes.mjs']);paths.forEach((p,i)=>assert.equal(fs.readFileSync(p,'utf8'),before[i]));});
test('domain panel renders remove only for unpaid unreserved candidates and sends online removal endpoint',()=>{const s=fs.readFileSync('scripts/r1365-components.js','utf8');const a=s.indexOf('function PB1373DomainPanel(');let calls=0;const data={requests:[{domain:'remove.ir',status:'quoted'},{domain:'paid.ir',status:'paid_pending_registration',paymentStatus:'paid'},{domain:'pending.ir',status:'quoted',gatewayCheckoutId:'track'}],pricing:{prices:{ir:99000},url:'https://example.com'},domains:[]};const jsx=(type,props)=>({type,...props});const fn=vm.runInNewContext('('+s.slice(a).trim()+')',{x:{useState:v=>[calls++===0?data:v,()=>{}],useEffect(){}},e:{jsx,jsxs:jsx},location:{search:''},URLSearchParams,Me(){},PB1370InstallerVersion:String});const tree=fn({}),found=[];function visit(x){if(Array.isArray(x))return x.forEach(visit);if(x&&typeof x==='object'){if(x['aria-label']?.startsWith('حذف درخواست'))found.push(x['aria-label']);visit(x.children)}}visit(tree);assert.deepEqual(found,['حذف درخواست remove.ir']);assert.ok(s.includes("kind==='remove'?'/zibal/remove'"));});
