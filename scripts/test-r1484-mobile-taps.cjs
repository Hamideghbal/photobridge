const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
test('phone card whitespace never opens details; desktop card and explicit details retain their handlers',()=>{
 const start=ui.indexOf('onClick:Jt=>{if(pb1483Phone())return;');assert(start>0);const end=ui.indexOf('||Tt(le)}',start)+'||Tt(le)}'.length;const source=ui.slice(start+8,end);let calls=0;
 for(const phone of [true,false]){const ctx={pb1483Phone:()=>phone,Tt:()=>calls++,le:{id:'one'}};const handler=vm.runInNewContext('('+source+')',ctx);handler({target:{closest:()=>null}});assert.equal(calls,phone?0:1);}
 assert(ui.includes('className:"miniDetailBtn",onClick:()=>Tt(le)'));
});
test('each phone stage has a full button hit area; downloads and unavailable stages notify without opening picker or details',async()=>{
 const start=ui.indexOf('onClick:event=>{if(pb1483Phone()){event.stopPropagation();if(Jt.key===');assert(start>0);const end=ui.indexOf(',children:[e.jsx("span",{className:"timelineDot"',start);assert(end>start);
 const source=ui.slice(start+8,end);
 for(const [key,allowed,expected]of [['download',true,0],['download_print',true,0],['ready',false,0],['print',true,1],['binding',true,1],['completed',true,1]]){
  const calls={action:0,alert:0,stop:0};const ctx={pb1483Phone:()=>true,Jt:{key},Bt:allowed,le:{id:'one'},alert:()=>calls.alert++,aa:(order,stage)=>{assert.equal(stage,key);calls.action++}};const handler=vm.runInNewContext('('+source+')',ctx);await handler({stopPropagation:()=>calls.stop++});assert.equal(calls.action,expected);assert.equal(calls.alert,1-expected);assert.equal(calls.stop,1);
 }
 assert(ui.includes('disabled:!!E||(!pb1483Phone()&&!Bt)'));
});
test('mobile rejects implicit folder picking before inspecting any disk; desktop picker remains functional',async()=>{
 const start=ui.indexOf('async function no(){'),end=ui.indexOf('async function Vs(',start);const source=ui.slice(start,end);let picked=0;const root={queryPermission:async()=> 'granted'};
 function create(phone){return vm.runInNewContext(source+';no', {pb1483Phone:()=>phone,ai:()=>true,window:{showDirectoryPicker:async()=>{picked++;return root}},Vs:async()=>true,Oy:async()=>{},qs:async()=>root,console});}
 await assert.rejects(create(true)(),/سیستم اصلی/);assert.equal(picked,0);assert.equal(await create(false)(),root);assert.equal(picked,1);
 new vm.Script(ui);
});
test('only phone CSS removes intake, enlarges touch targets and stretches invoice actions across width',()=>{
 const css=fs.readFileSync('dist/web/photobridge-r1484-mobile-taps.css','utf8');
 for(const line of css.split('\n').filter(l=>l.startsWith('html.')))for(const selector of line.split('{')[0].split(','))assert(selector.startsWith('html.pb1482LabPhoneMode body #root .labRoleWorkspace '));
 assert(css.includes('#pb1137LocalIntakeButton'));assert(css.includes('min-height:80px'));assert(css.includes('width:32px'));assert(css.includes('grid-auto-columns:minmax(0,1fr)'));assert(css.includes('display:contents'));assert(css.includes('text-align:right'));
});
test('every frozen Windows asset retains its verified hash and the patch ships after the mobile-only stages',()=>{
 const root='dist/web/lab-desktop-ui/',manifest=JSON.parse(fs.readFileSync(root+'manifest.json','utf8'));
 for(const file of manifest.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(root+file.name)).digest('hex'),file.sha256,file.name);
 assert(!fs.readFileSync(root+'assets/index-UIRefine-v655-r84.js','utf8').includes('PB1484 explicit phone taps'));
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');assert(build.indexOf('enable-r1484-mobile-taps.mjs')>build.indexOf('enable-r1483-lab-mobile.mjs'));
});
