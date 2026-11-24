'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');

test('R1978 labels remain visible and clickable next to BOTH Print and Album tabs',()=>{
 const guide=read('dist/web/photobridge-workflow-guides-v572.js');
 assert.doesNotThrow(()=>new vm.Script(guide));
 assert(guide.includes("document.createElement('button')"),'guide must be a real button for desktop secondary header cloning');
 assert(guide.includes("pb1978VideoGuideButton"),'new visible labelled guide class');
 assert(guide.includes('ویدیوی آموزشی'),'fully written visible label');
 assert(guide.includes('pb569GuideArrow'),'visible pointing arrow');
 assert(guide.includes("mount('print',print)"),'guide beside Print Photos');
 assert(guide.includes("mount('album',album)"),'guide beside Album Binding');
 // R1980: the lab chooser must contain only lab information, not synthetic
 // Print/Album tabs or tutorial buttons. The real Print mode header owns them.
 assert(!guide.includes('function mountChooserGuides()'),'no guide insertion into the lab chooser');
 assert(!guide.includes('pb1978ChooserVideos'),'no synthetic Print/Album guide row');
 assert(!guide.includes('pb1978ChooserPair'),'no tutorial boxes in the chooser');
 assert(guide.includes("const validNav=document.querySelector('.photographerPrintWorkspace .photographerPrintModeNav')"),'bind guides only to the original Print/Album header');
 assert(guide.includes("nav.insertBefore(button,target)"),'each guide is beside its own original tab');
 assert(guide.includes('nav.insertBefore(button,target)'),'guide is a sibling and does not nest interactive buttons');
 assert(guide.includes("kind==='print'?'mobile':'desktop'")===false,'do not hard-code one video for both devices');
 assert(guide.includes("slots.find(s=>s.kind===kind&&s.device==="),'each guide uses its matching mobile/desktop slot');
 assert(guide.includes("if(arrow.textContent!==direction)"),'no repeated DOM observer loop');
});

test('R1978 Print tap opens forced Lab chooser from mobile main tab and Print Photo mode',()=>{
 const source=read('dist/web/photobridge-v904r99-lab-chooser.js');
 assert.doesNotThrow(()=>new vm.Script(source));
 const start=source.indexOf('function isPrintPrimaryNav(el){');
 const end=source.indexOf('\n  }',start);
 assert(start>=0&&end>start,'Print tab matcher must exist');
 const src=source.slice(start,end+4);
 const match=new Function('isPhotographerRoute','return ('+src+');')(()=>true);
 function element(label,{primary=false,printMode=false,href=''}={}){
  return {
   textContent:label,dataset:{mainHref:href},
   getAttribute:key=>key==='aria-label'?label:key==='href'?href:null,
   matches:selector=>selector==='.photographerPrintPhotoTab'&&printMode,
   closest:selector=>{
    if(selector.includes('.labBottomAppNav'))return null;
    if(selector.includes('.photographerHomeModeNav'))return primary?{}:null;
    if(selector==='.photographerPrintModeNav')return printMode?{}:null;
    return null;
   }
  };
 }
 assert.equal(match(element('چاپ',{primary:true})),true);
 assert.equal(match(element('چاپ عکس',{primary:true})),true);
 assert.equal(match(element('چاپ تصاویر',{primary:true})),true);
 assert.equal(match(element('ارسال عکس',{primary:true,href:'/photographer/orders/flow?workspace=print'})),true);
 assert.equal(match(element('چاپ عکس',{printMode:true})),true);
 assert.equal(match(element('صحافی آلبوم',{primary:true})),false);
 assert.equal(match(element('ویدیوی آموزشی',{primary:true})),false);
 assert.equal(match(element('گالری',{primary:true})),false);
 assert(source.includes("u.searchParams.set('pbLabChooser','1')"),'chooser must be forced even when a lab was selected previously');
});

test('R1978 desktop clicking selected Print reopens the chooser; landing keeps native order board',()=>{
 const desktop=read('dist/web/photobridge-r1126-desktop-navigation.js');
 const navSettings=read('dist/web/photobridge-r1099-photographer-tabs.js');
 assert.doesNotThrow(()=>new vm.Script(desktop));
 assert(desktop.includes('/* R1978 reopen Print lab chooser on intentional click */'));
 assert(desktop.includes("if(key==='print'&&panels.has('print'))"));
 assert(desktop.includes("frame.src='/photographer/orders/flow?workspace=print&pbLabChooser=1&pbDesktopContent=1"));
 assert(desktop.includes("if(selected==='print')return"));
 assert(navSettings.includes("location.replace('/photographer/orders')"),'do not break the orders/status header landing');
 assert(!navSettings.includes("location.replace('/photographer/orders/flow"),'the first photographer landing is never the upload-only chooser');
 const html=read('dist/web/index.html');
 assert(html.includes('photobridge-workflow-guides-v572.js?v=r1980'));
 assert(html.includes('r1978=print-photos-tab'));
});
