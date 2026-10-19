const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const bundle=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');

const start=bundle.indexOf('_=async(ue,P)=>{',bundle.indexOf('function ej({'));
const end=bundle.indexOf(',A=(ue,P)=>',start);
assert.ok(start>0&&end>start,'print file import function is present');
const makeImporter=(deps)=>new Function('W','ie','K','Ze','pbSetProcessed','d','k',
  'return ('+bundle.slice(start+2,end)+');')(
  deps.W,deps.ie,deps.K,deps.Ze,deps.pbSetProcessed,deps.d,deps.k
);

test('printing a folder imports files progressively without waiting for every preview',async()=>{
 let groups=[{id:'size1',files:[],open:false}];
 const batches=[],snapshots=[],progress=[],busy=[];
 const importer=makeImporter({
  W:false,ie:false,
  K:value=>busy.push(value),
  Ze:()=>{},
  pbSetProcessed:value=>progress.push(value),
  d:async files=>{
   batches.push(files.length);
   return files.map(file=>({file,id:file.name}));
  },
  k:updater=>{
   groups=updater(groups);
   snapshots.push(groups[0].files.length);
  }
 });
 const originals=Array.from({length:101},(_,i)=>({size:100+i,name:'photo-'+i+'.jpg'}));
 await importer('size1',originals);
 assert.equal(groups[0].files.length,101);
 assert.deepEqual(groups[0].files.map(x=>x.file),originals,'original file references are retained');
 assert.ok(batches.every(n=>n>0&&n<=4),'decode work is bounded to four photos per batch');
 assert.equal(batches.length,26);
 assert.equal(snapshots[0],4,'first photos display before full folder is processed');
 assert.equal(snapshots.at(-1),101);
 assert.deepEqual(progress[0],{done:0,total:101});
 assert.deepEqual(progress.at(-1),{done:101,total:101});
 assert.deepEqual(busy,[true,false]);
});

test('empty files are ignored and upload lock blocks duplicate imports',async()=>{
 const groups=[{id:'size1',files:[]}];
 let called=0;
 const importer=makeImporter({
  W:true,ie:false,K:()=>{},Ze:()=>{},pbSetProcessed:()=>{},
  d:async()=>{called++;return[]},
  k:()=>{throw Error('must not mutate during upload')}
 });
 await importer('size1',[{size:10,name:'ignored.jpg'}]);
 assert.equal(called,0);
 assert.equal(groups[0].files.length,0);
});

test('large folder limits mounted photo cards while keeping every source for upload',()=>{
 assert.ok(bundle.includes('ue.files.slice(0,pbVisibleCount[ue.id]||48).map(Be=>'));
 assert.ok(bundle.includes('pbSetVisibleCount(prev=>({...prev,[ue.id]:(prev[ue.id]||48)+48}))'));
 assert.ok(bundle.includes('pbProcessed.done'));
 assert.ok(bundle.includes('className:"simplePrintPilotPrimaryAdd",disabled:W||ie||c'));
 assert.ok(bundle.includes('D=ue=>{if(ie)return;'));
 assert.ok(bundle.includes('name:tt.file.name,printCopies:pbPrintCopies(tt)'));
 assert.ok(bundle.includes('await rs(Gt.uploadUrl,tt.file,'));
 assert.ok(bundle.includes('previewUrl:URL.createObjectURL(b)'));
 assert.ok(bundle.includes('function zs(t){'));
});
