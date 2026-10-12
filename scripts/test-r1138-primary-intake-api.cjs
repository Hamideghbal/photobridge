const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('dist/api/server.js','utf8');
const start=source.indexOf('const requireLocalIntakePrimary = async');
const end=source.indexOf('\n        };',start)+11;
assert(start>=0&&end>start);
const expression=source.slice(start,end).replace('const requireLocalIntakePrimary = ','').replace(/;\s*$/,'');
for(const [primary,device,status] of [[null,'primary',409],['primary','other',403],['primary','',403],['primary','primary',null]])test(`local intake device binding: ${device||'missing'} / ${primary||'unregistered'}`,async()=>{
 const writes=[];const res={};const pool={query:async(sql,args)=>{assert.match(sql,/FROM labs WHERE id=\$1/);assert.deepEqual(args,['lab']);return{rows:[{primary_download_device_id:primary}]};}};
 const guard=Function('pool','labId','requestDeviceId','res','sendJson',`return (${expression})`)(pool,'lab',device,res,(r,s,b)=>writes.push({s,b}));
 assert.equal(await guard(),status===null);assert.equal(writes.length,status===null?0:1);if(status)assert.equal(writes[0].s,status);
});
test('create, metadata registration and final submit all apply primary binding for local intake',()=>{
 assert.match(source,/b\.localOnly === true && !await requireLocalIntakePrimary\(\)/);
 assert.match(source,/if \(deviceLocal && !await requireLocalIntakePrimary\(\)\) return/);
 assert.match(source,/startsWith\('client-local-recovery\/'\)\) && !await requireLocalIntakePrimary\(c\)/);
});
