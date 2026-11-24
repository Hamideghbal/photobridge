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
 // R1981: desktop header clones the native controls. Mount guidance in the
 // final visible row, not the transient source which disappears during render.
 assert(guide.includes("secondary.querySelector('.pb1127PrintModes')"),'desktop guide belongs to the final rendered header');
 assert(guide.includes("if(window.self!==window.top)return null"),'embedded desktop iframe cannot own visible tutorials');
 assert(guide.includes("if(!secondary||secondary.hidden)return null"),'never flash guides in hidden secondary header');
 assert(guide.includes("document.querySelectorAll('.photographerPrintWorkspace .photographerPrintModeNav')"),'mobile guidance remains beside native Print/Album tabs');
 assert(guide.includes("function cleanupHeaderButtons()"),'remove detached tutorial copies after React re-render');
 assert(guide.includes("nav.insertBefore(button,target)"),'each guide is beside its own original tab');

 assert(guide.includes("kind==='print'?'mobile':'desktop'")===false,'do not hard-code one video for both devices');
 assert(guide.includes("slots.find(s=>s.kind===kind&&s.device==="),'each guide uses its matching mobile/desktop slot');
 assert(guide.includes("if(arrow.textContent!==direction)"),'no repeated DOM observer loop');
});

test('R1983 model 3: two prominent main tabs and two subtle paired video tutorials',()=>{
 const source=read('dist/web/photobridge-workflow-guides-v572.js');
 assert(source.includes("nav.classList.add('pb1983ModelThree')"),'stable header receives model 3 styling');
 assert(source.includes('pb1983ModelThree > button.photographerPrintPhotoTab'),'Print Photos is a primary button');
 assert(source.includes('pb1983ModelThree > button.photographerPrintAlbumTab'),'Album Binding is a primary button');
 assert(source.includes('pb1983ModelThree > .pb1978VideoGuideButton'),'both video tutorials are secondary');
 assert(source.includes('height:35px!important'),'main buttons taller and more prominent');
 assert(source.includes('height:26px!important'),'video tutorial buttons are smaller');
 assert(source.includes('background:linear-gradient(135deg,#397bff,#2356d8)'),'active primary tab uses blue emphasis');
 assert(source.includes("mount('print',print)")&&source.includes("mount('album',album)"),'each video points to its own mode');
 assert(source.includes('nav.insertBefore(button,target)'),'video buttons are siblings adjacent to native tabs');
 assert(!source.includes('mountChooserGuides'),'lab chooser remains free of tutorial controls');
 const chooser=read('dist/web/photobridge-v904r99-lab-chooser.js');
 assert(chooser.includes("if(el.closest?.('.photographerPrintModeNav')"),'inner Print/Album tabs retain original interactions');
});

test('R1981 only main Print opens Lab chooser; Print Photos and Album remain normal mode tabs',()=>{
 const source=read('dist/web/photobridge-v904r99-lab-chooser.js');
 assert.doesNotThrow(()=>new vm.Script(source));
 const start=source.indexOf('function isPrintPrimaryNav(el){');
 const end=source.indexOf('\n  }',start);
 assert(start>=0&&end>start,'main Print tab matcher must exist');
 const match=new Function('isPhotographerRoute','return ('+source.slice(start,end+4)+');')(()=>true);
 function el(label,{primary=false,printMode=false,href='',mainKey=''}={}){
  return {
   textContent:label,dataset:{mainHref:href,pb1126Kind:mainKey},
   getAttribute:key=>key==='aria-label'?label:key==='href'?href:null,
   matches:selector=>selector.includes('.photographerPrintPhotoTab')&&printMode,
   closest:selector=>{
    if(selector.includes('.labBottomAppNav'))return null;
    if(selector==='.photographerPrintModeNav')return printMode?{}:null;
    if(selector.includes('.photographerHomeModeNav'))return primary?{}:null;
    return null;
   }
  };
 }
 assert.equal(match(el('چاپ',{primary:true})),true,'main Print opens chooser');
 assert.equal(match(el('چاپ',{primary:false})),false,'ordinary non-menu label must not open chooser');
 assert.equal(match(el('چاپ',{primary:true,mainKey:'print'})),true);
 assert.equal(match(el('ارسال عکس',{primary:true,href:'/photographer/orders/flow?workspace=print'})),true);
 assert.equal(match(el('چاپ عکس',{primary:true})),false,'Print Photos is not main Print');
 assert.equal(match(el('چاپ تصاویر',{primary:true})),false);
 assert.equal(match(el('چاپ عکس',{primary:true,href:'/photographer/orders/flow?workspace=print'})),false,'even URL hints must not override mode label');
 assert.equal(match(el('چاپ عکس',{printMode:true})),false,'inner Print Photos mode is handled by React');
 assert.equal(match(el('چاپ',{primary:true,printMode:true})),false,'nested inner mode must never be redirected');
 assert.equal(match(el('صحافی آلبوم',{primary:true})),false);
 assert.equal(match(el('ویدیوی آموزشی',{primary:true})),false);
 assert.equal(match(el('گالری',{primary:true})),false);
 assert(source.includes("el.closest?.('.photographerPrintModeNav,.pb1127PrintModes')"),'capture handler cannot swallow inner mode or tutorial click');
 assert(source.includes("u.searchParams.set('pbLabChooser','1')"),'main Print always opens the explicit lab chooser');
});

test('R1981 guide target survives desktop chrome clone while hidden iframe cannot mount guides',()=>{
 const guide=read('dist/web/photobridge-workflow-guides-v572.js');
 const start=guide.indexOf('function visiblePrintModeNav(){');
 const end=guide.indexOf('\n  }',start);
 assert(start>=0&&end>start,'guide target selector exists');
 // R1982: execute the extracted selector (the old test compared the function object).
 const chooser=new Function('location','window','document','isMobile','return ('+guide.slice(start,end+4)+')();');
 const printButton={};
 const stable={querySelector:sel=>sel==='.photographerPrintPhotoTab'?printButton:null};
 const secondary={hidden:false,querySelector:sel=>sel==='.pb1127PrintModes'?stable:null};
 const header={querySelector:sel=>sel==='.pb1126Secondary'?secondary:null};
 const document={querySelector:sel=>sel==='#pb1126DesktopHeader'?header:null,querySelectorAll:()=>[]};
 const top={}; const context={self:top,top};
 assert.equal(chooser({pathname:'/photographer/orders'},context,document,()=>false),stable,'desktop targets only final chrome row');
 assert.equal(chooser({pathname:'/photographer/orders'},{self:{},top},document,()=>false),null,'hidden iframe does not create tutorial controls');
 secondary.hidden=true;
 assert.equal(chooser({pathname:'/photographer/orders'},context,document,()=>false),null,'loading or chooser state hides tutorial controls without creating extra copies');
 secondary.hidden=false;
 assert.equal(chooser({pathname:'/lab'},context,document,()=>false),null,'other portals are unaffected');
 const mobile={isConnected:true,querySelector:sel=>sel==='.photographerPrintPhotoTab'?printButton:null,getClientRects:()=>[{}]};
 const mobileDoc={querySelectorAll:()=>[mobile]};
 assert.equal(chooser({pathname:'/photographer/orders'},context,mobileDoc,()=>true),mobile,'mobile keeps native tab header');
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
 assert(html.includes('photobridge-workflow-guides-v572.js?v=r1983'));
 assert(html.includes('r1981=main-print-only'));
});
