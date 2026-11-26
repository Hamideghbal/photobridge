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

test('PB163 today passes exactly one Tehran calendar day, legacy has one today and shared keeps its own',()=>{
 const code=read('finance-dashboard-160.cjs');
 const module={exports:{}};new Function('module',code+'\nmodule.exports.state=state;')(module);
 const state=module.exports.state;
 const start=state.indexOf('pb161StatementRange='),end=state.indexOf(',pb161ShowStatement=',start);
 const date=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).format(value);
 const iso=value=>{const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(value);const p=Object.fromEntries(parts.map(x=>[x.type,x.value]));return p.year+'-'+p.month+'-'+p.day;};
 const range=new Function('$s','return ('+state.slice(start+'pb161StatementRange='.length,end)+')')(iso);
 const today=range('today');assert.equal(today.from,today.to);assert.equal(iso(new Date(today.from)),iso(new Date()));assert.deepEqual(range('all'),{from:'',to:''});assert.notEqual(range('month').from,range('month').to);
 assert(code.includes("filter.includes('pb2060Toolbar()')"));assert(code.includes('pb163-statement-today'));
 const css=read('native-queue.css');assert(css.includes('PB163:'));assert(css.includes('flex-flow:row wrap!important'));assert(css.includes('position:static!important'));assert(css.includes('data-pb2060-range="today"'));
});
