'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const original=fs.readFileSync(path.join(__dirname,'../verified-ui/photobridge-r1137-lab-local-intake.js'),'utf8');
const {patchOfflineIntake}=require('../offline-ui.cjs');
const {serve}=require('../r1918-safeserve.cjs');
function mountTest(script,pathname='/lab/orders'){
 const elements=[];
 const host={isConnected:true,getClientRects:()=>[{}],querySelector:()=>null,append(el){elements.push(el);el.parentElement=host;}};
 const document={querySelector:sel=>sel==='.labRoleWorkspace'?host:null,getElementById:id=>elements.find(e=>e.id===id)||null};
 const window={matchMedia:()=>({matches:true})};
 const start=script.indexOf('function mount(){'),end=script.indexOf('let primaryState=',start);
 assert(start>=0&&end>start,'real native walk-in mount must be present');
 vm.runInNewContext(script.slice(start,end)+'\nmount();',{document,window,location:{pathname},storage:()=>null,node:(tag,txt,cls)=>({tag,textContent:txt,cls}),primaryState:null,open:()=>{throw Error('must not submit when merely mounted')},checkPrimary:()=>{throw Error('must not check remote primary without native bridge')}},{timeout:500});
 return elements;
}
test('R1918: actual pinned native intake JS remains valid and offers one visible button with a delayed storage bridge',()=>{
 const transformed=patchOfflineIntake(original);
 new Function(transformed);
 assert(transformed.includes('R1918_WALKIN_ENTRY_RESTORED'));
 assert(transformed.includes("api('/api/lab/manual-intake/preflight')"));
 assert.equal(serve(original,patchOfflineIntake),transformed);
 const elems=mountTest(transformed);
 assert.equal(elems.length,1);
 assert.equal(elems[0].textContent,'ثبت سفارش عکس حضوری');
 assert.equal(elems[0].id,'pb1137LocalIntakeButton');
 assert.equal(elems[0].type,'button');
 assert.equal(patchOfflineIntake(original),transformed);
});
test('R1918: restored button remains confined to lab routes',()=>{
 assert.equal(mountTest(patchOfflineIntake(original),'/store/orders').length,0);
});
test('R1918: unknown UI source is served unchanged rather than HTTP 500',()=>{
 const logs=[];
 const src='window.hello=true;';
 assert.equal(serve(src,patchOfflineIntake,x=>logs.push(x)),src);
 assert(logs.length);
});
