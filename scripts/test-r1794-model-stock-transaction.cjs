'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('scripts/r1794-stock-submit-handler.js.txt','utf8');
const run=new Function('c','submitCustomerOrder','a','labId','albumMode','normalizePrintCatalog','sendJson','res','return (async()=>{'+source+'return {ok:true};})()');
const input=(id,kind,copies)=>({print_size_id:'20x30',chassis:kind==='chassis',frame:kind==='frame',copies,addon_selection:{[kind]:{id}}});
function mock(rows,stocks,basePrice={}){
 const calls=[],updates=[];let rollbacks=0;
 const c={async query(sql,args){
  calls.push(sql);
  if(sql.includes('FROM order_files'))return {rows};
  if(sql.startsWith('SELECT chassis,chassis_stock,frame,frame_stock'))return {rows:[basePrice]};
  if(sql.startsWith('SELECT ui_preferences'))return {rows:[{ui_preferences:{printTariffCatalog:{stocks}}}]};
  if(sql.startsWith('UPDATE labs')){updates.push(JSON.parse(args[1]));return {rowCount:1}};
  if(sql==='ROLLBACK'){rollbacks++;return {rowCount:0}}
  return {rows:[],rowCount:1};
 }};
 return {c,calls,updates,get rollbacks(){return rollbacks}};
}
const params={submitCustomerOrder:['','00000000-0000-0000-0000-000000000001'],a:{userId:'u'},labId:'l',albumMode:false,normalizePrintCatalog:x=>({types:[],rates:{},walkinRates:{},stocks:JSON.parse(JSON.stringify(x?.stocks||{}))}),sendJson:(res,status,body)=>({status,...body}),res:{}};
async function execute(mocked){return run(mocked.c,params.submitCustomerOrder,params.a,params.labId,params.albumMode,params.normalizePrintCatalog,params.sendJson,params.res)}
test('R1794: custom frame stock is decremented by selected frame ID, never base frame',async()=>{
 const m=mock([input('wood-gold','frame',3)],{'20x30':{'wood-gold':7}},{frame:null,frame_stock:0});
 const result=await execute(m);
 assert.equal(result.ok,true);
 assert.equal(m.updates.length,1);
 assert.equal(m.updates[0].stocks['20x30']['wood-gold'],4);
 assert(!m.calls.some(x=>x.startsWith('SELECT chassis,chassis_stock,frame,frame_stock')),'should not check unrelated base model');
});
test('R1794: simultaneous custom models in one size each consume exact quantity',async()=>{
 const m=mock([input('board-a','chassis',2),input('board-b','chassis',1),input('frame-a','frame',4)],{'20x30':{'board-a':7,'board-b':5,'frame-a':8}});
 const result=await execute(m);
 assert(result.ok);
 assert.deepEqual(JSON.parse(JSON.stringify(m.updates[0].stocks['20x30'])),{'board-a':5,'board-b':4,'frame-a':4});
});
test('R1794: unavailable selected model rolls back instead of charging a different model',async()=>{
 const m=mock([input('frame-a','frame',3)],{'20x30':{'frame-a':1}});
 const result=await execute(m);
 assert.equal(result.status,409);
 assert.equal(result.error,'stock_unavailable');
 assert.equal(m.rollbacks,1);
 assert.equal(m.updates.length,0);
});
test('R1794: base stock still decrements with legacy tariffs',async()=>{
 const m=mock([input('chassis','chassis',2)],{}, {chassis:150000,chassis_stock:5});
 const result=await execute(m);
 assert(result.ok);
 assert(m.calls.some(x=>x.includes('chassis_stock=chassis_stock-$3')));
 assert.equal(m.updates.length,0);
});
test('R1794: real server checkout uses model-aware transaction',()=>{
 const server=fs.readFileSync('dist/api/server.js','utf8');
 const a=server.indexOf('const submitCustomerOrder ='),b=server.indexOf('const customerReceiptPresign =',a),scope=server.slice(a,b);
 assert(a>=0&&b>a);
 assert(scope.includes('const baseRequirements=new Map(),modelRequirements=new Map();'));
 assert(scope.includes('const modelId=String(saved[kind]?.id||kind);'));
 assert(scope.includes("SELECT ui_preferences FROM labs WHERE id=$1 FOR UPDATE"));
 assert(scope.includes("catalog.stocks[req.size][req.id]=Number(stock)-req.count"));
 assert(!scope.includes('chassis_qty'));
});
