const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
let report,actions;
test.before(async()=>{report=await import('./r1861-error-dashboard-data.mjs');actions=await import('./r1863-error-actions.mjs')});
const day='2026-11-15',lab='11111111-1111-4111-8111-111111111111',studio='22222222-2222-4222-8222-222222222222';
test('Gregorian day is Tehran local and rejects invalid or malicious dates',()=>{
 assert.equal(report.reportDate(day),day);
 assert.equal(report.reportDate('',new Date('2026-11-15T21:00:00.000Z')),'2026-11-16');
 for(const invalid of ['2026-02-30','2026-13-01','2026-1-2','2026-11-15 OR TRUE','999999-11-15'])assert.throws(()=>report.reportDate(invalid),/invalid_report_date/);
 const result=report.normalizeDailyFilters({day,labId:lab,photographerId:studio,eventOffset:'200',incidentOffset:'0',successOffset:'400'});
 assert.deepEqual({labId:result.labId,photographerId:result.photographerId,eventOffset:result.eventOffset,incidentOffset:result.incidentOffset,successOffset:result.successOffset,pageSize:result.pageSize},{labId:lab,photographerId:studio,eventOffset:200,incidentOffset:0,successOffset:400,pageSize:200});
 for(const input of [{labId:'oops'},{photographerId:'not-valid'},{eventOffset:'-10'},{successOffset:'9999999'},{incidentOffset:'1;DROP TABLE orders'}])assert.throws(()=>report.normalizeDailyFilters(input),/invalid_/);
});
test('read-only SQL queries bind dates, isolate labs/studios, and never return raw filenames',()=>{
 for(const sql of [report.dailyStudiosSql,report.dailyEventsSql,report.dailyIncidentsSql,report.dailySuccessSummarySql,report.dailySuccessSql]){
  assert.match(sql,/Asia\/Tehran/);
  assert.match(sql,/\$1::date/);
  assert.doesNotMatch(sql,/(?:original_name|object_key|signed_url|secret_key)/i);
  assert.doesNotMatch(sql,/(?:DELETE FROM|UPDATE orders|INSERT INTO orders)/i);
 }
 assert.match(report.dailyEventsSql,/s\.lab_id::text=\$2/);
 assert.match(report.dailyIncidentsSql,/i\.payload/);
 assert.match(report.dailySuccessSql,/m\.mode='print'/);
 assert.match(report.dailySuccessSql,/m\.order_id DESC/);
 assert.match(report.dailySuccessSummarySql,/historical_snapshot/);
 assert.match(report.dailySuccessSql,/m\.original_bytes/);
});
test('daily report includes successful sends with bytes plus errors without mutating orders',async()=>{
 const rowsByKind={
  errors:[{lab_id:lab,lab_name:'لاب یک',photographer_id:studio,photographer_name:'عکاسی اول',failures:3}],
  events:[{event_id:'event',received_at:'2026-11-15T20:00:00Z',total_rows:3}],
  incidents:[{id:'PB-TEST',payload:{code:'storage_error'},total_rows:1}],
  successesSummary:[{lab_id:lab,photographer_id:studio,successful_orders:2,successful_files:'13',successful_bytes:'90000000',historical_orders:0}],
  successes:[{order_id:'id',file_count:'8',original_bytes:'56000000',order_number:101,order_total:75000,total_rows:2}]
 };
 const calls=[];
 const pool={query:async(sql,args)=>{
  calls.push({sql,args});
  const key=sql===report.dailyStudiosSql?'errors':sql===report.dailyEventsSql?'events':sql===report.dailyIncidentsSql?'incidents':sql===report.dailySuccessSummarySql?'successesSummary':sql===report.dailySuccessSql?'successes':sql===actions.dailyBatchesSql?'batches':null;
  assert(key,'unknown SQL');return {rows:rowsByKind[key]||[]};
 }};
 const result=await report.getDailyErrorReport(pool,{day,labId:lab,photographerId:studio,eventOffset:'0',incidentOffset:'0',successOffset:'0'});
 assert.equal(calls.length,6);
 for(const c of calls)assert.equal(c.args[0],day);
 assert.deepEqual(calls[4].args,[day,lab,studio,200,0]);
 assert.equal(result.summary[0].failures,3);
 assert.equal(result.successSummary[0].successful_orders,2);
 assert.equal(result.successes[0].original_bytes,'56000000');
 assert.equal(result.successesTotal,2);
 assert.equal(result.eventsTotal,3);
 assert.equal(result.incidentsTotal,1);
 assert.equal(result.timezone,'Asia/Tehran');
});
test('admin viewer has responsive details, success and error tables and syntax-safe embedded JS',()=>{
 const html=fs.readFileSync(path.resolve(__dirname,'r1861-error-admin.html'),'utf8');
 for(const token of ['id="day"','id="lab"','id="studio"','id="groups"','id="successes"','id="events"','id="incidents"','id="metricSuccesses"','id="moreSuccesses"','files','Asia/Tehran'])assert(html.includes(token),token);
 const match=html.match(/<script>([\s\S]*?)<\/script>/);assert(match);
 new vm.Script(match[1],{filename:'r1861-error-admin.html'});
 assert.doesNotMatch(html,/innerHTML\s*=\s*[^;]*\b(?:row|entry|payload|e\.)/);
 const installer=fs.readFileSync(path.resolve(__dirname,'enable-r1861-error-monitor.mjs'),'utf8');
 assert.match(installer,/requireRole\(actor,'platform_admin'\)/);
 assert.match(installer,/cache-control/);
});
