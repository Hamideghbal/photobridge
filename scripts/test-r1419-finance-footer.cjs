const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),manual=fs.readFileSync('dist/web/photobridge-r1176-lab-finance.js','utf8');
test('help is suppressed for every lab accounting tab while other roles retain it',()=>{
 assert.ok(ui.includes('t!=="lab"&&(t!=="lab"||w!=="overview")&&e.jsxs("button",{className:"financeHelpButton"'));
 for(const w of ['overview','invoices','payments','statement','expenses','ledger','accounting']){
 assert.equal(vm.runInNewContext('t!=="lab"&&(t!=="lab"||w!=="overview")',{t:'lab',w}),false);
 assert.equal(vm.runInNewContext('t!=="lab"&&(t!=="lab"||w!=="overview")',{t:'customer',w}),true);
 }
});
test('finance footer is a React-owned sibling after finance inside the content viewport with no duplicate outer footer',()=>{
 const start=ui.indexOf('f==="finance"&&e.jsxs("div",{className:"pb1419FinancePage"');
 const end=ui.indexOf(',f==="settings"&&',start);
 assert.ok(start>ui.indexOf('className:"rolePageScrollArea labRolePageScrollArea"'));
 const jsx=(type,props)=>({type,...props});
 const tree=vm.runInNewContext(ui.slice(start,end),{f:'finance',e:{jsx,jsxs:jsx},ub:'Finance',be:{pinned:[]},Ge(){}});
 assert.equal(tree.children[0].type,'Finance');
 assert.equal(tree.children[1].type,'footer');
 assert.equal(tree.children[1].className,'productFooter pb1419FinanceFooter');
 assert.ok(ui.includes('f!=="settings"&&f!=="finance"&&e.jsxs("footer",{className:"productFooter"'));
 const css=fs.readFileSync('dist/web/photobridge-r1419-finance-footer.css','utf8');
 assert.ok(css.includes('position:static!important'));
 assert.ok(css.includes('min-height:100%!important'));
});
test('simultaneous receipt uses the same grouped money formatter without changing payment serialization',()=>{
 assert.ok(manual.includes('paid.oninput=()=>PB1418FormatMoneyInput(paid)'));
 assert.ok(manual.includes('payment=Number(digits(paid.value)||0)'));
 assert.ok(manual.includes('paidAmount:payment'));
 const digits=manual.match(/const digits=v=>[^\n]+/)[0],format=manual.match(/function PB1418FormatMoneyInput\(input\)\{[^\n]*\}/)[0];
 const fn=vm.runInNewContext('(()=>{'+digits+';return '+format+'})()');
 for(const [raw,expected] of [['2500000','۲٬۵۰۰٬۰۰۰'],['0','۰'],['','']]){
 const input={value:raw,selectionStart:raw.length};fn(input);assert.equal(input.value,expected);
 }
 const paths=['dist/web/assets/index-UIRefine-v655-r84.js','dist/web/photobridge-r1176-lab-finance.js','dist/web/index.html'];
 const before=paths.map(p=>fs.readFileSync(p,'utf8'));
 execFileSync(process.execPath,['scripts/enable-r1419-finance-footer.mjs']);
 paths.forEach((p,i)=>assert.equal(fs.readFileSync(p,'utf8'),before[i]));
 execFileSync(process.execPath,['--check',paths[0]]);
 execFileSync(process.execPath,['--check',paths[1]]);
});
