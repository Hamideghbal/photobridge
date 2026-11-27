'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {patchNativeIntake,patchManual}=require('../native-performance-165.cjs'),{patchOfflineIntake}=require('../offline-ui.cjs');
const root=path.join(__dirname,'..','verified-ui');
const raw=fs.readFileSync(path.join(root,'photobridge-r1137-lab-local-intake.js'),'utf8');
const base=patchOfflineIntake(raw);
test('1.0.167 patches the verified original intake and is idempotent',()=>{
 const code=patchNativeIntake(base);
 assert.match(code,/pb2063ByHash\.get\(hash\)/);assert.match(code,/pb2063FilesById\.get\(item\.fileId\)/);
 assert.match(code,/PB167 stable walk-in launcher/);assert.doesNotThrow(()=>new Function(code));
 assert.equal(patchNativeIntake(code),code);
 assert.doesNotThrow(()=>new Function(patchManual(fs.readFileSync(path.join(root,'photobridge-r1176-lab-finance.js'),'utf8'))));
});
test('1.0.167 handles newer hash lookup and preserves the full source-action payload',()=>{
 const variant=base.replace('const item=group.items.find(x=>x.hash===hash)||additions.find(x=>x.hash===hash);','const item = group.items.find(x=>x.hash===hash) || additions.find(x=>!x.existing&&x.hash===hash);')
 .replace('async function appendFiles(group,files,size,paper){',"async function appendFiles(group,files,size,paper,sourceAction='copy'){")
 .replace('additions.push({existing:item,sourceFile:file});','additions.push({existing:item.existing||item,sourceFile:file,sourceAction});')
 .replace('additions.push({file,hash,size,paper,copies:1});','additions.push({file,hash,size,paper,copies:1,sourceActions:[sourceAction]});');
 assert.notEqual(variant,base);
 const code=patchNativeIntake(variant);
 assert.match(code,/pb2063ByHash\.get\(hash\)/);
 assert.match(code,/sourceActions:\[sourceAction\]/);assert.match(code,/existing:item\.existing\|\|item,sourceFile:file,sourceAction/);
 assert.doesNotThrow(()=>new Function(code));
});
test('1.0.167 real print and album launchers follow the visible header and preserve the click action',()=>{
 const code=patchNativeIntake(base);
 const mount=code.slice(code.indexOf('function mount(){'),code.indexOf('\nlet primaryState=',code.indexOf('function mount(){')));
 const elements=new Map(),calls=[];
 function el(visible=true){return {isConnected:true,visible,parentElement:null,children:[],getClientRects(){return this.visible?[{}]:[];},append(n){n.parentElement=this;this.children.push(n);if(n.id)elements.set(n.id,n);},remove(){if(this.id)elements.delete(this.id);this.parentElement=null;this.isConnected=false;},querySelector(){return null;}};}
 const host=el(),firstHeader=el(),fallback=el(),hidden=el(false);let header=firstHeader;
 host.querySelector=s=>s==='.ordersWorkspace'?hidden:null;
 const doc={head:el(),createElement:()=>el(),getElementById:id=>elements.get(id)||null,querySelector:s=>s==='.labRoleWorkspace main'?host:s.includes('pb1148SecondaryHeader')?header:s.includes('labSingleHeader')?fallback:null};
 const location={pathname:'/lab/orders'},window={matchMedia:()=>({matches:true})};
 const node=(_tag,text)=>Object.assign(el(),{textContent:text});
 const storage=()=>({deviceId:()=>true});
 const run=new Function('document','location','window','storage','node','open','primaryState','checkPrimary',mount+'\nmount();');
 const go=()=>run(doc,location,window,storage,node,m=>calls.push(m),true,()=>{});
 go();let button=elements.get('pb1137LocalIntakeButton');assert(button);assert.equal(button.parentElement,firstHeader);assert.equal(button.textContent,'ثبت سفارش عکس حضوری');button.onclick();
 header=el();location.pathname='/lab/album';go();assert.equal(elements.get('pb1137LocalIntakeButton'),button);assert.equal(button.parentElement,header);assert.equal(button.textContent,'ثبت سفارش آلبوم حضوری');button.onclick();
 assert.deepEqual(calls,['print','album']);
 header.visible=false;go();assert.equal(button.parentElement,fallback);
 location.pathname='/lab/finance';go();assert.equal(elements.has('pb1137LocalIntakeButton'),false);
});
