'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {compileIntake}=require('../native-intake-168.cjs');
const raw=fs.readFileSync(path.join(__dirname,'../verified-ui/photobridge-r1137-lab-local-intake.js'),'utf8');
test('168 serves compiled launcher and offline contract',()=>{
 const code=compileIntake(raw);assert.match(code,/PB168 native walk-in mount/);assert.match(code,/desktopLocalFiles/);assert.match(code,/pb2063ByHash\.get\(hash\)/);
 assert.doesNotThrow(()=>new Function(code));assert.equal(compileIntake(code),code);
});
test('168 retains verified intake when only performance anchor changes',()=>{
 const variant=raw.replace('const item=group.items.find(x=>x.hash===hash)||additions.find(x=>x.hash===hash);','const item=[...group.items,...additions].find(x=>x.hash===hash);');
 assert.notEqual(variant,raw);const code=compileIntake(variant);assert.match(code,/PB168 original intake performance fallback/);assert.match(code,/PB168 native walk-in mount/);
 assert.match(code,/desktopLocalFiles/);assert.doesNotThrow(()=>new Function(code));
});
test('168 print and album launcher visible before primary check; calls original opener',()=>{
 const code=compileIntake(raw),a=code.indexOf('function mount(){'),b=code.indexOf('\nlet primaryState=',a);
 const byId=new Map(),calls=[];
 function el(){return {isConnected:true,hidden:false,parentElement:null,children:[],dataset:{},classList:{remove(){}},getClientRects(){return this.isConnected&&!this.hidden?[{}]:[]},prepend(n){if(n.parentElement){n.parentElement.children=n.parentElement.children.filter(x=>x!==n)}this.children.unshift(n);n.parentElement=this;n.isConnected=true;if(n.id)byId.set(n.id,n)},append(n){this.prepend(n)},remove(){this.isConnected=false;if(this.id)byId.delete(this.id)},querySelector(){return null},querySelectorAll(){return []}};}
 const root=el(),host=el(),fallback=el();let header=el();
 root.querySelector=s=>s==='main'?host:s.includes('stageQueueWorkspace')?host:null;
 root.querySelectorAll=s=>s.includes('pb1148SecondaryHeader')?[header]:s.includes('labSingleHeader')?[fallback]:[];
 const doc={head:el(),querySelector:s=>s==='.labRoleWorkspace'?root:null,getElementById:id=>byId.get(id)||null,createElement:el};
 const route={pathname:'/lab/orders'};
 const run=new Function('document','location','window','storage','node','open','primaryState','checkPrimary','getComputedStyle',code.slice(a,b)+'\nreturn mount;');
 const mount=run(doc,route,{},()=>({deviceId:()=>null}),(_,text)=>Object.assign(el(),{textContent:text}),m=>calls.push(m),false,()=>{},()=>({visibility:'visible'}));
 mount();let btn=byId.get('pb1137LocalIntakeButton');assert(btn);assert.equal(btn.parentElement,header);assert.equal(btn.textContent,'ثبت سفارش عکس حضوری');btn.onclick();
 route.pathname='/lab/album';header=el();mount();assert.equal(btn.parentElement,header);assert.equal(btn.textContent,'ثبت سفارش آلبوم حضوری');btn.onclick();
 assert.deepEqual(calls,['print','album']);header.hidden=true;mount();assert.equal(btn.parentElement,fallback);
 route.pathname='/lab/finance';mount();assert.equal(byId.has(btn.id),false);
});
