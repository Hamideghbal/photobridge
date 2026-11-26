'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
test('invoice navigation uses independent local snapshot and live list, no finance-wide refresh',()=>{
 const host=read('local-business-host.cjs'),a=host.indexOf("['snapshot','live'].includes(url.searchParams.get('pbNativeInvoiceView'))"),b=host.indexOf("['dashboard','customers'].includes",a),part=host.slice(a,b);
 assert(a>=0&&b>a);assert(part.includes('engine.read(url.pathname)'));assert(part.includes('request(url.pathname'));assert(!part.includes('refreshFinance('));assert(part.includes('commitRead'));
 const renderer=read('finance-dashboard-160.cjs');assert(renderer.includes('pbNativeInvoiceView='));
 assert(!renderer.includes('pb160Photographers'));assert(renderer.includes('pb161ShowStatement'));
});
test('statement shortcuts pass explicit date overrides and guard out-of-order requests',()=>{
 const s=read('finance-dashboard-160.cjs');
 assert(s.includes('29*864e5'));assert(s.includes('pb161From&&Et.set("from",$s(pb161From))'));assert(s.includes('pb161StatementSeq.current!==pb161Seq'));
 assert(s.includes('نمایش کامل حساب معین'));assert(s.includes('نمایش ماه آخر'));assert(s.includes('aria-pressed":!_pbInvAppliedFrom&&!_pbInvAppliedTo'));
});

test('PB164 statement retains month and all; Today is absent from statement only',()=>{
 const code=read('finance-dashboard-160.cjs'),mod={exports:{}};new Function('module',code+'\nmodule.exports.state=state;')(mod);
 const state=mod.exports.state,start=state.indexOf('pb161StatementRange='),end=state.indexOf(',pb161ShowStatement=',start);
 const date=value=>{const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value).map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day;};
 const range=new Function('$s','return ('+state.slice(start+'pb161StatementRange='.length,end)+')')(date);
 assert.deepEqual(range('all'),{from:'',to:''});assert.notEqual(range('month').from,range('month').to);
 assert(!code.includes('pb161ShowStatement("today")'));assert(code.includes('!statement&&button("today","امروز",isToday,onToday)'));
 assert(code.includes('نمایش ماه آخر'));assert(code.includes('نمایش کامل حساب معین'));
 const css=read('native-queue.css');assert(css.includes('flex-flow:row wrap!important'));assert(css.includes('position:static!important'));assert(css.includes('data-pb2060-range="today"]){display:none!important'));
});

test('PB165 index and pagination preserve original first match and full list',()=>{
 const {pb2063FirstIndex,pb2063TablePage}=require('../native-performance-165.cjs');
 const rows=Array.from({length:10001},(_,i)=>({id:i,name:'studio '+i,hash:String(i%10)}));
 assert.equal(pb2063FirstIndex(rows,'hash').get('1'),rows[1]);
 assert.equal(pb2063TablePage(rows,'studio 10000',1).rows[0],rows[10000]);
 assert.deepEqual(Array.from({length:201},(_,i)=>pb2063TablePage(rows,'',i+1).rows).flat(),rows);
 assert(read('finance-dashboard-160.cjs').includes('pb165ExtraTimes'));
});
