'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');

// R1991: R1989 is the user's approved model 2. These checks preserve R1978
// clickability/device selection without demanding the REMOVED model 3 design.
test('R1978 two labelled video guides remain adjacent to their own Print and Album buttons',()=>{
 const guide=read('dist/web/photobridge-workflow-guides-v572.js');
 assert.doesNotThrow(()=>new vm.Script(guide));
 assert(guide.includes("document.createElement('button')"),'guide controls are actual buttons copied by the desktop chrome');
 assert(guide.includes('pb1978VideoGuideButton'),'both guides have their own stable button class');
 assert(guide.includes('ویدیوی آموزشی'),'tutorial text is visible rather than an icon-only action');
 assert(guide.includes('pb569GuideArrow'),'video play symbol is present');
 assert(guide.includes("mount('print',print)"),'Print tutorial is bound to the Print button');
 assert(guide.includes("mount('album',album)"),'Album tutorial is bound to the Album button');
 // RTL DOM order for the approved model 2: print, print-guide, album, album-guide.
 assert(guide.includes("target.insertAdjacentElement('afterend',button)"),'each tutorial is inserted immediately AFTER its own main tab');
 assert(guide.includes('button.previousElementSibling!==target'),'the adjacency check survives re-renders without unnecessary DOM moves');
 assert(guide.includes('pointGuideIcon(printGuide);pointGuideIcon(albumGuide);'),'both play icons stay visible');
 // Original R1978/R1981 guarantees: no buttons in the lab chooser, only in real headers.
 assert(!guide.includes('function mountChooserGuides()'),'no guide insertion into the lab chooser');
 assert(!guide.includes('pb1978ChooserVideos'),'no synthetic chooser video row');
 assert(!guide.includes('pb1978ChooserPair'),'no tutorial boxes in the chooser');
 assert(guide.includes("secondary.querySelector('.pb1127PrintModes')"),'desktop target is the final rendered chrome');
 assert(guide.includes("if(window.self!==window.top)return null"),'hidden desktop iframe never creates duplicate guides');
 assert(guide.includes("if(!secondary||secondary.hidden)return null"),'do not flash buttons in a hidden header');
 assert(guide.includes("document.querySelectorAll('.photographerPrintWorkspace .photographerPrintModeNav')"),'mobile header retains the same paired guides');
 assert(guide.includes('function cleanupHeaderButtons()'),'detached copies are cleaned after React re-renders');
 assert(guide.includes("window.addEventListener('click',onDelegatedVideoGuideClick,true)"),'capture delegation keeps clone clicks functional');
 assert(guide.includes("slots.find(s=>s.kind===kind&&s.device==="),'guide is specific to print/album and desktop/mobile');
});

test('R1989 approved model 2: single segmented bar, white inactive button, blue active button, no underline',()=>{
 const guide=read('dist/web/photobridge-workflow-guides-v572.js');
 const css=read('dist/web/photobridge-r1989-model2-segmented.css');
 const html=read('dist/web/index.html');
 const desktop=read('dist/web/photobridge-r1126-desktop-navigation.js');
 assert(guide.includes("nav.classList.remove('pb1983ModelThree')"),'obsolete model 3 class is removed');
 assert(guide.includes("nav.classList.contains('pb1989ModelTwo')"),'the stable Print row receives model 2 styling');
 assert(html.includes('photobridge-r1989-model2-segmented.css?v=r1989'),'model 2 stylesheet is included with a cache-busting revision');
 assert(css.includes('.pb1127PrintModes.pb1989ModelTwo'),'model 2 applies to the final desktop header');
 assert(css.includes('.photographerPrintModeNav.pb1989ModelTwo'),'model 2 also applies to mobile');
 assert(css.includes('border-radius:18px!important'),'all four actions share a rounded white outer bar');
 assert(css.includes('gap:0!important'),'segmented controls have no unrelated gap');
 assert(css.includes('background:#fff!important'),'inactive main tab is white');
 assert(css.includes('background:var(--pb1989-blue)!important'),'active main tab is filled blue');
 assert(css.includes('.pb1131MovingIndicator'),'old moving underline is suppressed');
 assert(css.includes('content:none!important'),'the underline pseudo-element is disabled');
 assert(css.includes('.pb1978VideoGuideButton'),'both tutorial buttons have their own subtle styling');
 assert(css.includes('var(--pb1989-guide-bg)'),'tutorials use pale blue-gray, not the main active color');
 assert(desktop.includes("button.classList.toggle('active',selected)"),'desktop reflects selected mode immediately');
 assert(desktop.includes('button.dataset.pb1989Active=String(selected)'),'desktop selection survives clone state handling');
 assert(guide.includes("mount('print',print)")&&guide.includes("mount('album',album)"),'each tutorial is bound to its own main action');
 assert(!guide.includes('mountChooserGuides'),'chooser remains free of tutorial buttons');
 const chooser=read('dist/web/photobridge-v904r99-lab-chooser.js');
 assert(chooser.includes("if(el.closest?.('.photographerPrintModeNav')"),'native Print/Album tabs retain their original interactions');
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
 // R1997 re-enters the already-loaded chooser without reloading the iframe.
 assert(desktop.includes("if(key==='print'){"),'Print retains an explicit navigation branch');
 assert(desktop.includes("const reenter=()=>{if(panel.hidden||selected!=='print'||!frame.isConnected)return;"),'only the visible Print panel can change its chooser');
 assert(desktop.includes("openPrintChooser(doc);schedule();"),'real Print chooser is reopened');
 assert(!desktop.includes('pb1978Refresh'),'repeated Print clicks no longer force full iframe downloads');
 assert(navSettings.includes("location.replace('/photographer/orders')"),'do not break the orders/status header landing');
 assert(!navSettings.includes("location.replace('/photographer/orders/flow"),'the first photographer landing is never the upload-only chooser');
 const html=read('dist/web/index.html');
 // Compare the live HTML asset revision with its Liara build writer, rather
 // than pinning r1983 forever and rejecting every later cache-busted release.
 const writer=read('scripts/enable-r1966-desktop-calendar-store-chooser.mjs');
 const pinned=writer.match(/'photobridge-workflow-guides-v572[.]js','v','(r[0-9]+)'/);
 assert(pinned,'Liara writer pins the video guide cache revision');
 assert(html.includes('photobridge-workflow-guides-v572.js?v='+pinned[1]),'HTML and Liara writer use the same fresh video revision');
 assert(html.includes('r1981=main-print-only'));
});
