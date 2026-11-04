'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');

const jsPath='dist/web/photobridge-r1593-lab-order-fly.js';
const nativeJs='dist/web/lab-desktop-ui/photobridge-r1593-lab-order-fly.js';
const webBundle='dist/web/assets/index-UIRefine-v655-r84.js';
const nativeBundle='dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js';
const manifestPath='dist/web/lab-desktop-ui/manifest.json';
const cssPath='dist/web/photobridge-r1593-photographer-compact.css';

function createDom({hidden=false,reduced=false,visible=true}={}){
 const handlers={},classes=new Set(),hiddenOriginal={value:false};
 let ghost=null;
 const style={
   setProperty(name,value){if(name==='opacity'&&value==='0')hiddenOriginal.value=true},
   removeProperty(name){if(name==='opacity')hiddenOriginal.value=false}
 };
 const rect=()=>({left:55,top:230,width:630,height:120,bottom:350});
 const tab={
   isConnected:true,offsetWidth:115,classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)},
   animate(){},getBoundingClientRect:()=>({left:460,top:40,width:115,height:36})
 };
 const original={
   isConnected:true,dataset:{orderId:'lab-order-1'},style,animate(){},getBoundingClientRect:rect,
   cloneNode(){
     return {isConnected:false,style:{setProperty(){},removeProperty(){}},
       classList:{add(){}},setAttribute(){},removeAttribute(){},
       querySelectorAll(){return[]},remove(){this.isConnected=false},
       animate(frames,options){
         assert.equal(frames.length,4);
         assert.equal(options.duration,690);
         return {addEventListener:(name,fn)=>{handlers[name]=fn}};
       }};
   }
 };
 const document={
   visibilityState:hidden?'hidden':'visible',
   querySelectorAll:()=>[tab,tab,tab],
   querySelector:selector=>selector==='.stageQueueWorkspace .labOrderScrollArea'
     ?{querySelectorAll:()=>[original]}:null,
   body:{appendChild(node){node.isConnected=true;ghost=node;}}
 };
 const window={
   innerHeight:800,console:{debug(){}},setTimeout(fn){fn()},
   matchMedia(query){return {matches:query.includes('prefers-reduced-motion')?reduced:visible}}
 };
 vm.runInNewContext(fs.readFileSync(jsPath,'utf8'),{window,document,console});
 return {window,handlers,classes,original,hiddenOriginal,getGhost:()=>ghost};
}

test('confirmed READY lab order flies toward correct queue tab and cleans clone',()=>{
 const t=createDom();
 assert.equal(t.window.PB1593LabFlyOrder({orderId:'lab-order-1',target:'ready'}),true);
 assert(t.getGhost()?.isConnected);
 assert(t.hiddenOriginal.value);
 assert(t.handlers.finish);
 t.handlers.finish();
 assert(!t.getGhost().isConnected);
 assert(!t.hiddenOriginal.value);
});

test('COMPLETED order also flies, cancellation restores the original, and missing card skips',()=>{
 const t=createDom();
 assert.equal(t.window.PB1593LabFlyOrder({orderId:'lab-order-1',target:'completed'}),true);
 t.handlers.cancel();
 assert(!t.hiddenOriginal.value);
 assert.equal(t.window.PB1593LabFlyOrder({orderId:'not-present',target:'ready'}),false);
});

test('hidden tab, reduced motion, or small viewport skips animation without hiding card',()=>{
 for(const option of [{hidden:true},{reduced:true},{visible:false}]){
   const t=createDom(option);
   assert.equal(t.window.PB1593LabFlyOrder({orderId:'lab-order-1',target:'ready'}),false);
   assert(!t.hiddenOriginal.value);
   assert.equal(t.getGhost(),null);
 }
});

test('native AND web bundles do not force-switch the Lab order tab after status updates',()=>{
 for(const path of [webBundle,nativeBundle]){
   execFileSync(process.execPath,['--check',path],{stdio:'pipe'});
   const s=fs.readFileSync(path,'utf8'),start=s.indexOf('function Uf('),end=s.indexOf('function vi(',start);
   assert(start>=0&&end>start,path+' lab workflow found');
   const part=s.slice(start,end);
   assert(part.includes('/*') || part.includes('PB1593LabFlyOrder'));
   assert(part.includes('PB1593LabFlyOrder?.({orderId:String(le.id),target:"ready"})'));
   assert(part.includes('PB1593LabFlyOrder?.({orderId:String(le.id),target:"completed"})'));
   assert(!part.includes('k("ready");qt=!0'),'no fast ready auto-tab switch');
   assert(!part.includes('await ee(T,nt,()=>{k(nt)'),'no legacy Gt auto-tab switch');
   assert(!part.includes("detail:{from:T,to:nt,number:V(le.number)}"),'no unintended whole-queue slide on stage completion');
   assert(part.includes('onClick:()=>Q("ready")'),'manual tab navigation still works');
   assert(part.includes('onClick:()=>Q("completed")'));
 }
});

test('native Windows Lab manifest hashes every new visual asset',()=>{
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
 const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
 assert.equal(manifest.protocol,1);
 assert.equal(manifest.channel,'lab');
 assert.equal(hash(JSON.stringify(manifest.files)),manifest.build);
 for(const name of ['index.html','assets/index-UIRefine-v655-r84.js',
   'photobridge-r1593-photographer-compact.css','photobridge-r1593-lab-order-fly.css',
   'photobridge-r1593-lab-order-fly.js']){
   const row=manifest.files.find(f=>f.name===name);
   assert(row,'missing Windows Lab manifest entry '+name);
   assert.equal(row.url,'/lab-desktop-ui/'+name);
   assert.equal(row.sha256,hash(fs.readFileSync('dist/web/lab-desktop-ui/'+name)));
 }
 assert.equal(fs.readFileSync(nativeJs,'utf8'),fs.readFileSync(jsPath,'utf8'));
 const nativeHtml=fs.readFileSync('dist/web/lab-desktop-ui/index.html','utf8');
 assert(nativeHtml.includes('/photobridge-r1593-lab-order-fly.js?v=r1593'));
});

test('desktop photographer cards center status between ONLY three vertical rules',()=>{
 const css=fs.readFileSync(cssPath,'utf8');
 assert(css.includes('min-height:48px!important'));
 assert(css.includes('align-self:center!important'));
 assert(css.includes('justify-self:center!important'));
 assert(css.includes('border-bottom:0!important'));
 assert(css.includes('border-inline-start:1px solid #dce4ed!important'));
 assert(css.includes('.liveOrderCard:not(.albumCustomerOrderCard)'));
 assert(css.includes('html:is(.pb1126Desktop,.pb1126Embedded)'));
 assert(!css.includes('@media (max-width'));
 const webHtml=fs.readFileSync('dist/web/index.html','utf8');
 assert.equal(webHtml.split('photobridge-r1593-photographer-compact.css?v=r1593').length-1,1);
});

test('visual assets parse and repeated delivery is idempotent',()=>{
 execFileSync(process.execPath,['--check',jsPath],{stdio:'pipe'});
 const original=fs.readFileSync(webBundle,'utf8');
 const previous=fs.readFileSync(nativeBundle,'utf8');
 const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8')).build;
 execFileSync(process.execPath,['scripts/enable-r1593-lab-flight-and-photographer-card.mjs'],{stdio:'pipe'});
 assert.equal(fs.readFileSync(webBundle,'utf8'),original);
 assert.equal(fs.readFileSync(nativeBundle,'utf8'),previous);
 assert.equal(JSON.parse(fs.readFileSync(manifestPath,'utf8')).build,manifest);
});
