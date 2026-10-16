const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const vm=require('node:vm');
const server=fs.readFileSync('dist/api/server.js','utf8');
const marker='/* PB_R1264_ADMIN_MANAGER_MOBILE_ONLY */';
test('R1264 admin mobile-only manager change is within platform-admin PATCH route',()=>{
 const at=server.indexOf(marker);
 assert(at>0,'build must inject safe mobile-only handler');
 const route=server.lastIndexOf('const adminRentalShop = url.pathname.match(',at);
 const auth=server.indexOf("if (!requireRole(a, 'platform_admin')) return sendJson(res, 403",route);
 assert(route>=0&&auth>route&&auth<at,'must remain inside existing platform-admin gate');
 const branch=server.slice(at,server.indexOf('const discountPercent = b.subscriptionDiscountPercent',at));
 assert(!/UPDATE users|INSERT INTO equipment_rental_shop_memberships|UPDATE sessions/i.test(branch));
 assert(branch.includes('manager_mobile=$2,updated_at=now()'));
});
const exec=async (body,currentMobile='09125555555')=>{
 const at=server.indexOf(marker),end=server.indexOf('const discountPercent = b.subscriptionDiscountPercent',at);
 const fragment=server.slice(at,end);
 const calls=[],results=[],current={id:'11111111-1111-4111-8111-111111111111',manager_mobile:currentMobile};
 const context={b:body,current,a:{userId:'admin'},res:{},console:{error:()=>{}},
  normalizeMobile:value=>{let x=String(value||'').replace(/[^0-9]/g,'');if(x.startsWith('0098'))x='0'+x.slice(4);else if(x.startsWith('98')&&x.length===12)x='0'+x.slice(2);else if(/^9\d{9}$/.test(x))x='0'+x;return x;},
  pool:{query:async(sql,params)=>{calls.push({sql,params});return{rowCount:1,rows:[{manager_mobile:params[1]}]}}},
  sendJson:(_res,status,payload)=>{results.push({status,payload});return payload},
  audit:async()=>{}
 };
 const fn=new vm.Script('(async()=>{'+fragment+'return "fallthrough";})()');
 await fn.runInNewContext(context);
 return{calls,results};
};
test('standalone manager-mobile patch updates only manager_mobile, never triggers owner rebinding',async()=>{
 const res=await exec({managerMobile:'+989123456789'});
 assert.equal(res.results[0].status,200);
 assert.equal(res.results[0].payload.manager_mobile,'09123456789');
 assert.equal(res.calls.length,1);
 assert.match(res.calls[0].sql,/SET manager_mobile=\$2,updated_at=now\(\) WHERE id=\$1 AND deleted_at IS NULL/);
});
test('invalid manager mobile rejected and unrelated form change falls through',async()=>{
 const invalid=await exec({managerMobile:'1111'});
 assert.equal(invalid.results[0].status,400);assert.equal(invalid.calls.length,0);
 const textMobile=await exec({managerMobile:'شماره نامعتبر'});
 assert.equal(textMobile.results[0].status,400);assert.equal(textMobile.calls.length,0);
 const unchanged=await exec({managerMobile:'09123456789',name:'edited'});
 assert.equal(unchanged.results.length,0);assert.equal(unchanged.calls.length,0);
});
