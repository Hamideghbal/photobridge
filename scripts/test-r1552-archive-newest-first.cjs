'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const read=path=>fs.readFileSync(path,'utf8');
const root='dist/web/',native=root+'lab-desktop-ui/';
test('archive API provides immutable order registration time for deterministic day sorting',()=>{
 const server=read('dist/api/server.js'),start=server.indexOf('async function archiveOrdersForLab('),end=server.indexOf('async function financeDocumentsForCustomer(',start);
 assert(start>=0&&end>start);
 const handler=server.slice(start,end);
 assert(handler.includes('o.created_at order_created_at'));
 assert(handler.includes('ORDER BY completed_at DESC'));
 assert(handler.includes('return q.rows.map'));
});
test('website and Windows Lab archive sort each selected day without mutating calendar groups',()=>{
 for(const base of [root,native]){
  const js=read(base+'assets/index-UIRefine-v655-r84.js');
  assert(js.includes('const ae=w?(B.get(w)||[]).slice().sort(pb1552ArchiveNewestFirst):[],'));
  assert(js.includes('/* PB1552 archive latest registered order first */'));
  assert(read(base+'index.html').includes('&archiveNewest=r1552'));
  const begin=js.indexOf('function pb1552ArchiveNewestFirst(');
  const body=js.slice(begin,js.indexOf('\n}',begin)+2);
  const cmp=new Function('return ('+body+')')();
  const day=[
   {order_id:'a',order_number:101,order_created_at:'2026-11-03T08:00:00Z',completed_at:'2026-11-03T23:00:00Z'},
   {order_id:'b',order_number:103,order_created_at:'2026-11-03T12:30:00Z',completed_at:'2026-11-03T14:00:00Z'},
   {order_id:'c',order_number:102,order_created_at:'2026-11-03T10:00:00Z',completed_at:'2026-11-03T18:00:00Z'}
  ];
  assert.deepEqual(day.slice().sort(cmp).map(x=>x.order_number),[103,102,101],base);
  assert.deepEqual(day.map(x=>x.order_number),[101,103,102],'sorting must not mutate the shared calendar group');
  assert.deepEqual([
   {order_number:20,completed_at:'2026-11-03T16:00:00Z'},
   {order_number:21,completed_at:'2026-11-03T09:00:00Z'}
  ].sort(cmp).map(x=>x.order_number),[21,20],'legacy rows use sequential order numbers');
  assert.deepEqual([
   {order_number:44,order_created_at:'2026-11-03T08:00:00Z'},
   {order_number:45,order_created_at:'2026-11-03T08:00:00Z'}
  ].sort(cmp).map(x=>x.order_number),[45,44],'same timestamp tie-breaks by newest order number');
 }
});
test('Windows Lab hot-update hashes match the actual JS and HTML bytes',()=>{
 const manifest=JSON.parse(read(native+'manifest.json'));
 const hash=buffer=>crypto.createHash('sha256').update(buffer).digest('hex');
 assert.equal(manifest.protocol,1);assert.equal(manifest.channel,'lab');
 for(const filename of ['index.html','assets/index-UIRefine-v655-r84.js']){
  const asset=manifest.files.find(f=>f.name===filename);
  assert(asset&&asset.url==='/lab-desktop-ui/'+filename);
  assert.equal(asset.sha256,hash(fs.readFileSync(native+filename)));
 }
 assert.equal(manifest.build,hash(JSON.stringify(manifest.files)));
});
