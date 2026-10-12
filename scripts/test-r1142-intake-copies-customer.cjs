const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const source=fs.readFileSync('dist/api/server.js','utf8');
const create=source.slice(source.indexOf("if (req.method === 'POST' && url.pathname === '/api/lab/delegated-orders')"),source.indexOf('const delegatedFiles ='));
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
test('delegated file copies validate and use existing print-copy invoice rules',()=>{
 const start=source.indexOf("if (req.method === 'POST' && delegatedFiles)"),end=source.indexOf('const delegatedLocalFile =',start),code=source.slice(start,end);
 const validation=code.slice(code.indexOf('const printCopies ='),code.indexOf('const relativePath ='));
 for(const copies of [1,3,0,100,1.5]){let response;const name=Function('b','albumMode','safeFileName','sendJson','res',validation+'return {name,printCopies};')({name:'photo.jpg',printCopies:copies},false,x=>x,(_,status,body)=>response={status,body},{});if(copies===1||copies===3){assert.equal(name.printCopies,copies);assert.equal(name.name,copies===1?'photo.jpg':'photo = 3.jpg');}else assert.equal(response.status,400);}
 assert.match(code,/crop_handling,print_copies,original_state/);assert.match(code,/albumMode \? 1 : printCopies/);
 assert(source.includes('current.quantity += Number(f.print_copies || 1)'));
});
