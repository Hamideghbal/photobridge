const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const js=fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const build=fs.readFileSync('scripts/enable-r1147-lab-admin-header.mjs','utf8');
const desktop=css.slice(css.indexOf('/* R1172: Windows lab header'));

test('lab desktop header matches Store font and tab proportions',()=>{
 assert(desktop.length>1000);
 assert.match(desktop,/font:850 13px\/1\.4 Vazirmatn,Tahoma,sans-serif!important/);
 assert.match(desktop,/font:800 12px\/1\.3 Vazirmatn,Tahoma,sans-serif!important/);
 assert.match(desktop,/button:is\(\[data-source\],\[data-category\]\)/);
 assert.match(desktop,/\.pb1148SecondaryHeader\{\s*direction:rtl!important;justify-content:flex-start!important/);
 assert.match(desktop,/gap:8px!important;padding:4px 18px!important/);
 assert.match(desktop,/\(hover:hover\) and \(pointer:fine\)/);
 assert(desktop.indexOf('.pb1147LabNav button:is([data-source],[data-category])')<desktop.indexOf('.pb1148SecondaryHeader button'));
});

test('quick access card and its reserved area are hidden only for desktop laboratory',()=>{
 assert.match(desktop,/\.labQueueQuickAccessV464/);
 assert.match(desktop,/\.labQueueQuickIntroV464/);
 assert.match(desktop,/\.pb1172RetiredQuickAccess/);
 assert.match(desktop,/height:0!important;min-height:0!important;border:0!important/);
 assert(js.includes('function retireQuickAccess(){'));
 assert(js.includes('retireQuickAccess();'));
 assert(js.includes("root.querySelectorAll('h2,h3,h4,h5,h6,legend,summary,strong')"));
 assert(js.includes("if(!isQueue)return"));
 assert(js.includes("document.querySelectorAll('.labRoleWorkspace .pb1172RetiredQuickAccess')"));
});

test('shortcut card itself is retired in both print and album queues',()=>{
 const start=js.indexOf('function retireQuickAccess(){');
 const end=js.indexOf('function navigate(path){',start);
 assert(start>=0&&end>start);
 const helper=js.slice(start,end);
 for(const path of ['/lab/orders','/lab/albums']){
  const flags=new Set();
  const known={
   parentElement:null,
   classList:{add:c=>flags.add('shortcut:'+c)},
   matches:()=>true
  };
  const title={
   textContent:'دسترسی سریع',parentElement:null,
   querySelectorAll:()=>[],matches:()=>false,
   classList:{add:c=>flags.add('title:'+c)}
  };
  const card={
   parentElement:null,children:[known,title],
   textContent:'دسترسی سریع چاپ آلبوم',
   querySelectorAll:()=>[{},{}],
   classList:{add:c=>flags.add('card:'+c)}
  };
  known.parentElement=card;title.parentElement=card;
  const root={
   classList:{toggle:(name,on)=>flags.add('root:'+name+':'+on)},
   querySelectorAll:q=>q==='.labQueueQuickAccessV464,.labQueueQuickIntroV464'?[known]:q.startsWith('h2,h3')?[title]:[]
  };
  card.parentElement=root;
  vm.runInNewContext(helper+'retireQuickAccess()',{
   document:{querySelector:q=>q==='.labRoleWorkspace'?root:null},location:{pathname:path}
  });
  assert(flags.has('shortcut:pb1172RetiredQuickAccess'),path+' shortcut');
  assert(flags.has('card:pb1172RetiredQuickAccess'),path+' surrounding empty space');
  assert(flags.has('root:pb1173QueueClean:true'),path+' desktop queue root cleaned');
 }
});

test('mobile lab views keep original layout; asset versions survive build',()=>{
 assert(js.includes("const media=matchMedia('(min-width:821px) and (hover:hover) and (pointer:fine)')"));
 for(const ext of ['css','js']){
  const asset='photobridge-r1147-lab-admin-header.'+ext+'?v=r1174';
  assert(html.includes(asset));
  assert(build.includes(asset));
 }
});
