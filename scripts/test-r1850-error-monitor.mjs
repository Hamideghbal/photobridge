import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { cleanIncident, classifyIncident, createErrorMonitor } from './r1850-error-monitor.mjs';
const tick=()=>new Promise(r=>setTimeout(r,10));
async function setup(t, opts={}){const directory=await mkdtemp(path.join(os.tmpdir(),'pb1850-'));const monitor=createErrorMonitor({directory,alert:async()=>{},log:{error(){}},...opts});t.after(async()=>{monitor.close();await monitor.flush();await rm(directory,{recursive:true,force:true});});return {monitor,directory};}
test('redacts signed URLs, bodies, stacks, credentials and arbitrary fields',()=>{const result=cleanIncident({route:'https://storage.test/key?X-Amz-Credential=SECRET',message:'password',body:'secret',stack:'secret',code:'SlowDown',status:503});assert.equal(result.route,'/key');assert.doesNotMatch(JSON.stringify(result),/SECRET|password|secret|Credential/);assert.equal(result.status,503)});
test('records original provider code and correlates support references',async t=>{const {monitor,directory}=await setup(t);const id=await monitor.record({source:'upload',stage:'upload',status:503,code:'SlowDown',providerRequestId:'REQ123',reference:'PB-AB12'});await tick();await monitor.flush();assert.match(id,/^PB-[A-F0-9]{16}$/);const [row]=await monitor.list();assert.equal(row.providerRequestId,'REQ123');assert.deepEqual(row.references,['PB-AB12']);assert.match(await readFile(path.join(directory,'incidents.jsonl'),'utf8'),/SlowDown/)});
test('100 identical failures aggregate into one SMS without blocking recording',async t=>{let sends=0;const {monitor}=await setup(t,{alert:async()=>{sends++;await tick();}});await Promise.all(Array.from({length:100},()=>monitor.record({source:'upload',code:'SlowDown',status:503})));await tick();assert.equal(sends,1);assert.equal((await monitor.list())[0].count,100)});
test('SMS rejection is visible, recording still succeeds',async t=>{const {monitor}=await setup(t,{alert:async()=>{throw Error('provider_down')}});await monitor.record({code:'failure'});await tick();assert.equal((await monitor.list())[0].alertState,'failed');assert.equal((await monitor.list())[0].alertError,'provider_down')});
test('hourly SMS budget and per reporter request budget are bounded',async t=>{let now=1000000,sends=0;const {monitor}=await setup(t,{now:()=>now,alert:async()=>{sends++}});for(let i=0;i<12;i++){await monitor.record({code:'failure_'+i});await tick()}assert.equal(sends,6);for(let i=0;i<20;i++)assert.equal(monitor.allow('actor'),true);assert.equal(monitor.allow('actor'),false);now+=60001;assert.equal(monitor.allow('actor'),true)});
test('restart retains incident history and deduplication cooldown',async t=>{let sends=0;const {monitor,directory}=await setup(t,{alert:async()=>{sends++}});await monitor.record({code:'persistent'});await tick();await monitor.flush();monitor.close();const next=createErrorMonitor({directory,alert:async()=>{sends++},log:{error(){}}});t.after(()=>next.close());await next.record({code:'persistent'});await tick();assert.equal(sends,1);assert.equal((await next.list())[0].count,2);await next.flush()});

test('classifies evidenced database, storage and network failures without guessing internet speed',()=>{
assert.equal(classifyIncident({code:'57P03'}).channel,'database');
assert.equal(classifyIncident({code:'ENOTFOUND',dependency:'database'}).channel,'database');
assert.equal(classifyIncident({code:'ENOTFOUND'}).channel,'application');
assert.equal(classifyIncident({source:'upload',status:503}).channel,'object_storage');
assert.equal(classifyIncident({source:'upload',code:'upload_network_error'}).channel,'network_path');
assert.equal(classifyIncident({code:'QuotaExceeded'}).channel,'storage_capacity');
});
test('server and browser report of the same request do not send duplicate alerts',async t=>{let sends=0;const {monitor}=await setup(t,{alert:async()=>{sends++}});await monitor.record({source:'server',code:'57P03',status:500,reference:'PB-123'});await tick();await monitor.record({source:'api',code:'http_500',status:500,reference:'PB-123'});await tick();assert.equal(sends,1);assert.equal((await monitor.list()).length,1);assert.equal((await monitor.list())[0].count,1);});

test('database outage keeps local incident and retries its durable mirror later',async t=>{let fail=true,copies=[];const {monitor}=await setup(t,{persistExternal:async row=>{if(fail)throw Object.assign(Error('db_down'),{code:'57P03'});copies.push(row)}});await monitor.record({source:'server',code:'57P03'});await monitor.sync();assert.equal(copies.length,0);assert.equal((await monitor.list()).length,1);fail=false;await monitor.sync();assert.equal(copies.length,1);assert.equal(copies[0].code,'57P03');});

test('recreates a missing monitor directory before persisting a new report', async t=>{
  const {monitor,directory}=await setup(t);
  await monitor.list();
  await rm(directory,{recursive:true,force:true});
  await monitor.record({source:'server',code:'directory_restored'});
  await monitor.flush();
  assert.match(await readFile(path.join(directory,'incidents.jsonl'),'utf8'),/directory_restored/);
});

test('retains unsaved reports after write failure and persists them on retry', async t=>{
  const failures=[];
  const {monitor,directory}=await setup(t,{log:{error:(...args)=>failures.push(args)}});
  await monitor.list();
  await rm(directory,{recursive:true,force:true});
  await writeFile(directory,'temporary-blocker');
  await monitor.record({source:'server',code:'first_unwritten'});
  await monitor.flush();
  assert(failures.some(row=>row[0]==='[error-monitor] persistence failed'));
  await rm(directory,{force:true});
  await mkdir(directory,{recursive:true});
  await monitor.record({source:'server',code:'second_written'});
  await monitor.flush();
  const saved=(await readFile(path.join(directory,'incidents.jsonl'),'utf8')).split('\n').filter(Boolean).map(JSON.parse);
  assert(saved.some(row=>row.code==='first_unwritten'));
  assert(saved.some(row=>row.code==='second_written'));
});
