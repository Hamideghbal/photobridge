const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const server=fs.readFileSync('dist/api/server.js','utf8');
const owner=fs.readFileSync('dist/api/equipment-rental-portal.html','utf8');
const customer=fs.readFileSync('dist/api/equipment-rental-book.html','utf8');
const migration=fs.readFileSync('migrations/176_equipment_customer_rental_stock_modes.sql','utf8');
const c=fs.readFileSync('dist/web/photobridge-r1095-customer-stock.js','utf8');
const o=fs.readFileSync('dist/web/photobridge-r1095-owner-stock.js','utf8');

test('store keeps the two owner shortage policies',()=>{
 assert.match(migration,/customer_rental_stock_mode text NOT NULL DEFAULT 'flexible'/);
 assert.match(migration,/CHECK \(customer_rental_stock_mode IN \('flexible','strict'\)\)/);
 assert.match(server,/const customerStockMode=b\.customerStockMode===undefined/);
 assert.match(server,/customer_rental_stock_mode=\$30/);
 assert.match(o,/select name="customerStockMode"/);
 assert.match(o,/این تنظیم فقط برای مدیر و اپراتور فروشگاه است/);
});

test('photographer requests are always stock-safe while shortage permission belongs to store staff',()=>{
 assert.match(server,/const stockHeld=false/);
 assert.match(server,/if \(!allowShortage && !availability\.available\)/);
 assert.match(server,/allowShortage: shop\.customer_rental_stock_mode==='flexible'/);
 assert.match(server,/allowShortage:shop\.customer_rental_stock_mode==='flexible'&&body\.allowShortage===true/);
 assert.match(server,/initialStatus: 'pending_approval'/);
 assert.doesNotMatch(c,/customer_rental_stock_mode|selectedShopRecord/);
 assert.match(c,/x\.isAvailable===false/);
 assert.match(c,/موجود نمی‌باشد/);
 assert.doesNotMatch(c,/موجودی آزاد|کسری \+|row\.available|qty\.max=String/);
});

test('customer availability response exposes only binary stock state, not counts',()=>{
 assert.match(server,/isAvailable:row\.valid!==false&&Number\(row\.shortage\|\|0\)<=0/);
 assert.match(server,/hasAnyAvailability:row\.valid!==false&&Number\(row\.available\|\|0\)>0/);
 assert.match(server,/map\(\(\{stock_total,\.\.\.item\}\)=>item\)/);
 assert.match(server,/return sendJson\(res,409,\{error:'equipment_unavailable'\}\)/);
 assert.doesNotMatch(customer,/موجودی \$\{fa\(i\.stock_total\)\}/);
 assert.doesNotMatch(customer,/stock_total/);
});

test('store still sees detailed shortage quantities on incoming order cards',()=>{
 assert.match(o,/\.pbR1095StockDetails\.bad/);
 assert.match(o,/کسری موجودی:/);
 assert.match(o,/کسری '\+number\(x\.shortage\)/);
 assert.match(o,/excludeBookingId:id/);
});

test('production HTML loads one R1098 stock controller and scroll recovery',()=>{
 assert.equal(customer.split('/photobridge-r1095-customer-stock.js?v=1098').length-1,1);
 assert.equal(owner.split('/photobridge-r1095-owner-stock.js?v=1098').length-1,1);
 assert.equal(owner.split('/photobridge-r1098-owner-scroll.js?v=1098').length-1,1);
});


test('photographer invitations are SMS-only and the invite channel cannot be disabled by a shop',()=>{
 assert.doesNotMatch(owner,/id="copyRentalInvite"|id="rentalInviteUrl"|>کپی لینک</);
 assert.doesNotMatch(owner,/id="smsInviteEnabled"/);
 assert.match(owner,/پیامک دعوت عکاس · همیشه فعال/);
 assert.match(owner,/هزینه این پیامک توسط PhotoBridge پرداخت می‌شود/);
 assert.match(owner,/ارسال دعوتنامه پیامکی/);
 assert.match(owner,/دعوت عکاس فقط از طریق پیامک انجام می‌شود/);
 assert.match(owner,/inviteEnabled:true/);
 assert.match(server,/if \(kind==='invite'\) return true;/);
 assert.match(server,/inviteEnabled:true/);
 assert.match(server,/Boolean\(b\.bookingApprovedEnabled\), true, b\.bookingStatusEnabled !== false/);
 assert.match(server,/rental_invite_sms_only/);
});
