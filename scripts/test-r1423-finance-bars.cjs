const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
test('invoice filters share one toolbar, omit lab title, and keep range/today/all callbacks',()=>{
 const a=ui.indexOf('e.jsxs("div",{className:t==="lab"?"pb1423InvoiceToolbar"'),b=ui.indexOf(',Ve.length?',a),calls=[],jsx=(type,props)=>({type,...props});
 assert.ok(a>0&&b>a);
 const tree=vm.runInNewContext(ui.slice(a,b),{t:'lab',V:String,Ve:[],e:{jsx,jsxs:jsx},pb1487PhonePicker:()=>false,pb1427InvoiceCustomer:'',pb1427SetInvoiceCustomer(){},wn:'Picker',Hs:'Date',l:'',c(){},_pbInvFrom:'2026-01-01',_pbInvTo:'2026-01-31',_pbInvAppliedFrom:'',_pbInvAppliedTo:'',_setPbInvFrom:v=>calls.push(['from',v]),_setPbInvTo:v=>calls.push(['to',v]),_setPbInvAppliedFrom:v=>calls.push(['applyFrom',v]),_setPbInvAppliedTo:v=>calls.push(['applyTo',v]),Ie:v=>calls.push(['page',v]),$s:()=> '2026-02-01',Me(){},E:[],ce(){}});
 assert.equal(tree.className,'pb1423InvoiceToolbar');assert.equal(tree.children[0].children[0],false);
 const range=tree.children[1].children;
 assert.equal(range[0]['aria-label'],'از تاریخ');assert.equal(range[1]['aria-label'],'تا تاریخ');
 range[2].onClick();assert.equal(JSON.stringify(calls),JSON.stringify([['applyFrom','2026-01-01'],['applyTo','2026-01-31'],['page',1]]));
 calls.length=0;range[3].onClick();assert.equal(calls[0][1],'2026-02-01');
 calls.length=0;range[4].onClick();assert.equal(JSON.stringify(calls),JSON.stringify([['from',''],['to',''],['applyFrom',''],['applyTo',''],['page',1]]));
});
test('shared bar rules cover all three surfaces and retain mobile layout',()=>{
 const css=fs.readFileSync('dist/web/photobridge-r1423-finance-bars.css','utf8');
 assert.ok(css.includes(':is(.pb1176PaymentActions,.customerStatementWorkspace>.statementToolbar,.pb1423InvoiceToolbar)'));
 assert.ok(css.includes('height:52px!important;min-height:52px!important;max-height:52px!important'));
 assert.ok(css.includes('::-webkit-scrollbar-track{margin-top:52px!important}'));
 assert.ok(css.includes('@media(min-width:821px) and (hover:hover) and (pointer:fine)'));
});
test('invoice bar transform is idempotent and produces valid JavaScript',()=>{
 const paths=['dist/web/assets/index-UIRefine-v655-r84.js','dist/web/index.html'],before=paths.map(p=>fs.readFileSync(p,'utf8'));
 execFileSync(process.execPath,['scripts/enable-r1423-finance-bars.mjs']);paths.forEach((p,i)=>assert.equal(fs.readFileSync(p,'utf8'),before[i]));
 execFileSync(process.execPath,['--check',paths[0]]);
});
