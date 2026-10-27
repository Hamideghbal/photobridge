const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const manual=fs.readFileSync('dist/web/photobridge-r1176-lab-finance.js','utf8');
const header=fs.readFileSync('dist/web/photobridge-r1372-third-header.js','utf8');
test('statement sorts before paging without mutating rows or balances; ties reverse consistently',()=>{
 const src=bundle.match(/function PB1418SortStatementRows\(rows,direction\)\{[^\n]*\}/)[0],sort=vm.runInNewContext('('+src+')');
 const rows=[{id:1,txn_date:'2026-01-01',balance:120},{id:2,txn_date:'2026-02-01',balance:80},{id:3,txn_date:'2026-02-01',balance:65}];
 const before=JSON.stringify(rows);
 assert.equal(JSON.stringify(sort(rows,'desc').map(r=>r.id)),JSON.stringify([3,2,1]));
 assert.equal(JSON.stringify(sort(rows,'asc').map(r=>r.id)),JSON.stringify([1,2,3]));
 assert.equal(sort(rows,'desc')[0],rows[2]);assert.equal(JSON.stringify(rows),before);
 assert.ok(bundle.includes('pb1418SetDateOrder]=x.useState("desc")'));
 assert.ok(bundle.includes('pb1418SetDateOrder(v=>v==="desc"?"asc":"desc");Re(1)'));
 assert.ok(bundle.includes('t==="lab"&&pb1418DateOrder==="desc"&&Y===dt&&Number(_.opening)!==0'));
 assert.ok(bundle.includes('(t!=="lab"||pb1418DateOrder==="asc")&&Y===1&&Number(_.opening)!==0'));
});
test('typing unit price formats Persian, Arabic and Latin amounts while preserving numeric value and caret',()=>{
 const digitSrc=manual.match(/const digits=v=>[^\n]+/)[0];
 const fnSrc=manual.match(/function PB1418FormatMoneyInput\(input\)\{[^\n]*\}/)[0];
 const run=vm.runInNewContext('(()=>{'+digitSrc+';return {format:'+fnSrc+',digits}})()');
 for(const value of ['1234567','۱۲۳۴۵۶۷','١٢٣٤٥٦٧','۱٬۲۳۴٬۵۶۷']){
 const input={value,selectionStart:value.length,setSelectionRange(a,b){this.caret=a;assert.equal(a,b)}};
 run.format(input);assert.equal(input.value,'۱٬۲۳۴٬۵۶۷');assert.equal(Number(run.digits(input.value)),1234567);assert.equal(input.caret,input.value.length);
 }
 const empty={value:'',selectionStart:0};run.format(empty);assert.equal(empty.value,'');
 assert.ok(manual.includes('price.oninput=()=>{PB1418FormatMoneyInput(price);refreshTotal()}'));
 assert.ok(manual.includes('unitPrice:Number(digits(r.price.value)||0)'));
});
test('overview guide is removed for lab only and fixed header proxies original invoice action',()=>{
 assert.ok(bundle.includes('(t!=="lab"||w!=="overview")&&e.jsxs("button",{className:"financeHelpButton"'));
 assert.ok(header.includes('button.disabled=original.disabled'),'current header adapter keeps live tab state');
 assert.ok(header.includes("if(live?.isConnected&&!live.disabled)live.click()"));
 assert.ok(header.includes("button.disabled=original.disabled"));
 const css=fs.readFileSync('dist/web/photobridge-r1418-finance.css','utf8');
 assert.ok(css.includes('.pb1372HasThird .financeWorkspace .pb1176ManualOpen{display:none!important}'));
 assert.ok(css.includes('@media(min-width:821px) and (hover:hover) and (pointer:fine)'));
});
test('late presentation build is idempotent and outputs parseable scripts',()=>{
 const paths=['dist/web/assets/index-UIRefine-v655-r84.js','dist/web/photobridge-r1176-lab-finance.js','dist/web/photobridge-r1372-third-header.js','dist/web/index.html'];
 const before=paths.map(p=>fs.readFileSync(p,'utf8'));
 execFileSync(process.execPath,['scripts/enable-r1418-finance-presentation.mjs']);
 paths.forEach((p,i)=>assert.equal(fs.readFileSync(p,'utf8'),before[i]));
 for(const p of paths.slice(0,3))execFileSync(process.execPath,['--check',p]);
});
