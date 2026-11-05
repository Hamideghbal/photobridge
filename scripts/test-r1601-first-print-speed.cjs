'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {patchDesktop}=require('./r1601-first-print-desktop.cjs');
const {patchLabDirectory}=require('./r1601-lab-directory-fast.cjs');
const {patchActiveLabEntry}=require('./r1601-active-lab-entry.cjs');
const nav=fs.readFileSync('dist/web/photobridge-r1126-desktop-navigation.js','utf8');
const server=fs.readFileSync('dist/api/server.js','utf8');
const route=s=>{const a=s.indexOf("if (req.method === 'GET' && url.pathname === '/api/customer/labs') {"),b=s.indexOf('const customerLabRequest = url.pathname.match(',a);assert.ok(a>0&&b>a);return s.slice(a,b)};
test('R1601 desktop Print reuses one iframe and prewarms only a verified photographer page',()=>{
 const output=patchDesktop(nav);
 assert.equal(patchDesktop(output),output);
 assert.doesNotThrow(()=>new Function(output));
 assert.equal((output.match(/document\.createElement\('iframe'\)/g)||[]).length,(nav.match(/document\.createElement\('iframe'\)/g)||[]).length);
 assert.match(output,/const panel=pb1601EnsurePanel\(key\)/);
 assert.match(output,/window\.requestIdleCallback/);
 const begin=output.indexOf('/* PB1601 warm first photographer print frame */'),end=output.indexOf(' function schedule(){',begin);
 assert.ok(begin>0&&end>begin);
 const part=output.slice(begin,end);
 const make=(authenticated)=>{
  const panels=new Map(),created=[],panel={hidden:false,isConnected:true,querySelector:()=>({addEventListener(){}})};
  const machine=new Function('panels','selected','document','location','nativeHeader','window','pb1601EnsurePanel','setTimeout',part+'\nreturn pb1601ScheduleWarmPrint;')(
   panels,null,{hidden:false},{pathname:'/photographer/gallery'},()=>authenticated?{}:null,{requestIdleCallback:cb=>cb()},
   key=>{created.push(key);panels.set(key,panel);return panel},cb=>cb());
  machine();machine();return {created,panel};
 };
 assert.deepEqual(make(true).created,['print']);
 assert.deepEqual(make(false).created,[]);
});
test('R1601 lab directory keeps original SQL and privileges, overlapping independent reads',()=>{
 const out=patchLabDirectory(server),old=route(server),faster=route(out);
 assert.equal(patchLabDirectory(out),out);
 const tick=String.fromCharCode(96),pattern=new RegExp('pool\\.query\\('+tick+'([\\s\\S]*?)'+tick+',\\s*\\[','g');
 const sql=s=>[...s.matchAll(pattern)].map(m=>m[1]);
 assert.deepEqual(sql(faster),sql(old));
 assert.ok(sql(faster).length>=4);
 assert.match(faster,/await Promise\.all\(\[membershipsPromise,labsPromise,testLabsPromise,originContextPromise\]\)/);
 assert.match(faster,/if \(!canDiscoverLabs && invitedLabIds\.length/);
 assert.match(faster,/sortPrimary\(memberships\.rows\)/);
 assert.match(faster,/invitationScoped: !canDiscoverLabs/);
});
test('R1601 actual async route overlaps SQL with identical directory payload',async()=>{
 const source=route(patchLabDirectory(server));let active=0,max=0;
 const delay=async result=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,8));active--;return result};
 const pool={query:sql=>{
  if(sql.includes('SELECT l.id,l.name,l.slug,l.province,l.city,l.service_only,m.active'))return delay({rows:[{id:'lab1',name:'Connected'}]});
  if(sql.includes('l.photographer_discovery_enabled=true'))return delay({rows:[{id:'lab1',name:'Connected'},{id:'lab2',name:'Public'}]});
  return delay({rows:[]});
 }};
 const execute=new Function('req','url','a','labId','pool','photographerCanDiscoverLabs',
  'photographerInvitedLabIds','photographerInitialOriginContext','testAccountVisibleSql','testAccountSql','sendJson','res',
  'return (async()=>{'+source+'})()');
 const result=await execute({method:'GET'},{pathname:'/api/customer/labs'},{userId:'u1'},'lab1',
  pool,async()=>true,async()=>[],()=>delay({originType:'self',primaryLabId:null}),
  ()=>'TRUE',()=>'FALSE',(res,status,payload)=>({status,payload}),{});
 assert.ok(max>=3,'independent API operations should overlap');
 assert.equal(result.status,200);
 assert.deepEqual(result.payload.memberships.map(v=>v.id),['lab1']);
 assert.deepEqual(result.payload.labs.map(v=>v.id),['lab1','lab2']);
 assert.equal(result.payload.invitationScoped,false);
});
test('R1601 invited-lab-only account still sees only accepted labs and primary sort',async()=>{
 const source=route(patchLabDirectory(server)),queries=[];
 const pool={query:async(sql,params)=>{
  queries.push({sql,params});
  if(sql.includes('SELECT l.id,l.name,l.slug,l.province,l.city,l.service_only,m.active'))
   return {rows:[{id:'lab1',name:'One'},{id:'lab2',name:'Two'}]};
  if(sql.includes('0::numeric photographer_join_discount_percent,true connected'))
   return {rows:[{id:'lab1',name:'One'},{id:'lab2',name:'Two'}]};
  return {rows:[]};
 }};
 const execute=new Function('req','url','a','labId','pool','photographerCanDiscoverLabs',
  'photographerInvitedLabIds','photographerInitialOriginContext','testAccountVisibleSql','testAccountSql','sendJson','res',
  'return (async()=>{'+source+'})()');
 const answer=await execute({method:'GET'},{pathname:'/api/customer/labs'},{userId:'u1'},'lab1',
  pool,async()=>false,async()=>['lab1','lab2'],
  async()=>({originType:'lab',primaryLabId:'lab2'}),
  ()=>'TRUE',()=>'FALSE',(res,status,payload)=>({status,payload}),{});
 assert.equal(answer.status,200);
 assert.equal(answer.payload.canDiscoverLabs,false);
 assert.equal(answer.payload.invitationScoped,true);
 assert.deepEqual(answer.payload.labs.map(x=>x.id),['lab2','lab1']);
 assert.deepEqual(answer.payload.memberships.map(x=>x.id),['lab2','lab1']);
 assert.equal(queries.filter(x=>x.sql.includes('UPDATE users')).length,0);
});
test('R1601 existing selected lab enters print by SPA navigation; changed lab still reloads',()=>{
 const old='if(String(S)===String((a==null?void 0:a.activeLabId)||"")){location.assign("/photographer/orders/flow?workspace=print");return}';
 const altered=patchActiveLabEntry(old),head=altered.slice(0,altered.indexOf('\n/* PB1601'));
 assert.equal(patchActiveLabEntry(altered),altered);
 assert.ok(head.includes('history.pushState'));
 const calls=[];
 const body=new Function('S','a','t','location','history','window','PopStateEvent','URL','URLSearchParams',head);
 const location={origin:'https://photobridge.ir',search:'?pbDesktopContent=1',assign:target=>calls.push('reload:'+target)};
 const history={pushState:(_data,_title,url)=>calls.push('spa:'+url)};
 const win={dispatchEvent:evt=>calls.push('event:'+evt.type)};
 const Event=class{constructor(type){this.type=type}};
 body('lab1',{activeLabId:'lab1'},{id:'lab1'},location,history,win,Event,URL,URLSearchParams);
 assert.ok(calls.some(x=>x==='spa:/photographer/orders/flow?workspace=print&pbDesktopContent=1'));
 assert.ok(calls.includes('event:popstate'));
 assert.ok(!calls.some(x=>x.startsWith('reload:')));
 calls.length=0;
 body('lab1',{activeLabId:'lab1'},{id:'different'},location,history,win,Event,URL,URLSearchParams);
 assert.deepEqual(calls,['reload:/photographer/orders/flow?workspace=print']);
 calls.length=0;
 body('lab2',{activeLabId:'lab1'},{id:'lab1'},location,history,win,Event,URL,URLSearchParams);
 assert.deepEqual(calls,[],'new lab must still pass through the existing secure selection path');
});
test('R1601 stages are web/desktop-only and keep disabled Lab card animation',()=>{
 const stage=fs.readFileSync('scripts/enable-r1601-first-print-speed.mjs','utf8');
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert.match(build,/enable-r1601-first-print-speed\.mjs/);
 assert.doesNotMatch(build,/await deployStep\('\.\/enable-r1593-lab-card-flight\.mjs'\)/);
 assert.doesNotMatch(stage,/lab-desktop-ui/);
 if(process.env.PB1601_VERIFY_BUNDLE==='1'){
  assert.match(nav,/PB1601 warm first photographer print frame/);
  assert.match(server,/PB1601 parallel photographer lab directory queries/);
  assert.match(fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),/PB1601 same active lab enters print/);
  assert.match(fs.readFileSync('dist/web/index.html','utf8'),/firstPrint=r1601/);
  assert.match(fs.readFileSync('dist/web/index.html','utf8'),/labEntry=r1601/);
 }
});
