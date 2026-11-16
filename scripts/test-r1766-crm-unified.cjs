const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('dist/web/customer-crm.html','utf8');
const js=fs.readFileSync('dist/web/customer-crm-ui.js','utf8');
test('CRM unified editor removes redundant entry points',()=>{
 assert.doesNotMatch(html,/id="marketing-consent"|id="shoot-name"|id="event-form"|data-view="invoices"/);
 assert.match(html,/id="customer-details"/);
 assert.match(html,/id="session-form"/);assert.match(html,/id="invoice-form"/);
 new vm.Script(js);
});
test('hidden consent UI preserves all recorded permissions and notes',()=>{
 const a=js.indexOf('function buildCustomerPayload('),b=js.indexOf('function renderCustomerSessions(',a);
 const build=vm.runInNewContext(js.slice(a,b)+';buildCustomerPayload');
 for(const permission of ['unknown','opted_in','opted_out']){
 const old={marketingPermission:permission,permissionSource:'سند قبلی',notes:'یادداشت'};
 const result=build(' ندا ','09123456789',old);
 assert.equal(result.marketingPermission,permission);assert.equal(result.permissionSource,old.permissionSource);assert.equal(result.notes,old.notes);
 }
 assert.equal(build('ندا','09123456789').marketingPermission,'unknown');
});
test('Persian calendar crosses Nowruz and Esfand correctly',()=>{
 const a=js.indexOf('function persianParts('),b=js.indexOf('let calendarMonth',a);
 const parts=vm.runInNewContext(js.slice(a,b)+';persianParts');
 assert.deepEqual(JSON.parse(JSON.stringify(parts(new Date('2026-03-21T12:00:00Z')))),{year:1405,month:1,day:1});
 assert.equal(parts(new Date('2026-03-20T12:00:00Z')).month,12);
 assert.doesNotMatch(html,/type="date"/);
});
