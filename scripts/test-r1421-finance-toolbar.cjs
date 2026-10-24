const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const start=ui.indexOf('e.jsxs("section",{className:"card statementToolbar"'),end=ui.indexOf(',_&&e.jsxs(e.Fragment',start);
function toolbar(){const calls=[],jsx=(type,props)=>({type,...props});const tree=vm.runInNewContext(ui.slice(start,end),{e:{jsx,jsxs:jsx},t:'lab',z:'1',E:[{id:1,name:'Studio',mobile:'0912'}],q:v=>calls.push(['customer',v]),A:v=>calls.push(['clear',v]),Re:v=>calls.push(['page',v]),_e:'',je:'',Pe:v=>calls.push(['from',v]),d:v=>calls.push(['to',v]),Hs:'Date',D:false,b:()=>calls.push(['load']),_pb1177StmtMode:'summary',_setPb1177StmtMode:v=>calls.push(['mode',v]),_:null,tt:()=>calls.push(['pdf'])});return {tree,calls}}
test('statement uses receipt-style selector without title or extra search and preserves customer reset handler',()=>{
 const {tree,calls}=toolbar(),select=tree.children[0].children[0];
 assert.equal(select.type,'select');assert.equal(select['aria-label'],'انتخاب عکاسی');assert.equal(select.children[0].children,'انتخاب عکاسی');
 select.onChange({target:{value:'2'}});assert.equal(JSON.stringify(calls),JSON.stringify([['customer','2'],['clear',null],['page',1]]));
 assert.ok(!ui.slice(start,end).includes('statementCustomerSearchWrap'));
});
test('compact dates show from/to inside and all mode, print and load handlers remain live in the same toolbar',()=>{
 const {tree,calls}=toolbar(),filters=tree.children[0].children,actions=tree.children[1].children;
 assert.equal(filters[1].children[0].children[0].placeholder,'از تاریخ');
 assert.equal(filters[2].children[0].children[0].placeholder,'تا تاریخ');
 filters[1].children[0].children[0].onChange('2026-01-01');
 filters[2].children[0].children[0].onChange('2026-02-01');
 filters[3].onClick();actions[0].onClick();actions[1].onClick();actions[3].onClick();
 assert.equal(JSON.stringify(calls),JSON.stringify([['from','2026-01-01'],['page',1],['to','2026-02-01'],['page',1],['load'],['mode','summary'],['mode','detailed'],['pdf']]));
 assert.equal(actions[2].disabled,true);
 const css=fs.readFileSync('dist/web/photobridge-r1421-finance-toolbar.css','utf8');
 assert.ok(css.includes(':is(.pb1176PaymentActions,.statementToolbar)'));
 assert.ok(css.includes('position:sticky!important;top:0!important'));
 assert.ok(css.includes(':is(.statementFilters,.statementActions){display:contents!important}'));
 assert.ok(css.includes('.statementDateControl .persianDateTrigger'));
});
test('toolbar build preserves output on second run and generated script parses',()=>{
 const paths=['dist/web/assets/index-UIRefine-v655-r84.js','dist/web/index.html'],before=paths.map(p=>fs.readFileSync(p,'utf8'));
 execFileSync(process.execPath,['scripts/enable-r1421-finance-toolbar.mjs']);
 paths.forEach((p,i)=>assert.equal(fs.readFileSync(p,'utf8'),before[i]));
 execFileSync(process.execPath,['--check',paths[0]]);
});
