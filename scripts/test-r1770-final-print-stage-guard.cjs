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
