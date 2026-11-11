'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const marker='/* PB1770 FINAL PRINT STAGE GUARD */';
const asset='assets/index-UIRefine-v655-r84.js';
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 test('R1770: '+root+' verifies real local files before print PATCH',async()=>{
  const s=fs.readFileSync(root+'/'+asset,'utf8');
  assert.equal(s.split(marker).length,2);
  const a=s.indexOf('It=async(le,nt,xt)=>{'),b=s.indexOf(',gn=async le=>',a);
  assert(a>=0&&b>a&&b-a<1600);
  const handler=s.slice(a,b),predicate='pb1450AllowStage(le)';
  assert(handler.indexOf(predicate)>0);
  assert(handler.indexOf(predicate)<handler.indexOf('method:"PATCH"'));
  assert.match(handler,/^It=async\(le,nt,xt\)=>\{if\(nt==="printing"&&!await pb1450AllowStage\(le\)\)/);
  const calls=[],ctx={
   pb1450AllowStage:async order=>{calls.push(['verify',order.id]);return false},
   B:fn=>calls.push(['redraw',fn(0)]),
   Me:async(path,opts)=>{calls.push(['PATCH',path,opts?.method]);return {ok:true}},
   ye:async()=>calls.push(['refresh'])
  };
  const fn=vm.runInNewContext('('+handler.slice(3)+')',ctx);
  const blocked=await fn({id:'test-order'},'printing');
  assert.equal(blocked.blocked,true);
  assert.deepEqual(calls.map(x=>x[0]),['verify','redraw']);
  calls.length=0;
  ctx.pb1450AllowStage=async order=>{calls.push(['verify',order.id]);return true};
  const accepted=await fn({id:'test-order'},'printing');
  assert.equal(accepted.ok,true);
  assert.deepEqual(calls.map(x=>x[0]),['verify','PATCH','refresh']);
  const html=fs.readFileSync(root+'/index.html','utf8');
  assert.match(html,/&printGuard=r1770/);
  const manifestPath=root+'/manifest.json';
  if(fs.existsSync(manifestPath)){
   const m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
   for(const name of [asset,'index.html']){
    const row=m.files.find(x=>x.name===name);
    assert(row&&row.sha256===crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
   }
  }
 });
}

test('R1770: final ready, completed and album transitions verify before any mutation',async()=>{
 for(const root of ['dist/web','dist/web/lab-desktop-ui']){
  const s=fs.readFileSync(root+'/'+asset,'utf8');
  for(const item of [
   {begin:'un=async le=>{',end:',Cn=async(le,nt)=>',stage:undefined,guard:'if(!await pb1450AllowStage(le))'},
   {begin:'gn=async le=>{',end:',Vn=async',stage:undefined,guard:'if(!await pb1450AllowStage(le))'},
   {begin:'Cn=async(le,nt)=>{',end:',aa=async(le,nt)=>',stage:'ready',guard:'if(["printing","binding","ready","completed"].includes(nt)&&!await pb1450AllowStage(le))'}
  ]){
   const a=s.indexOf(item.begin),b=s.indexOf(item.end,a+item.begin.length);
   assert(a>=0&&b>a&&b-a<18000,root+' '+item.begin+' handler');
   const h=s.slice(a,b);
   assert(h.startsWith(item.begin+item.guard),root+' '+item.begin+' guard not at entry');
   const events=[];
   const ctx={pb1450AllowStage:async()=>{events.push('verify');return false},B:()=>events.push('redraw'),
    Me:async()=>{events.push('api');throw Error('mutation before verification')},
    It:async()=>{events.push('stage');throw Error('stage before verification')},
    Gt:async()=>{events.push('refresh');throw Error('transition before verification')}};
   const fn=vm.runInNewContext('('+h.slice(item.begin.indexOf('=')+1)+')',ctx);
   await fn({id:'test-order'},item.stage);
   assert.deepEqual(events,['verify','redraw'],root+' '+item.begin+' must block before mutations');
  }
 }
});
