// R1768: guard the name shown to labs after a preregistered mobile placeholder completes signup.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('dist/api/server.js','utf8');
const patch=fs.readFileSync('scripts/enable-r1768-invited-photographer-display.mjs','utf8');
const profile="(SELECT NULLIF(BTRIM(pb_profile.studio_name),'') FROM photographer_profiles pb_profile WHERE pb_profile.user_id=u.id LIMIT 1)";
const withWalkin='COALESCE(o.walkin_customer_name,'+profile+',u.name)';
const withFinance='ELSE COALESCE('+profile+',u.name) END';
function sliceFrom(start,until,max=15000){
 const a=source.indexOf(start),b=a<0?-1:source.indexOf(until,a+start.length);
 assert(a>=0,'missing '+start);
 assert(b>a&&b-a<max,'changed query boundary for '+start);
 return source.slice(a,b);
}
test('R1768: finance invoices, receipts and ledgers prefer a valid profile studio name',()=>{
 const resolver=sliceFrom('function labFinanceCustomerNameSql()','async function audit(');
 assert(resolver.includes('account_deleted_at IS NOT NULL'),'deleted-account label retained');
 assert(resolver.includes("|| ' (حساب حذف‌شده)'"),'historical deleted-account suffix retained');
 assert(resolver.includes(withFinance),'active invoice resolver prefers registered studio');
 assert(!resolver.includes('      ELSE u.name END'),'mobile placeholder must not take precedence');
 assert(source.includes('${labFinanceCustomerNameSql()} customer_name'),'invoice/finance queries still share the resolver');
});
test('R1768: every legacy lab order and invoice walk-in name resolver receives the studio fallback',()=>{
 // The R1768 patch upgrades exactly five existing expressions. Check their
 // resulting SQL aliases, not the exact surrounding SELECT/join formatting;
 // later independent releases may legitimately add fields to those queries.
 const uses=source.split(withWalkin);
 assert.equal(uses.length-1,5,'all five original walk-in/order queries were upgraded');
 for(const [i,tail] of uses.slice(1).entries()){
   assert.match(tail.slice(0,80),/^\\s+customer_name\\b/,'upgraded display expression #'+(i+1)+' must still supply customer_name');
 }
 assert(source.includes("COALESCE(o.walkin_customer_name,"+profile+",u.name,'مشتری آزاد')"),'completed order archive uses studio while retaining walk-in and free-customer fallbacks');
 assert(!source.includes('COALESCE(o.walkin_customer_name,u.name)'),'no old mobile-first walk-in display remains');
});

test('R1768: pending and delegated lab order labels prefer studio without modifying order data',()=>{
 assert(source.includes('o.priority,o.delivery,COALESCE('+profile+',u.name) customer_name'));
 assert(source.includes('SELECT o.*,COALESCE('+profile+',u.name) customer_name FROM orders o\n                    JOIN lab_delegated_order_intakes'));
 assert(source.includes('PB_R1768_INVITED_STUDIO_DISPLAY'));
 assert(!/UPDATE users|UPDATE invoices|ALTER TABLE|DELETE FROM|DROP TABLE/i.test(patch),'patch must remain display-only');
});
test('R1768: placeholder signup is still a separate identity and the R1752 roster remains profile-first',()=>{
 const prereg=fs.readFileSync('dist/api/lab-invite-preregistration.js','utf8');
 assert(prereg.includes("INSERT INTO users(name,mobile,password_hash,platform_role,active) VALUES($1,$1,$2,'user',true)"));
 assert(source.includes('resolvedName = String(profile?.studio_name || name'));
 assert(source.includes('THEN COALESCE(NULLIF(pp.studio_name,\'\'),u.name)'),'active lab roster still uses profile');
});
