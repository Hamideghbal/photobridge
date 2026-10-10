const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const server=fs.readFileSync('dist/api/server.js','utf8');
const owner=fs.readFileSync('dist/api/equipment-rental-portal.html','utf8');
const customer=fs.readFileSync('dist/api/equipment-rental-book.html','utf8');
const migration=fs.readFileSync('migrations/176_equipment_customer_rental_stock_modes.sql','utf8');
const c=fs.readFileSync('dist/web/photobridge-r1095-customer-stock.js','utf8');
const o=fs.readFileSync('dist/web/photobridge-r1095-owner-stock.js','utf8');
test('both request modes exist, with flexible as database default',()=>{
 assert.match(migration,/customer_rental_stock_mode text NOT NULL DEFAULT 'flexible'/);
 assert.match(migration,/CHECK \(customer_rental_stock_mode IN \('flexible','strict'\)\)/);
 assert.match(server,/const customerStockMode=b\.customerStockMode===undefined/);
 assert.match(server,/customer_rental_stock_mode=\$30/);
 assert.match(server,/saleBirthdaySms,customerStockMode/);
 assert.match(o,/select name="customerStockMode"/);
});
test('strict pending requests acquire a durable shop-scoped stock hold, not an instant approval',()=>{
 assert.match(migration,/customer_stock_held boolean NOT NULL DEFAULT false/);
 assert.match(server,/stockHeld=deferredApproval&&shop\.customer_rental_stock_mode==='strict'&&!allowShortage/);
 assert.match(server,/if \(\(!deferredApproval\|\|stockHeld\) && !allowShortage && !availability\.available\)/);
 assert.match(server,/deposit_amount,notes,created_by,customer_stock_held/);
 assert.match(server,/initialStatus: 'pending_approval'/);
 assert.match(server,/b\.status='pending_approval' AND b\.customer_stock_held=true/);
 assert.match(server,/excludeBookingId: bookingId/);
});
test('shop directory tells the customer which selection policy applies',()=>{
 assert.match(server,/s\.rental_enabled,s\.sale_enabled,s\.customer_rental_stock_mode,s\.rental_reach/);
 assert.match(server,/customerStockMode:shop\.customer_rental_stock_mode\|\|'flexible'/);
 assert.match(c,/selectedShopRecord/);
 assert.match(c,/card\.querySelector\('input\.pick'\)/);
 assert.match(c,/qty\.max=String\(Math\.max\(1,free\)\)/);
 assert.match(c,/dated&&row&&blocked&&cb\.checked/,'temporary availability refresh must not erase selected items');
 assert.match(c,/async function checkFinal/);
 assert.match(c,/e\.stopImmediatePropagation\(\)/);
 assert.match(c,/\/api\/customer\/equipment-rental\/availability/);
});
test('store displays item-by-item shortage quantities on the incoming order card',()=>{
 assert.match(o,/\.pbR1095StockDetails\.bad/);
 assert.match(o,/کسری موجودی:/);
 assert.match(o,/کسری '\+number\(x\.shortage\)/);
 assert.match(o,/data\.bookings\.filter\(b=>b\.status==='pending_approval'\)/);
 assert.match(o,/excludeBookingId:id/);
 assert.match(o,/عدد، موجود /);
});
test('production HTML includes exactly one script of each role',()=>{
 for(const [html,path] of [[owner,'/photobridge-r1095-owner-stock.js?v=1095'],[customer,'/photobridge-r1095-customer-stock.js?v=1095']]){
  assert.equal(html.split(path).length-1,1,path);
 }
});
