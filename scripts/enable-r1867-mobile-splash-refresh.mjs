// R1867: the dark launch shown before our cream animated splash is generated
// by Android's installed PWA/WebAPK from an OLD manifest, before site JS runs.
// Do not add another overlay or disable standalone/install support.
// Refresh manifest-triggering fields and icon URLs so Android can update the
// system splash to the SAME cream artwork as the one animated web splash.
import fs from 'node:fs';

const root='dist/web/';
const manifestFile=root+'photobridge.webmanifest';
const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
const oldCream='#F7F1E7';
const refreshedCream='#F7F1E6'; // imperceptible change triggers Android WebAPK update
if(manifest.id!=='/photobridge-pwa'||manifest.display!=='standalone')
 throw Error('[R1867] refuse to change PWA identity/display');
if(manifest.background_color!==oldCream||manifest.theme_color!==oldCream)
 throw Error('[R1867] expected the R1838 cream splash; abort if changed');
if(!Array.isArray(manifest.icons)||!manifest.icons.length||
 manifest.icons.some(icon=>!/^\/photobridge-app-(192|512)-r1838\.png$/.test(icon.src)))
 throw Error('[R1867] expected approved R1838 bridge/shutter icon assets');

// Copy exact approved icon pixels under fresh names. Chrome for Android
// detects changed icon URLs and refreshes its cached WebAPK splash assets.
for(const size of [192,512]){
 const oldPath=root+'photobridge-app-'+size+'-r1838.png';
 const newPath=root+'photobridge-app-'+size+'-r1867.png';
 if(!fs.existsSync(oldPath))throw Error('[R1867] approved source icon missing: '+oldPath);
 fs.copyFileSync(oldPath,newPath);
}
manifest.icons=manifest.icons.map(icon=>({
 ...icon,
 src:icon.src.replace('-r1838.png','-r1867.png')
}));
manifest.background_color=refreshedCream;
manifest.theme_color=refreshedCream;
manifest._legacy_splash_icon='/photobridge-app-512-r1867.png';
for(const app of manifest.related_applications||[])
 if(app.platform==='webapp'&&app.url)
  app.url=app.url.replace(/photobridge\.webmanifest\?v=[^&]+/,'photobridge.webmanifest?v=r1867');
fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');

const pages=[root+'index.html','dist/api/equipment-rental-book.html','dist/api/equipment-rental-portal.html'];
let mainUpdated=false;
for(const file of pages){
 if(!fs.existsSync(file))continue;
 let html=fs.readFileSync(file,'utf8');
 if(!html.includes('photobridge.webmanifest?v=r1838')){
  if(file===root+'index.html')throw Error('[R1867] main page manifest link missing');
  continue;
 }
 if(file===root+'index.html'){
  if((html.match(/id="pbR1361MobileSplash"/g)||[]).length!==1||
     !html.includes('data-launch="r1838-user"')||
     html.includes('id="pb1842SplashRuntime"')||
     html.includes('id="pb-splash"'))
   throw Error('[R1867] unexpected extra web splash or missing approved animation');
  mainUpdated=true;
 }
 html=html.replace(/photobridge\.webmanifest\?v=r1838/g,'photobridge.webmanifest?v=r1867');
 fs.writeFileSync(file,html);
}
if(!mainUpdated)throw Error('[R1867] main manifest was not refreshed');
console.log('[R1867] preserved the single cream animated web splash; refreshed Android/WebAPK OS launch to cream');
