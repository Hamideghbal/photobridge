'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),zlib=require('node:zlib');
const root='dist/web/',bundle=root+'assets/index-UIRefine-v655-r84.js';
const read=p=>fs.readFileSync(p,'utf8');
test('R2044 delivered React photo component owns all three direct actions and cancel',()=>{
 const ui=read(bundle),start=ui.indexOf('function ej('),end=ui.indexOf('function vh(',start);
 assert(start>=0&&end>start);const part=ui.slice(start,end);
 assert.equal(part.split('className:"pb2044NativePhotoActions"').length,2);
 assert.doesNotThrow(()=>new vm.Script(part));
 for(const [name,handler] of [['pb2044NativeChoose','onClick:()=>M(!0)'],['pb2044NativeProduct','onClick:()=>pb1793SetStandalone(true)'],['pb2044NativeSend','onClick:qe'],['pb2044NativeCancel','onClick:PB1858cancel']]){
   const pos=part.indexOf('className:"'+name+'"');assert(pos>=0,name);assert(part.slice(pos,pos+180).includes(handler),name+' direct handler');
 }
 assert(part.includes('!pb2044Phone&&e.jsx("div",{className:"simplePrintPilotMobileInlineActions"'));
 assert(part.includes('!pb2044Phone&&!De&&dt'));
 assert(part.includes('document.body):De&&ra.createPortal(dt,De)'));
 assert(part.includes('window===window.top'));
 assert(part.includes('!/Windows/i.test'));
 const patch=new Function(read('scripts/r2044-native-photo-patch.js.txt')+'\nreturn pb2044PatchNativePhoto')();
 assert.equal(patch(ui),ui,'idempotent');
});
test('R2044 final served HTML and precompressed assets deliver the native toolbar',()=>{
 const html=read(root+'index.html');
 assert.match(html,/index-UIRefine-v655-r84\.js\?[^"']*nativePhoto=r2044/);
 assert.match(html,/photobridge-v904r100f41-header-date-name-fit\.js\?[^"']*nativePhoto=r2044/);
 assert.match(html,/index-UIRefine-v655-r84\.js\?[^"']*stablePhoto=r2045/);
 assert.match(html,/photobridge-v783-polish\.js\?[^"']*stablePhoto=r2045/);
 const cssUrl=html.match(/href="([^"]*photobridge-boot-[^"]+\.css)(?:\?[^"]*)?"/);
 const css=cssUrl?root+cssUrl[1].replace(/^\//,''):root+'photobridge-r2036-mobile-photo-composer.css';
 const style=read(css);
 assert(style.includes('pb2044NativePhotoActions[data-pb-photo-revision="R2044"]'));
 assert(style.includes('main.photographerMain:has(.simplePrintPilot)>.photographerRolePageScrollArea'));
 assert(style.includes('.globalModalLayer,.uploadChoiceOverlay'));
 for(const file of [bundle,css,root+'index.html',root+'photobridge-v904r100f41-header-date-name-fit.js']){
   const original=fs.readFileSync(file);
   for(const [suffix,decode] of [['.br',zlib.brotliDecompressSync],['.gz',zlib.gunzipSync]])
     if(fs.existsSync(file+suffix))assert(decode(fs.readFileSync(file+suffix)).equals(original),'stale compressed '+file+suffix);
 }
});

test('R2045 uses the same responsive rule after tab re-entry even if touch or user-agent reporting changes',()=>{
 const ui=read(bundle),a=ui.indexOf('const pb2044IsPhone='),b=ui.indexOf(';const [pb2044Phone',a);
 assert(a>=0&&b>a);
 const detect=(width,ua,frame=false)=>{
  const window={matchMedia:()=>({matches:width})};window.top=frame?{}:window;
  return vm.runInNewContext(ui.slice(a,b)+';pb2044IsPhone()',{window,navigator:{userAgent:ua}});
 };
 for(const ua of ['Android','iPhone','Linux desktop-mode'])assert.equal(detect(true,ua),true);
 assert.equal(detect(false,'Android'),false);
 assert.equal(detect(true,'Windows NT 10.0'),false);
 assert.equal(detect(true,'Android',true),false);
 const header=read(root+'photobridge-v904r100f41-header-date-name-fit.js');
 assert.match(header,/function ensureComposerActions\(\)\{\s*if\(document\.querySelector\("body > \.pb2044NativePhotoActions"\)\).*?return;\}/);
 assert.match(header,/function clearPrint\(\)\{\/\* PB2016 desktop owner \*\/[\s\S]*?if\(pb2042PhotoWorkspace\(\)\)return;\s*pb2036StopPhoto\(\)/);
});

test('R2044 actual portal expression survives tab unmount and remount with fresh React handlers',()=>{
 const ui=read(bundle),a=ui.indexOf('pb2044Phone?ra.createPortal('),tail=':De&&ra.createPortal(dt,De)',b=ui.indexOf(tail,a);
 assert(a>=0&&b>a);const expression=ui.slice(a,b+tail.length);
 const render=new Function('e','ra','document','pb2044Phone','De','dt','W','c','ie','ot','M','pb1793SetStandalone','qe','PB1858cancel','PB1854snapshot','PB1855action','PB1854initError','PB1858retry','return ('+expression+')');
 const node=(type,props)=>({type,props}),body={},slot={},desktopHeader={};
 const e={jsx:node,jsxs:node},ra={createPortal:(tree,target)=>({tree,target})};
 const calls=[];
 const mount=(lab,phone=true,sending=false,count=1,snapshot=null,error=false)=>render(e,ra,{body},phone,slot,desktopHeader,sending,false,false,count,()=>calls.push(lab+':choose'),()=>calls.push(lab+':product'),()=>calls.push(lab+':send'),()=>calls.push(lab+':cancel'),snapshot,false,error,error);
 function buttons(portal){const [header,send,cancel]=portal.tree.props.children;return [...header.props.children,send,cancel].filter(Boolean)}
 const first=mount('first');assert.equal(first.target,body);assert.equal(buttons(first).length,3);buttons(first).forEach(b=>b.props.onClick());
 const second=mount('second');assert.equal(second.target,body);assert.equal(buttons(second).length,3);buttons(second).forEach(b=>b.props.onClick());
 assert.equal(calls.join('|'),'first:choose|first:product|first:send|second:choose|second:product|second:send');
 assert.equal(buttons(mount('empty',true,false,0))[2].props.disabled,true);
 assert.equal(buttons(mount('retry',true,false,0,null,true))[2].props.disabled,false);
 assert.equal(buttons(mount('locked',true,false,1,{orderId:1}))[0].props.disabled,true);
 const busy=buttons(mount('busy',true,true));assert.equal(busy.length,4);assert(busy[2].props.disabled);busy[3].props.onClick();assert.equal(calls.at(-1),'busy:cancel');
 const desktop=mount('desktop',false);assert.equal(desktop.target,slot);assert.equal(desktop.tree,desktopHeader);
});
