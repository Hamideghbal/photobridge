const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const patch=fs.readFileSync('scripts/enable-r1850-error-alerts.mjs','utf8');
// Execute the production route template with controlled auth/storage/SMS dependencies.
const route=patch.split('const routes=`')[1].split('`;')[0];
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
async function run({pathname='/api/diagnostics/errors',method='POST',actor={userId:'customer'},origin='https://photobridge.ir',limit=true,body={source:'upload',code:'SlowDown',status:503}}={}){
let recorded=[],result;
const monitor={allow:()=>limit,record:async x=>{recorded.push(x);return 'PB-123'},list:async()=>[{id:'private'}]};
const req={method,headers:{host:'photobridge.ir',origin,'content-type':'application/json'}};
const fn=new AsyncFunction('url','req','res','sendJson','auth','requireRole','PB1850monitor','requestIpHash','bodyJson','pool',route);
await fn({pathname},req,{},(_,status,body)=>{result={status,body}},async()=>actor,(a,r)=>a?.platformRole===r,monitor,()=> 'ip',async()=>body,{query:async()=>({rows:[]})});
return {result,recorded};}
test('customer report records authenticated server identity instead of spoofed identity',async()=>{const {result,recorded}=await run({body:{userId:'forged-admin',source:'server',code:'SlowDown'}});assert.equal(result.status,202);assert.equal(recorded[0].userId,'customer');assert.equal(recorded[0].source,'browser')});
test('unauthenticated reports and cross-origin requests cannot trigger SMS',async()=>{for(const opts of [{actor:null},{origin:'https://evil.test'},{origin:''}]){const {result,recorded}=await run(opts);assert.ok([401,403].includes(result.status));assert.equal(recorded.length,0)}});
test('only platform administrators can read incidents',async()=>{assert.equal((await run({pathname:'/api/admin/error-incidents',method:'GET'})).result.status,403);assert.equal((await run({pathname:'/api/admin/error-incidents',method:'GET',actor:{platformRole:'platform_admin'}})).result.status,200)});
test('rate-limited and malformed reports cannot create incident',async()=>{assert.equal((await run({limit:false})).result.status,429);assert.equal((await run({body:[]})).result.status,400)});
test('non-admin cannot access success statistics',async()=>{assert.equal((await run({pathname:'/api/admin/upload-statistics',method:'GET'})).result.status,403)});
