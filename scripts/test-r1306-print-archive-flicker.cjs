const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const nav=fs.readFileSync('dist/web/photobridge-r1126-desktop-navigation.js','utf8');
const from=nav.indexOf(' function pb1306PrintControlFingerprint(');
const to=nav.indexOf(' function render(){',from);
assert.ok(from>=0&&to>from,'source helpers exist');
const {pb1306PrintControlFingerprint,pb1306NeedsPrintHeaderSync}=vm.runInNewContext(
 nav.slice(from,to)+';({pb1306PrintControlFingerprint,pb1306NeedsPrintHeaderSync})'
);
function mockControl(classes,label){
 return {className:classes,textContent:label,outerHTML:'<button class="'+classes+'">'+label+'</button>'};
}
test('print archive active states do not rebuild header buttons',()=>{
 const idle=mockControl('photographerPrintCommonAction archive','▣ آرشیو');
 const active=mockControl('photographerPrintCommonAction archive active','▣ آرشیو');
 const loading=mockControl('photographerPrintCommonAction archive loading','▣ آرشیو');
 assert.notEqual(idle.outerHTML,active.outerHTML,'old outerHTML logic changed on active');
 assert.equal(pb1306PrintControlFingerprint(idle),pb1306PrintControlFingerprint(active));
 assert.equal(pb1306PrintControlFingerprint(idle),pb1306PrintControlFingerprint(loading));
 assert.notEqual(pb1306PrintControlFingerprint(idle),pb1306PrintControlFingerprint(mockControl('photographerPrintCommonAction finance','▤ فاکتور')));
});
test('print header observer ignores photo list updates but watches menu changes',()=>{
 const content={nodeType:1,closest:()=>null,matches:()=>false};
 const header={nodeType:1,closest:selector=>selector.includes('photographerRoleHeaderV710')?header:null,matches:()=>false};
 assert.equal(pb1306NeedsPrintHeaderSync([{type:'attributes',target:content,attributeName:'class'}]),false);
 assert.equal(pb1306NeedsPrintHeaderSync([{type:'childList',target:content,addedNodes:[],removedNodes:[]}]),false);
 assert.equal(pb1306NeedsPrintHeaderSync([{type:'attributes',target:header,attributeName:'class'}]),true);
 const wrapper={nodeType:1,closest:()=>null,matches:()=>false};
 const mounted={nodeType:1,matches:selector=>selector.includes('#photographerRoleHeaderV710'),querySelector:()=>null};
 assert.equal(pb1306NeedsPrintHeaderSync([{type:'childList',target:wrapper,addedNodes:[mounted],removedNodes:[]}]),true);
});
test('print cloned buttons update state and handler in place',()=>{
 const printSection=nav.slice(nav.indexOf('const signature=active+'),nav.indexOf('\n const pressTimers='));
 assert.match(printSection,/active==='print'\?visible\.map\(pb1306PrintControlFingerprint\)/);
 assert.ok(printSection.includes('row.dataset.source!==signature'));
 assert.ok(printSection.includes("copy.dataset.pb1306PrintSourceIndex=String(sourceIndex)"));
 assert.ok(printSection.includes("copy.classList.toggle('active',original.classList.contains('active'))"));
 assert.ok(printSection.includes("copy.onclick=()=>{press(copy);if(original.isConnected)original.click()"));
 const observer=nav.slice(nav.indexOf("frame.addEventListener('load'"),nav.indexOf('panel.append(frame,loading)'));
 assert.ok(observer.includes("key!=='print'||pb1306NeedsPrintHeaderSync(records)"));
});
