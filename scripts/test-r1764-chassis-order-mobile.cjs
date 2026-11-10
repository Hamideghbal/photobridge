const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const root='dist/web/';
const js=fs.readFileSync(root+'photobridge-r1764-chassis-order-mobile.js','utf8');
const css=fs.readFileSync(root+'photobridge-r1764-chassis-order-mobile.css','utf8');

test('R1764: compiler exposes each size stock and loads only photographer-scoped assets',()=>{
 const bundle=fs.readFileSync(root+'assets/index-UIRefine-v655-r84.js','utf8');
 const html=fs.readFileSync(root+'index.html','utf8');
 assert(bundle.includes('"data-pb1764-stock":oe==null?0:oe.chassis_stock'),'size-level live price stock reaches photo rows');
 assert(bundle.includes('"data-pb1765-copies":pbPrintCopies(Be)'),'per-photo copy quantity reaches stock guard');
 assert(html.includes('&chassisCopies=r1765'),'main JS cache key updates for copy-level stock');
 assert(html.includes('/photobridge-r1764-chassis-order-mobile.js?v=r1765'),'guard URL cache key refreshed');
 assert.equal((html.match(/photobridge-r1764-chassis-order-mobile\.js/g)||[]).length,1);
 assert.equal((html.match(/photobridge-r1764-chassis-order-mobile\.css/g)||[]).length,1);
 assert(css.includes('.simplePrintPhotoAddonCheck.pb1764ChassisUnavailable'));
 assert(css.includes('.customerOrderHead>div>b'));
 assert(css.includes('white-space:nowrap!important;'));
 assert(css.includes('word-break:keep-all!important;'));
 assert(!css.includes('.labRoleWorkspace'),'lab presentation remains untouched');
 new vm.Script(js,{filename:'R1764 photo availability'});
});

function scenario({stock,checked,disabled=false,busy=false,copies=[]}){
 let capture=null;const callbacks=[];
 const cls=()=>{const set=new Set();return {contains:v=>set.has(v),toggle:(v,on)=>{if(on)set.add(v);else set.delete(v)}}};
 const labels=checked.map((start,index)=>{
  const label={textContent:'شاسی',classList:cls(),closest:()=>card,getAttribute:n=>n==='data-pb1765-copies'?String(copies[index]??1):null};
  const input={checked:start,disabled:false,closest:()=>label,click(){
   let prevented=false;
   capture?.({target:input,preventDefault(){prevented=true},stopImmediatePropagation(){}});
   if(!prevented)input.checked=!input.checked;
  }};
  label.querySelector=()=>input;label.input=input;return label;
 });
 const groupInput={disabled},otherInput={disabled:busy};
 const group={querySelector:()=>groupInput,getAttribute:n=>n==='data-pb1764-stock'?stock==null?null:String(stock):null};
 const card={
  querySelector:n=>n==='.simplePrintCardAddonCheck.pb1608ChassisGroup'?group:null,
  querySelectorAll:n=>n==='.simplePrintPhotoAddonCheck'?labels:[groupInput,otherInput]
 };
 const document={
  readyState:'complete',getElementById:()=>({}),
  addEventListener:(type,fn)=>{if(type==='click')capture=fn},
  querySelectorAll:n=>n==='main.photographerMain .simplePrintSizeCard'?[card]:[]
 };
 vm.runInNewContext(js,{document,window:{},MutationObserver:class{observe(){}},requestAnimationFrame:fn=>callbacks.push(fn)});
 while(callbacks.length)callbacks.shift()();
 return {hidden:labels.map(x=>x.classList.contains('pb1764ChassisUnavailable')),checked:labels.map(x=>x.input.checked)};
}

test('R1764: missing, zero or insufficient stock removes the option and old React selection',()=>{
 for(const stock of [null,0,1]){
  const x=scenario({stock,checked:[true,true],disabled:stock===0});
  assert.deepEqual(x.hidden,[true,true],String(stock));
  assert.deepEqual(x.checked,[false,false],String(stock));
 }
});
test('R1764: enough stock leaves photo choices intact',()=>{
 const x=scenario({stock:3,checked:[true,false],disabled:false});
 assert.deepEqual(x.hidden,[false,false]);
 assert.deepEqual(x.checked,[true,false]);
});
test('R1764: busy-send disabled state does not clear valid chassis choices',()=>{
 const x=scenario({stock:3,checked:[true,true],disabled:true,busy:true});
 assert.deepEqual(x.checked,[true,true]);
 assert.deepEqual(x.hidden,[false,false]);
});

test('R1765: chassis stock is checked against the sum of print copies, not only distinct image files',()=>{
 const shortage=scenario({stock:3,checked:[true,false],copies:[3,2]});
 assert.deepEqual(shortage.hidden,[true,true]);
 assert.deepEqual(shortage.checked,[false,false]);
 const enough=scenario({stock:5,checked:[true,false],copies:[3,2]});
 assert.deepEqual(enough.hidden,[false,false]);
 assert.deepEqual(enough.checked,[true,false]);
});
