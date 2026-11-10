'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
function harness(){
 const states=new Map(),names=[];
 const Ya=(s)=>String(s||'').trim().replace(/[^a-zA-Z0-9._ -]+/g,'-').replace(/\s+/g,'-').replace(/-+/g,'-').toLowerCase();
 const dir={async getDirectoryHandle(name){names.push(name);return {name}}};
 const ctx={yc:id=>states.get(id)||null,Ya,Da:{luster:'Luster'},$g:x=>x||{},
  Hl:(root,name)=>root.getDirectoryHandle(Ya(name)),Date,Math,Number,String};
 const a=ui.indexOf('function Tg('),b=ui.indexOf('function pb1769OrderFirst(',a),c=ui.indexOf('async function el(',b);
 assert(a>=0&&b>a&&c>b&&c-b<5000,'folder helpers loaded from the shipped bundle');
 vm.createContext(ctx);
 vm.runInContext(ui.slice(a,b)+ui.slice(b,c),ctx);
 const fnA=ui.indexOf('function pb1769DownloadName('),fnB=ui.indexOf('function pb1450Meta(',fnA);
 assert(fnA>=0&&fnB>fnA);
 vm.runInContext(ui.slice(fnA,fnB),ctx);
 return {ctx,states,dir,names};
}
test('R1769: fresh orders get their own numbered folder, containing all print sizes',()=>{
 const {ctx,states}=harness();
 const order={id:'a',number:451,mode:'print',customer_name:'Studio',downloaded_at:null};
 const first=ctx.Uy({order},{size_label:'10x15',print_type:'luster'});
 const second=ctx.Uy({order},{size_label:'20x30',print_type:'luster'});
 assert.equal(ctx.pb1769OrderFirst(order),true);
 assert.equal(ctx.pb1769OrderFolder(order),'order-451');
 assert.match(first,/10x15/);assert.match(second,/20x30/);
 assert.doesNotMatch(first,/451/);
 assert.doesNotMatch(second,/451/);
 const another={...order,id:'b',number:452};
 assert.notEqual(ctx.pb1769OrderFolder(another),ctx.pb1769OrderFolder(order));
 states.set('a',{pathLayout:'order-v2',startedAt:'2026-11-10T08:00:00Z'});
 assert.equal(ctx.pb1769OrderFirst({...order,downloaded_at:'2026-11-10'}),true);
});
test('R1769: existing downloaded orders use their original group path, not a moved folder',()=>{
 const {ctx,states}=harness();
 const old={id:'old',number:123,mode:'print',downloaded_at:'2026-10-25',customer_name:'New Studio',storage_customer_name:'Old Studio',folder_latin_name:'Changed Name'};
 states.set('old',{startedAt:'2026-10-25'});
 assert.equal(ctx.pb1769OrderFirst(old),false);
 assert.match(ctx.Uy({order:old},{size_label:'10x15',print_type:'luster'}),/order-123/);
 assert.equal(ctx.Tg(old),'old-studio');
 states.set('old',{pathLayout:'legacy',startedAt:'2026-10-25'});
 assert.equal(ctx.pb1769OrderFirst(old),false);
});
test('R1769: lab-specific Latin alias is saved literally, while blank aliases use transliteration',async()=>{
 const {ctx,dir,names}=harness();
 const incoming={id:'fresh',number:78,mode:'print',customer_name:'Persian Original',folder_latin_name:'My Studio 2026'};
 assert.equal((await ctx.pb1769CustomerDir(dir,incoming)).name,'My Studio 2026');
 assert.equal((await ctx.pb1769CustomerDir(dir,{...incoming,folder_latin_name:''})).name,'persian-original');
 assert.deepEqual(names,['My Studio 2026','persian-original']);
});
test('R1769: printed files use equals before the extension for multiple copies',()=>{
 const {ctx,states}=harness();
 const order={id:'fresh',number:123};
 const multiple={original_name:'photo = 3.jpg',print_copies:3};
 assert.equal(ctx.pb1769DownloadName(multiple,multiple.original_name,order),'photo = 3.jpg');
 assert.equal(ctx.pb1769DownloadName({...multiple,original_name:'photo.jpg'},'photo.jpg',order),'photo = 3.jpg');
 assert.equal(ctx.pb1769DownloadName({original_name:'photo.jpg',print_copies:1},'photo.jpg',order),'photo.jpg');
 states.set('fresh',{pathLayout:'legacy',startedAt:'2026-10-01'});
 assert.equal(ctx.pb1769DownloadName(multiple,multiple.original_name,order),'photo-3.jpg');
 assert.match(ui,/exactName \? name : Ya\(name, 'file'\)/);
 assert.match(ui,/expected,pb1769OrderFirst\(detail.order\)/);
 assert.match(ui,/s.dir.getFileHandle\(pb1769DownloadName\(a,a.original_name,t.order\),\{create:!1\}\)/);
 assert.match(ui,/function pb1445ValidLocal\(file, meta, order\)/);
});
test('R1769: album pages share the same order folder and unchanged size details',()=>{
 const {ctx}=harness(),order={id:'fresh',number:515,mode:'album',album_data:{size:{label:'30x60'},cover:{name:'Leather'}}};
 const k=ctx.Uy({order},{print_type:'luster'});
 assert.match(k,/album/);assert.match(k,/30x60/);assert.doesNotMatch(k,/order-515/);
 assert.equal(ctx.pb1769OrderFolder(order),'order-515');
});
test('R1769: final site cache token updated and old orders retain original workflow status',()=>{
 assert.match(ui,/PB1769 ORDER-FIRST DOWNLOAD FOLDERS/);
 assert.match(html,/&orderFolders=r1769/);
 assert.match(ui,/pathLayout:old.pathLayout \|\| \(old.startedAt \|\| detail.order.downloaded_at \? 'legacy' : 'order-v2'\)/);
 assert.match(ui,/pb1769CustomerDir\(dateDir,order\)/);
 assert.match(ui,/pb1769CustomerDir\(c,r\)/);
});
