#!/usr/bin/env node
// R1842: replace R1838's cream branded web splash with the user's blue SVG animation.
// Runs after R1838 / R1839 / R1841 and before CSS compression. Do not replace index.html:
// the existing SPA entry, auth, role resolution, headers and desktop entry must survive.
import fs from 'node:fs';

const web='dist/web/';
const files=[web+'index.html','dist/api/equipment-rental-book.html','dist/api/equipment-rental-portal.html'];
const manifestPath=web+'photobridge.webmanifest';
const markup=fs.readFileSync('scripts/r1842-blue-splash.html','utf8').trim();
const css=fs.readFileSync('scripts/r1842-blue-splash.css','utf8');
const runtime=fs.readFileSync('scripts/r1842-blue-splash.js','utf8');
const blue='#071f47';
const backupDir='.photobridge-splash-r1842-backup';
const previous=new Map();
const assert=(ok,message)=>{if(!ok)throw Error('[R1842] '+message)};
assert((markup.match(/id="pb-splash"/g)||[]).length===1,'only one blue splash template expected');
assert(markup.includes('id="pb-status"')&&markup.includes('id="pb1842-bokeh"'),'missing supplied motion/progress markup');
assert(css.includes('pb1842_pbIris')&&css.includes('pb1842_pbFlash'),'missing supplied iris/flash effects');
assert(runtime.includes('window.PhotoBridgeSplash')&&runtime.includes('__PB1836RoleHandoff'),'missing safe role handoff');
new Function(runtime); // syntax check on the browser script before writing to site
const prepaint='<script id="pb1842SplashPrepaint">(()=>{try{if(window!==window.top)return;const standalone=navigator.standalone===true||matchMedia("(display-mode: standalone)").matches;if(standalone&&matchMedia("(max-width:820px)").matches)document.documentElement.classList.add("pb1842SplashActive")}catch{}})();</script>';
const style='<style id="pb1842BlueSplashStyle">'+css+'</style>';
const bodyScript='<script id="pb1842SplashRuntime">'+runtime+'</script>';
let count=0;
try {
  const m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  assert(m.display==='standalone'&&m.id==='/photobridge-pwa','PWA identity changed unexpectedly');
  previous.set(manifestPath,fs.readFileSync(manifestPath,'utf8'));
  m.background_color=blue;
  m.theme_color=blue;
  // Keep installed app icons unchanged: Android OS launch logo cannot be suppressed by web CSS.
  for(const app of m.related_applications||[])if(app.platform==='webapp'&&app.url)
    app.url=app.url.replace(/\?v=[^&]+/,'?v=r1842');
  const editedManifest=JSON.stringify(m,null,2)+'\n';

  const edited=[];
  for(const file of files){
    if(!fs.existsSync(file))continue;
    let html=fs.readFileSync(file,'utf8');
    if(!html.trim())continue;
    previous.set(file,html);
    if(html.includes('id="pb1842SplashRuntime"')){
      assert((html.match(/id="pb-splash"/g)||[]).length===1,'already-installed splash duplicated');
      edited.push([file,html]);count++;continue;
    }
    const first=html.indexOf('<div id="pbR1361MobileSplash"');
    const root=html.indexOf('<div id="root">',first);
    if(first<0||root<=first){
      // Optional rental route may have its own login HTML and no standalone splash.
      if(file===web+'index.html')throw Error('[R1842] R1838 web splash missing from main entry');
      edited.push([file,html]);continue;
    }
    assert(html.indexOf('<div id="pbR1361MobileSplash"',first+1)<0,'duplicate legacy splash in '+file);
    html=html.slice(0,first)+markup+'\n'+html.slice(root);
    html=html.replace(/<style id="pb1479ApprovedLaunch">[\s\S]*?<\/style>/g,'');
    html=html.replace(/<style id="pbR1361MobileSplashStyle">[\s\S]*?<\/style>/g,'');
    html=html.replace(/<style id="pbR1284LaunchStyle">[\s\S]*?<\/style>/g,'');
    html=html.replace(/<script id="pb1479LaunchBoot">[\s\S]*?<\/script>/g,'');
    html=html.replace(/<style id="pb1478StartupSpacing">[\s\S]*?<\/style>/g,'');
    assert(html.includes('</head>')&&html.includes('<head>'),'missing HTML head in '+file);
    html=html.replace('<head>','<head>\n'+prepaint+'\n'+style+'\n');
    const rootTag='<div id="root"></div>';
    assert(html.includes(rootTag),'main SPA root signature changed: '+file);
    html=html.replace(rootTag,rootTag+'\n'+bodyScript);
    html=html.replace(/photobridge\.webmanifest\?v=[^"'\s<>]+/g,'photobridge.webmanifest?v=r1842');
    assert((html.match(/id="pb-splash"/g)||[]).length===1,'blue splash missing or duplicated in '+file);
    assert((html.match(/id="root"/g)||[]).length===1,'SPA root changed in '+file);
    assert(!html.includes('id="pbR1361MobileSplash"')&&!html.includes('id="pb1479LaunchBoot"'),'old splash still active: '+file);
    assert(html.includes('id="pb1842SplashRuntime"')&&html.includes('id="pb1842SplashPrepaint"'),'new splash boot missing');
    edited.push([file,html]);count++;
  }
  assert(count>=1,'no splash-capable HTML documents transformed');
  fs.mkdirSync(backupDir,{recursive:true});
  for(const [file,old] of previous)
    fs.writeFileSync(backupDir+'/'+file.replaceAll('/','_'),old);
  for(const [file,html] of edited)fs.writeFileSync(file,html);
  fs.writeFileSync(manifestPath,editedManifest);
  console.log('[R1842] replaced '+count+' web splash(es); user blue iris/flash/progress active; PWA background navy, icons and SPA preserved');
}catch(error){
  for(const [file,old] of previous)fs.writeFileSync(file,old);
  console.error('[R1842] aborted; restored originals: '+(error.stack||error));
  process.exitCode=1;
}
