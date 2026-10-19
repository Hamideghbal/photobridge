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
 assert.ok(bundle.includes('className:"primary simplePrintPilotPrimaryAdd",disabled:W||ie||c'));
 assert.ok(bundle.includes('D=ue=>{if(ie)return;'));
 assert.ok(bundle.includes('name:tt.file.name,printCopies:pbPrintCopies(tt)'));
 assert.ok(bundle.includes('await rs(Gt.uploadUrl,tt.file,'));
 assert.ok(bundle.includes('previewUrl:URL.createObjectURL(b)'));
 assert.ok(bundle.includes('function zs(t){'));
});

test('choosing a print size never opens the Windows file picker automatically',()=>{
 const from=bundle.indexOf('Pe=ue=>{',bundle.indexOf('function ej({'));
 const to=bundle.indexOf(',d=async ue=>',from);
 assert.ok(from>0&&to>from,'print size selection handlers found');
 const handlers=bundle.slice(from,to).replace('Pe=','Pe:').replace(',je=',',je:');
 const calls=[];
 const picker={current:{click:()=>{throw Error('native picker opened without permission')}}};
 const actions=new Function('w','L','_e','m','return ({'+handlers+'})')(
  value=>calls.push(['size',value]),
  value=>calls.push(['custom',value]),
  size=>{calls.push(['group',size]);return 'size-id';},
  picker
 );
 actions.Pe('10x15');
 actions.Pe('__custom__');
 actions.je({widthCm:12,heightCm:18});
 assert.deepEqual(calls,[
  ['size','10x15'],['group','10x15'],
  ['size','__custom__'],['custom',true],
  ['group','__custom__'],['size','__custom__']
 ]);
});

test('dropped Windows folders are scanned without a native dialog and preserve relative paths',async()=>{
 const begin=bundle.indexOf('const pb1305DroppedPaths=');
 const finish=bundle.indexOf('function ej({',begin);
 assert.ok(begin>0&&finish>begin,'drop helper present');
 const helpers=new Function(bundle.slice(begin,finish)+
  ';return {pb1305ReadDroppedPhotos,pb1305DroppedPaths}')();
 const photo={name:'p1.jpg',size:600,type:'image/jpeg'};
 const psd={name:'p2.psd',size:1500,type:''};
 const textFile={name:'notes.txt',size:10,type:'text/plain'};
 const entry=file=>({isFile:true,file:ok=>ok(file)});
 let first=true;
 const folder={isDirectory:true,name:'shoot',createReader:()=>({
  readEntries:ok=>ok(first?(first=false,[entry(photo),entry(textFile),entry(psd)]):[])
 })};
 const accepted=await helpers.pb1305ReadDroppedPhotos({
  items:[{kind:'file',webkitGetAsEntry:()=>folder}]
 });
 assert.equal(accepted.length,2);
 assert.equal(accepted[0],photo,'keeps the original file');
 assert.equal(accepted[1],psd);
 assert.equal(helpers.pb1305DroppedPaths.get(photo),'shoot/p1.jpg');
 assert.equal(helpers.pb1305DroppedPaths.get(psd),'shoot/p2.psd');
 const direct=await helpers.pb1305ReadDroppedPhotos({files:[photo,textFile]});
 assert.deepEqual(direct,[photo]);
 assert.ok(bundle.includes('relativePath:String(pb1305DroppedPaths.get(b)||b.webkitRelativePath||b.name)'));
});

test('each size has an independent drag-drop zone and an optional Windows picker button',()=>{
 assert.ok(bundle.includes('className:"pb1305PrintDropArea "'));
 assert.ok(bundle.includes('onDrop:async Be=>{Be.preventDefault();if(W||ie)return;'));
 assert.ok(bundle.includes('await pb1305ReadDroppedPhotos(Be.dataTransfer)'));
 assert.ok(bundle.includes('انتخاب فایل با پنجره ویندوز'));
 assert.ok(bundle.includes('m.current&&m.current.click()'),'native picker can still be opened after explicit click');
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert.ok(html.includes('/photobridge-r1305-print-native-picker.css?v=r1305'));
});
