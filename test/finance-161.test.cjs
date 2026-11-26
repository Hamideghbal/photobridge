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
