import fs from 'node:fs';
import sharp from 'sharp';
const base='dist/web/';
// Package the transparent brand artwork on one exact native-launch color.
async function icon(size,file){const edge=Math.round(size*.76),art=await sharp(base+'photobridge-brand-script-r1285.png').resize(edge,edge,{fit:'contain',background:'#00000000'}).png().toBuffer();await sharp({create:{width:size,height:size,channels:4,background:'#040e1a'}}).composite([{input:art,gravity:'centre'}]).png().toFile(base+file);}
for(const size of [192,512])await icon(size,'photobridge-native-'+size+'-r1286.png');
await icon(180,'photobridge-native-touch-r1286.png');
const manifest=JSON.parse(fs.readFileSync(base+'photobridge.webmanifest','utf8'));manifest.background_color='#040e1a';manifest.theme_color='#040e1a';manifest.icons=[192,512].map(size=>({src:'/photobridge-native-'+size+'-r1286.png',sizes:size+'x'+size,type:'image/png',purpose:'any maskable'}));manifest._legacy_splash_icon='/photobridge-native-512-r1286.png';manifest.related_applications=manifest.related_applications.map(app=>({...app,url:app.url?.replace(/\?v=[^&]+/,'?v=r1286')}));fs.writeFileSync(base+'photobridge.webmanifest',JSON.stringify(manifest,null,2)+'\n');
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html','dist/api/equipment-rental-portal.html']){
 let html=fs.readFileSync(file,'utf8');html=html.replace(/photobridge.webmanifest\?v=[^"']+/g,'photobridge.webmanifest?v=r1286').replace(/(?:photobridge-apple-touch-r(?:1222|1278)|photobridge-original-touch-r1284|photobridge-native-touch-r1285)\.png/g,'photobridge-native-touch-r1286.png');
 html=html.replace(/(photobridge-v904r100f43-store-mobile-header-cleanup\.js|photobridge-v904r100f45-store-identity-alignment\.js|photobridge-v783-polish\.js|photobridge-v904r100f41-header-date-name-fit\.js|photobridge-v877-store-appearance-fix\.js|photobridge-v807-mobile-scroll-store-fix\.js)\?v=[^"']+/g,'$1?v=r1286').replace(/photobridge-r1284-mobile-identity\.css\?v=r\d+/g,'photobridge-r1284-mobile-identity.css?v=r1288');
 html=html.replace(/<link rel="stylesheet" href="\/photobridge-r1284-mobile-identity\.css\?v=[^"]+">/g,'');
 const css='<link rel="stylesheet" href="/photobridge-r1284-mobile-identity.css?v=r1288">';if(!html.includes(css))html=html.replace('</head>',css+'</head>');
 if(file.endsWith('index.html')){
  html=html.replace(/<style id="(?:pb780SplashStyle|pbR1222SplashTheme|pbR1278SplashTheme|pbR1284LaunchStyle)">[\s\S]*?<\/style>/g,'').replace(/<script id="pbR1278EmbeddedBoot">[\s\S]*?<\/script>/g,'');
  html=html.replace(/<div id="pbAppSplashV780"[\s\S]*?<div id="root">/,'<div id="root">');
  html=html.replace(/<script>\(\(\)=>\{const s=document.getElementById\('pbAppSplashV780'\)[\s\S]*?<\/script>/g,'');
  // The browser/OS owns the only splash. Empty document startup shares its navy
  // canvas, without another logo, timer or overlay in the web document.
  const style='<style id="pbR1284LaunchStyle">@media(display-mode:standalone){html:has(#root:empty),html:has(#root:empty) body,html:has(#root>.center:only-child),html:has(#root>.center:only-child) body{background:#040e1a!important}}html.pb780IosStandalone:has(#root:empty),html.pb780IosStandalone:has(#root:empty) body,html.pb780IosStandalone:has(#root>.center:only-child),html.pb780IosStandalone:has(#root>.center:only-child) body{background:#040e1a!important}@media(display-mode:standalone){#root>.center:only-child{background:transparent!important;color:#9fb5ce!important;min-height:100dvh}}html.pb780IosStandalone #root>.center:only-child{background:transparent!important;color:#9fb5ce!important;min-height:100dvh}#pbAppSplashV780{display:none!important}</style>';
  html=html.replace('</head>',style+'</head>');
 }
 fs.writeFileSync(file,html.replace(/^[ \t]+$/gm,''));
}
console.log('[R1286] Flat native branding and stable single-line mobile identity refreshed.');
