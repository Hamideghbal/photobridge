import fs from 'node:fs';
import sharp from 'sharp';
const root='dist/web/',background='#F7F1E7',mark='scripts/r1838-user-symbol.svg';
const meta=await sharp(mark).metadata();
// User-supplied bridge/shutter geometry; the OS renders the app name separately.
for(const size of [180,192,512]){
 const width=Math.round(size*.62),height=Math.round(width*meta.height/meta.width);
 const symbol=await sharp(mark).resize(width,height).png().toBuffer();
 await sharp({create:{width:size,height:size,channels:4,background}}).composite([{input:symbol,left:Math.round((size-width)/2),top:Math.round((size-height)/2)}]).png().toFile(root+`photobridge-app-${size}-r1838.png`);
}
for(const [from,to] of [['playfair-display-latin-700.woff2','playfair-display-latin-700-r1838.woff2'],['montserrat-latin-300.woff2','montserrat-latin-300-r1838.woff2'],['PlayfairDisplay-OFL.txt','PlayfairDisplay-OFL-r1838.txt'],['Montserrat-OFL.txt','Montserrat-OFL-r1838.txt']])fs.copyFileSync('scripts/assets/r1838/'+from,root+'assets/'+to);
const manifestFile=root+'photobridge.webmanifest',manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
manifest.background_color=background;manifest.theme_color=background;
manifest.icons=[192,512].flatMap(size=>['any','maskable'].map(purpose=>({src:`/photobridge-app-${size}-r1838.png`,sizes:`${size}x${size}`,type:'image/png',purpose})));
manifest._legacy_splash_icon='/photobridge-app-512-r1838.png';
for(const app of manifest.related_applications||[])if(app.platform==='webapp'&&app.url)app.url=app.url.replace(/\?v=[^&]+/,'?v=r1838');
fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
for(const file of [root+'index.html','dist/api/equipment-rental-book.html','dist/api/equipment-rental-portal.html']){
 let html=fs.readFileSync(file,'utf8');
 html=html.replace(/photobridge.webmanifest\?v=[^"']+/g,'photobridge.webmanifest?v=r1838').replace(/photobridge-app-180-r\d+\.png/g,'photobridge-app-180-r1838.png');
 const start=html.indexOf('<div id="pbR1361MobileSplash"'),end=html.indexOf('<div id="root">',start);
 if(start>=0&&end>start){
  html=html.slice(0,start)+fs.readFileSync('scripts/r1838-unified-launch.html','utf8').replace('<!-- PB1838_USER_VECTOR -->',()=>fs.readFileSync('scripts/r1838-user-logo.svg','utf8').trim()).trim()+html.slice(end);
  html=html.replace(/<style id="pb1479ApprovedLaunch">[\s\S]*?<\/style>/,()=>'<style id="pb1479ApprovedLaunch">'+fs.readFileSync('scripts/r1838-unified-launch.css','utf8')+'</style>');
  // R1840: R1361 was a static branded *web* placeholder, superseded by the
  // animated R1838 splash. Remove ONLY its obsolete CSS, not its iOS detection
  // script and never the animated pbR1361MobileSplash element.
  html=html.replace(/<style id="pbR1361MobileSplashStyle">[\s\S]*?<\/style>/g,'');
  // R1284/R1359 left a dark/blue empty-root canvas in the document. Keep its
  // non-branded fallback but make it cream, identical to the animated canvas
  // and the OS-managed PWA launch background.
  html=html.replace(/<style id="pbR1284LaunchStyle">[\s\S]*?<\/style>/g,block=>
    block.replace(/#(?:040e1a|2674ff|f8fbff)/gi,background)
         .replace(/#(?:9fb5ce|fff)(?=!important)/gi,'#3B2E24'));
  if(file===root+'index.html'){
    if((html.match(/id="pbR1361MobileSplash"/g)||[]).length!==1 ||
       !html.includes('data-launch="r1838-user"') ||
       !html.includes('id="pb1479ApprovedLaunch"'))
      throw Error('[R1840] animated web splash missing or duplicated');
    if(html.includes('id="pbR1361MobileSplashStyle"'))
      throw Error('[R1840] obsolete static splash CSS remained');
  }
  html=html.replace(/<link rel="preload" as="image" href="\/photobridge-(?:launch-mark-r1479|app-192-r1838)\.png"[^>]*>/g,'<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/playfair-display-latin-700-r1838.woff2">');
  if(!html.includes('const pb1838Theme='))html=html.replace("html.classList.add('pb1479Launching');",()=>"const pb1838Theme=document.querySelector('meta[name=\"theme-color\"]'),pb1838PreviousTheme=pb1838Theme?.getAttribute('content');pb1838Theme?.setAttribute('content','#F7F1E7');html.classList.add('pb1479Launching');");
  const finish="const finish=()=>{if(finished)return;finished=true;observer?.disconnect();clearTimeout(timer);html.classList.remove('pb1479Launching')};";
  if(html.includes(finish))html=html.replace(finish,()=>`const finish=()=>{if(finished)return;finished=true;observer?.disconnect();clearTimeout(timer);if(pb1838PreviousTheme)pb1838Theme?.setAttribute('content',pb1838PreviousTheme);if(!matchMedia('(prefers-reduced-motion: reduce)').matches){html.classList.add('pb1838LaunchLeaving');setTimeout(()=>html.classList.remove('pb1838LaunchLeaving'),190)}html.classList.remove('pb1479Launching')};`);
 }
 fs.writeFileSync(file,html);
}
console.log('R1838: matching native/web launch identity, compact animated loading, accessible readiness transition');
