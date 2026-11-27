const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const source=fs.readFileSync('dist/api/server.js','utf8');
// The R1467 Windows live/manual intake alias serves the same guarded handler.
// Test both its source form (before the production build) and its generated form
// (after R1467), without accepting an unrelated route or disabling any checks.
const primaryRoute="if (req.method === 'POST' && url.pathname === '/api/lab/delegated-orders')";
const liveRoute="if (req.method === 'POST' && ['/api/lab/delegated-orders','/api/lab/delegated-orders/download'].includes(url.pathname))";
const routeStart=source.indexOf(liveRoute)>=0?source.indexOf(liveRoute):source.indexOf(primaryRoute);
const routeEnd=source.indexOf('const delegatedFiles =',routeStart);
assert(routeStart>=0&&routeEnd>routeStart,'delegated-order request handler must be extracted forward from its own route (normal or R1467 live alias)');
assert(source.slice(routeStart,routeEnd).includes('PB1142 optional mobile-only customer'),'opening-debt guard must remain in the delegated handler');
const create=source.slice(routeStart,routeEnd);
for(const scenario of ['invitation','no-sms','replay','invalid-debt','existing-debt'])test(`mobile-only delegated customer: ${scenario}`,async()=>{
 const queries=[],ledger=[],sms=[],response=[];const customer='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
 const query=async(sql,args)=>{queries.push(sql);let rows=[];
  if(sql.includes('SELECT d.order_id')&&scenario==='replay')rows=[{order_id:'order',customer_id:customer,number:42}];
  else if(sql.includes('SELECT id FROM users'))rows=[{id:customer}];
  else if(sql.includes('INSERT INTO invitations'))rows=[{id:'invite',token:'secret'}];
  else if(sql.includes('INSERT INTO orders('))rows=[{id:'order',number:42,status:'uploading'}];
  else if(sql.includes("reference_type='lab_delegated_opening_debt'")&&scenario==='existing-debt')rows=[{id:'previous'}];
  else if(sql.includes('SELECT i.token'))rows=[{token:'secret',sms_status:'not_sent',target_mobile:'09120000001',sms_customer_notifications_allowed:true}];
  return {rows,rowCount:rows.length};
 };
 const c={query,release(){}};const pool={query,connect:async()=>c};
 const params={req:{method:'POST'},url:{pathname:'/api/lab/delegated-orders'},res:{},bodyJson:async()=>({clientOrderId:customer,mobile:'09120000001',initialDebt:scenario==='invalid-debt'?-1:50000,sendInvitation:scenario!=='no-sms',localOnly:true}),requireLocalIntakePrimary:async()=>true,normalizeMobile:x=>x,pool,labId:'lab',a:{userId:'actor'},requestDeviceId:'primary',crypto,passwordHash:x=>x,PUBLIC_APP_URL:'https://app.test',ensureFinanceAccounts:async()=>{},postBalancedFinanceTransaction:async(c,args)=>ledger.push(args),audit:async()=>{},sendSms:async args=>{sms.push(args);return{reference:'sms'};},sendJson:(res,status,body)=>response.push({status,body})};
 await Function(...Object.keys(params),`return (async()=>{${create}})()`)(...Object.values(params));
 if(scenario==='invalid-debt'){assert.equal(response[0].status,400);assert.equal(queries.length,0);return;}
 if(scenario==='existing-debt'){assert.equal(response[0].status,409);assert(queries.includes('ROLLBACK'));assert(!queries.some(x=>x.includes('INSERT INTO orders(')));assert.equal(ledger.length,0);return;}
 if(scenario==='replay'){assert.equal(response[0].body.replay,true);assert.equal(ledger.length,0);assert.equal(sms.length,0);return;}
 assert.equal(response[0].status,201);assert.equal(ledger.length,1);assert.equal(ledger[0].referenceId,customer);assert.equal(ledger[0].lines[0].debit,50000);assert.equal(ledger[0].lines[1].credit,50000);assert.equal(ledger[0].lines[0].customerId,customer);assert.equal(sms.length,scenario==='invitation'?1:0);assert(queries.includes('COMMIT'));
});
test('delegated file copies validate and use existing print-copy invoice rules',async()=>{
 const start=source.indexOf("if (req.method === 'POST' && delegatedFiles)"),end=source.indexOf('const delegatedLocalFile =',start),code=source.slice(start,end);
 assert(start>=0&&end>start,'delegated file handler not found');
 // Exercise the real asynchronous handler through the INSERT instead of
 // evaluating an obsolete synchronous slice between formatting anchors.
 for(const copies of [1,3,0,100,1.5]){
  const responses=[],inserts=[],id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const pool={query:async(sql,args)=>{
   if(sql.includes('FROM lab_delegated_order_intakes'))return {rowCount:1,rows:[{id:'order',mode:'print',customer_id:'customer'}]};
   if(sql.includes('INSERT INTO order_files')){inserts.push({sql,args});return {rowCount:1,rows:[]};}
   if(sql.includes('SELECT id,object_key,original_state FROM order_files'))return {rowCount:0,rows:[]};
   if(sql.includes('SELECT ui_preferences FROM labs'))return {rowCount:1,rows:[{ui_preferences:{}}]};
   throw Error('Unexpected SQL in delegated file fixture: '+sql.slice(0,220));
  }};
  const params={req:{method:'POST'},res:{},delegatedFiles:['','order'],bodyJson:async()=>({clientFileId:id,name:'photo.jpg',printCopies:copies,localOnly:true,printSizeId:'size',printType:'luster',bytes:100}),requireLocalIntakePrimary:async()=>true,uploadAvailable:true,pool,labId:'lab',safeFileName:x=>x,labCanUsePrintSize:async()=>true,MAX_UPLOAD_BYTES:100000,storageConfigured:false,sendJson:(_,status,body)=>{responses.push({status,body});return true;}};
  try{await Function(...Object.keys(params),'return (async()=>{'+code+'})()')(...Object.values(params));}
  catch(error){throw Error('Delegated handler fixture: '+error.message+'; validation excerpt: '+code.slice(code.indexOf('const printCopies'),code.indexOf('const relativePath')+200),{cause:error});}
  if(copies===1||copies===3){
   assert.equal(responses[0]?.status,201,JSON.stringify(responses));
   assert.equal(inserts.length,1);
   const insert=inserts[0],columns=insert.sql.match(/INSERT INTO order_files\s*\(([^)]+)\)/i)?.[1].split(',').map(s=>s.trim());
   assert(columns?.includes('print_copies')&&columns.includes('original_name'));
   assert.equal(insert.args[columns.indexOf('print_copies')],copies);
   assert.equal(insert.args[columns.indexOf('original_name')],copies===1?'photo.jpg':'photo = 3.jpg');
  }else{
   assert.equal(responses[0]?.status,400);
   assert.equal(responses[0]?.body?.error,'invalid_print_copies');
   assert.equal(inserts.length,0);
  }
 }
 assert(source.includes('current.quantity += Number(f.print_copies || 1)'));
});
