const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1556-admin-lab-discount.css','utf8');
const server=fs.readFileSync('dist/api/server.js','utf8');
const start=bundle.indexOf('className:"card tableCard adminLabsTable"');
const end=bundle.indexOf('I==="photographers"&&',start);
const adminLabs=bundle.slice(start,end);
test('lab list has independently editable percentage and save control in each row',()=>{
 assert.ok(start>0 && end>start,'admin labs table exists');
 assert.match(adminLabs,/children:"درصد تخفیف اشتراک"/);
 assert.match(adminLabs,/className:"pbR1556LabDiscountCell"/);
 assert.match(adminLabs,/defaultValue:Number\(q.subscription_discount_percent\|\|0\)/);
 assert.match(adminLabs,/min:0,max:100,step:0\.5/);
 assert.match(adminLabs,/aria-label":"درصد تخفیف اشتراک "\+q.name/);
 assert.match(adminLabs,/Me\("\/api\/admin\/labs\/"\+encodeURIComponent\(q.id\)/);
 assert.match(adminLabs,/method:"PATCH",body:JSON.stringify\(\{subscriptionDiscountPercent:percent\}\)/);
 assert.match(adminLabs,/!Number\.isFinite\(percent\)\|\|percent<0\|\|percent>100/);
});
test('the UI checks server response and readback for the specific lab, without changing other labs',()=>{
 assert.match(adminLabs,/Number\(saved.subscription_discount_percent\)!==percent/);
 assert.match(adminLabs,/const check=await Me\("\/api\/admin\/labs"\)/);
 assert.match(adminLabs,/\.find\(v=>String\(v.id\)===String\(q.id\)\)/);
 assert.match(adminLabs,/Boolean\(persisted.subscription_discount_enabled\)!==\(percent>0\)/);
 assert.match(adminLabs,/await be\(\)/);
 assert.match(adminLabs,/تخفیف مبلغی فعلی/);
});
test('lab list uses existing admin-only discount endpoint and existing subscription pricing',()=>{
 assert.match(server,/Object\.prototype\.hasOwnProperty\.call\(b,'subscriptionDiscountPercent'\)/);
 assert.match(server,/UPDATE labs SET subscription_discount_percent=\$2::numeric,subscription_discount_enabled=\(\$2::numeric > 0\),subscription_discount_amount=0/);
 assert.match(server,/const special = applySpecialDiscount\(planAmount, discountEnabled, specialDiscountAmount, labRow\?\.subscription_discount_percent\)/);
});
test('only fresh admin bundle and stylesheet are linked',()=>{
 assert.match(html,/index-UIRefine-v655-r84\.js\?v=r1159&adminLabDiscount=r1556/);
 assert.match(html,/photobridge-r1556-admin-lab-discount\.css\?v=r1556/);
 assert.match(css,/\.adminLabsTable \.pbR1556LabDiscountEditor/);
});
