import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
function once(source,from,to,label){if(source.split(from).length!==2)throw Error('R1836 missing '+label);return source.replace(from,()=>to)}
const file='dist/web/index.html';
let html=read(file);
if(!html.includes('id="pb1836StartupPrefetch"')){
 // Device-dependent prepaint must see the real mobile viewport from its first instruction.
 const viewport=html.match(/<meta\s+name="viewport"[^>]*>/i)?.[0];
 const charset=html.match(/<meta\s+charset=[^>]*>/i)?.[0];
 if(!viewport||!charset)throw Error('R1836 viewport/charset missing');
 html=html.replace(viewport,'').replace(charset,'');
 const roleTag=html.match(/<script id="pb1493MobileSessionResume">([\s\S]*?)<\/script>/);
 if(!roleTag)throw Error('R1836 mobile role bootstrap missing');
 let role=roleTag[1];
 role=once(role,"document.documentElement.classList.add('pb1493SessionResumePending');", "document.documentElement.classList.add('pb1493SessionResumePending');\n window.__PB1836RoleReady=new Promise(resolve=>{window.__PB1836ResolveRole=resolve});",'role readiness signal');
 role=once(role,"document.documentElement.classList.remove('pb1493SessionResumePending')", "document.documentElement.classList.remove('pb1493SessionResumePending');window.__PB1836ResolveRole?.();window.__PB1836ResolveRole=null",'role completion signal');
 role=once(role,'location.replace(routes[chosen]);return;', 'window.__PB1836RoleHandoff=true;location.replace(routes[chosen]);return;','document handoff');
 new Function(role);
 html=html.replace(roleTag[0],'');
 const early=charset+'\n'+viewport+'\n<script id="pb1493MobileSessionResume">'+role+'</script>\n<script id="pb1836StartupPrefetch">'+read('scripts/r1836-startup-prefetch.js')+'</script>\n<link rel="preload" as="image" href="/photobridge-launch-mark-r1479.png">';
 html=once(html,'<head>','<head>\n'+early,'first mobile instructions');
 const launch=html.match(/<script id="pb1479LaunchBoot">[\s\S]*?<\/script>/)?.[0];
 if(!launch)throw Error('R1836 launch readiness missing');
 html=html.replace(launch,()=>'<script id="pb1479LaunchBoot">'+read('scripts/r1836-launch-ready.js')+'</script>');
 fs.writeFileSync(file,html);
}
const routerFile='dist/web/photobridge-r100f5-entry-routing.js';
let router=read(routerFile);
if(!router.includes('/* R1836 settle mobile role before first entry */')){
 router=once(router,'    let moving=false;\n    try{', `    let moving=false;
    const entryLocation=location.pathname+location.search;
    try{
      /* R1836 settle mobile role before first entry */
      if(window.__PB1836RoleReady)await window.__PB1836RoleReady;
      if(window.__PB1836RoleHandoff||location.pathname+location.search!==entryLocation)return;`, 'role/entry serialization');
 router=once(router,"const r=await fetch('/api/customer/entry-context',{credentials:'include',cache:'no-store'});if(!r.ok)return;", "const early=window.__PB1836EntryRequest;delete window.__PB1836EntryRequest;\n      const r=await(early||fetch('/api/customer/entry-context',{credentials:'include',cache:'no-store'}));if(!r?.ok)return;",'reuse parallel request');
 router=once(router,'      done=true;\n      if(window===window.top', '      if(location.pathname+location.search!==entryLocation||window.__PB1836RoleHandoff)return;\n      done=true;\n      if(window===window.top','stale response cannot replace explicit navigation');
 router=once(router,"document.addEventListener('DOMContentLoaded',()=>setTimeout(route,100),{once:true});else setTimeout(route,100);", "document.addEventListener('DOMContentLoaded',()=>setTimeout(route,0),{once:true});else setTimeout(route,0);",'remove startup delay');
 new Function(router);fs.writeFileSync(routerFile,router);
}
html=read(file).replace(/(photobridge-r100f5-entry-routing\.js\?[^"'\s]*)(["'])/g,(_,url,end)=>url+(url.includes('startup=r1836')?'':'&startup=r1836')+end);
fs.writeFileSync(file,html);
console.log('R1836: viewport-first mobile boot, parallel startup requests, stable role/entry handoff and one splash');
