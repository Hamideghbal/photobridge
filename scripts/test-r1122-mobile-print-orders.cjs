const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('dist/web/index.html','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1122-mobile-print-orders.css','utf8');
const js=fs.readFileSync('dist/web/photobridge-r1122-mobile-print-orders.js','utf8');

test('photographer bottom navigation stays a single six-button row without changing lab navigation',()=>{
  assert.match(css,/photographerMobileUtilityRail\.photographerBottomAppNav:not\(\.labBottomAppNav\)/);
  assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)!important/);
  assert.match(css,/grid-row:1!important/);
});
test('mobile print order statuses remain reachable through the existing React filters',()=>{
  assert.match(js,/photographerContextStatusesMobile\s*>\s*button/);
  assert.match(js,/current\?\.click\(\)/);
  assert.match(js,/\.ordersWorkspace\.liveCustomerOrders/);
  assert.match(js,/source\.length!==4/);
  assert.doesNotMatch(js,/\/api\/customer\/orders/);
});
test('R1122 assets are included in the served photographer page',()=>{
  assert.match(html,/photobridge-r1122-mobile-print-orders\.css\?v=r1137/);
  assert.match(html,/photobridge-r1122-mobile-print-orders\.js\?v=r1122/);
});

