const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),server=fs.readFileSync('dist/api/server.js','utf8'),helper=fs.readFileSync('scripts/r1431-receipt-marks.js','utf8'),route=fs.readFileSync('scripts/r1431-receipt-route.js','utf8');
test('invoice display includes only charges; receipts include discounts without altering source amounts',()=>{
 const rows=[{id:'i',customer_id:'a',document_type:'invoice',total:100,issued_at:'2026-01-01'},{id:'d',customer_id:'a',document_type:'discount',total:-20,issued_at:'2026-01-02',external_accounting_recorded:true},{id:'c',document_type:'correction',total:5},{id:'n',document_type:'correction',total:-4}];
 const a=ui.indexOf('const Ve=r.filter('),b=ui.indexOf(',he=',a);
 const shown=vm.runInNewContext(ui.slice(a,b).replace('const Ve=',''),{r:rows,t:'lab',pb1427InvoiceCustomer:'',l:'',_pbInvAppliedFrom:'',_pbInvAppliedTo:'',$s:v=>v});assert.deepEqual(Array.from(shown,r=>r.id),['i','c','n']);
 const start=ui.indexOf('function PB1431ReceiptRows('),fn=ui.slice(start).split('\n')[0];const context={};vm.createContext(context);vm.runInContext(fn,context);const payments=[{id:'p',amount:40,paid_at:'2026-01-03'}];const combined=context.PB1431ReceiptRows(payments,rows);assert.equal(combined.length,2);assert.equal(combined[1].amount,20);assert.equal(combined[1].pb1431ReceiptKind,'discount');assert.equal(combined[1].external_accounting_recorded,true);assert.equal(rows[1].total,-20);assert.equal(payments.length,1);
});
test('receipt marks persist independently by lab and document kind; no ledger amounts are written',async()=>{
 const marks=new Map(),queries=[];const db={query:async(sql,params)=>{queries.push(sql);if(sql.startsWith('INSERT')){const [lab,kind,id,recorded]=params;marks.set(lab+kind+id,{document_id:id,recorded,recorded_at:recorded?'now':null});return{rows:[{id,external_accounting_recorded:recorded}]}}const [lab,kind,ids]=params;return{rows:ids.map(id=>marks.get(lab+kind+id)).filter(Boolean)}}};
 const ctx={pool:db,ensureExternalAccountingMarksSchema:async()=>{}};vm.createContext(ctx);vm.runInContext(helper,ctx);
 await ctx.pb1431SetReceiptMark('lab-a','payment','same',true,'actor');let rows=await ctx.pb1431AttachReceiptMarks(db,'lab-a',[{id:'same',amount:10}],'payment');assert.equal(rows[0].external_accounting_recorded,true);assert.equal(rows[0].amount,10);
 assert.equal((await ctx.pb1431AttachReceiptMarks(db,'lab-b',[{id:'same'}],'payment'))[0].external_accounting_recorded,false);
 assert.equal((await ctx.pb1431AttachReceiptMarks(db,'lab-a',[{id:'same',document_type:'discount'}],'discount'))[0].external_accounting_recorded,false);
 await ctx.pb1431SetReceiptMark('lab-a','payment','same',false,'actor');assert.equal((await ctx.pb1431AttachReceiptMarks(db,'lab-a',[{id:'same'}],'payment'))[0].external_accounting_recorded,false);
 await assert.rejects(()=>ctx.pb1431SetReceiptMark('a','invoice','id',true,'actor'),/invalid_receipt_kind/);assert(queries.every(sql=>sql.includes('external_accounting_marks')));
});
test('receipt route verifies lab ownership and boolean state before saving a mark',async()=>{
 async function run(owned,recorded,kind='payment'){const calls=[],responses=[];const ctx={req:{method:'PATCH'},res:{},url:{pathname:'/api/lab/finance/receipt-marks/'+kind+'/11111111-1111-1111-1111-111111111111'},bodyJson:async()=>({recorded,labId:'untrusted'}),labId:'trusted-lab',a:{userId:'actor'},pool:{query:async(sql,params)=>{calls.push(['owned',sql,params]);return{rowCount:owned?1:0}}},pb1431SetReceiptMark:async(...args)=>{calls.push(['save',...args]);return{external_accounting_recorded:recorded}},audit:async()=>{},sendJson:(_,status,body)=>responses.push({status,body})};await vm.runInNewContext('(async()=>{'+route+'})()',ctx);return{calls,responses}}
 let r=await run(false,true);assert.equal(r.responses[0].status,404);assert.equal(r.calls.length,1);assert.deepEqual(Array.from(r.calls[0][2]),['trusted-lab','11111111-1111-1111-1111-111111111111']);
 r=await run(true,'true');assert.equal(r.responses[0].status,400);assert.equal(r.calls.length,0);
 r=await run(true,true,'discount');assert.equal(r.responses[0].status,200);assert(r.calls[0][1].includes("kind='discount'"));assert.equal(r.calls[1][1],'trusted-lab');assert.equal(r.calls[1][2],'discount');
 assert(server.includes("payments: await pb1431AttachReceiptMarks(pool,labId,q.rows,'payment')"));assert(server.includes("await pb1431AttachReceiptMarks(c,labId,await externalAccountingAttachMarks"));
});
test('statement exposes two fetch-and-display actions and print without PDF for lab',()=>{
 const a=ui.indexOf('e.jsxs("section",{className:"card statementToolbar"'),b=ui.indexOf(',_&&e.jsxs(e.Fragment',a),calls=[],jsx=(type,props)=>({type,...props});const ctx={e:{jsx,jsxs:jsx},t:'lab',z:'a',E:[],pb1487PhonePicker:()=>false,wn:'Picker',q(){},A(){},Re(){},_e:'',je:'',Pe(){},d(){},Hs:'Date',D:false,b:()=>calls.push('fetch'),_pb1177StmtMode:'summary',_setPb1177StmtMode:v=>calls.push(v),_:{rows:[]},r:[],Jy:()=>calls.push('print-summary'),window:{pb1176Finance:{detailed:()=>calls.push('print-details')}},tt:()=>calls.push('pdf')};
 const tree=vm.runInNewContext(ui.slice(a,b),ctx),filters=tree.children[0].children,actions=tree.children[1].children;assert.equal(filters[3],false);assert.equal(actions[0].children,'نمایش خلاصه');assert.equal(actions[1].children,'نمایش با جزئیات');actions[0].onClick();actions[1].onClick();assert.deepEqual(calls,['summary','fetch','detailed','fetch']);assert.equal(actions[3],false);actions[2].onClick();assert.equal(calls.at(-1),'print-summary');const detailed=vm.runInNewContext(ui.slice(a,b),{...ctx,_pb1177StmtMode:'detailed'});detailed.children[1].children[2].onClick();assert.equal(calls.at(-1),'print-details');
});
test('receipt mark UI saves the chosen kind and preserves state on failed requests',async()=>{
 const a=ui.indexOf('_pbSaveAccounting=async()=>'),b=ui.indexOf(';return e.jsxs("section",{className:"financeWorkspace',a);assert(a>0&&b>a);
 const expression=ui.slice(a,b).replace('_pbSaveAccounting=','');
 for(const kind of ['payment','discount']){const calls=[],row={id:'id',amount:100,external_accounting_recorded:false,_pb1431ReceiptKind:kind};const ctx={_pbAccountingMark:row,t:'lab',H:v=>calls.push(['busy',v]),Me:async(url,options)=>{calls.push(['request',url,JSON.parse(options.body)]);return{receipt:{id:'id',external_accounting_recorded:true}}},S:update=>calls.push(['payments',update([{id:'id',amount:100}])[0]]),o:update=>calls.push(['discounts',update([{id:'id',total:-100}])[0]]),_setPbAccountingMark:v=>calls.push(['modal',v]),alert:()=>calls.push(['error'])};
 await vm.runInNewContext(expression,ctx)();assert(calls.find(c=>c[0]==='request')[1].includes('/'+kind+'/id'));const updated=calls.find(c=>c[0]===(kind==='payment'?'payments':'discounts'))[1];assert.equal(updated.external_accounting_recorded,true);assert.equal(kind==='payment'?updated.amount:updated.total,kind==='payment'?100:-100);assert(calls.find(c=>c[0]==='modal'&&c[1]===null));
 calls.length=0;await vm.runInNewContext(expression,{...ctx,Me:async()=>{throw Error('network')}})();assert(calls.find(c=>c[0]==='error'));assert(!calls.find(c=>['payments','discounts','modal'].includes(c[0])));
 }
});

test('finance document build is repeatable, syntax-valid and cache-versioned',()=>{
 const paths=['dist/web/assets/index-UIRefine-v655-r84.js','dist/api/server.js','dist/web/photobridge-r1363-lab-queue.js','dist/web/photobridge-r1423-finance-bars.css','dist/web/index.html'],before=paths.map(p=>fs.readFileSync(p,'utf8'));
 execFileSync(process.execPath,['scripts/enable-r1431-finance-documents.mjs']);paths.forEach((p,i)=>assert.equal(fs.readFileSync(p,'utf8'),before[i]));paths.slice(0,3).forEach(p=>execFileSync(process.execPath,['--check',p]));
 assert(before[4].includes('financeDocuments=r1431'));assert(before[4].includes('photobridge-r1423-finance-bars.css?v=r1431'));
});
