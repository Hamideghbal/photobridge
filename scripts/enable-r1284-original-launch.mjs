import fs from 'node:fs';
import sharp from 'sharp';
const base='dist/web/';
// Preserve the actual bridge/aperture artwork. Do not synthesize a new logo.
for(const size of [192,512])await sharp(base+'photobridge-icon-512-v785.png').resize(size,size).png().toFile(base+'photobridge-original-'+size+'-r1284.png');
await sharp(base+'photobridge-icon-512-v785.png').resize(180,180).png().toFile(base+'photobridge-original-touch-r1284.png');
const manifest=JSON.parse(fs.readFileSync(base+'photobridge.webmanifest','utf8'));manifest.background_color='#040e1a';manifest.theme_color='#040e1a';manifest.icons=[192,512].map(size=>({src:'/photobridge-original-'+size+'-r1284.png',sizes:size+'x'+size,type:'image/png',purpose:'any maskable'}));manifest._legacy_splash_icon='/photobridge-original-512-r1284.png';manifest.related_applications=manifest.related_applications.map(app=>({...app,url:app.url?.replace(/\?v=[^&]+/,'?v=r1284')}));fs.writeFileSync(base+'photobridge.webmanifest',JSON.stringify(manifest,null,2)+'\n');
for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html','dist/api/equipment-rental-portal.html']){
 let html=fs.readFileSync(file,'utf8');html=html.replace(/photobridge.webmanifest\?v=[^"']+/g,'photobridge.webmanifest?v=r1284').replace(/photobridge-apple-touch-r(?:1222|1278)\.png/g,'photobridge-original-touch-r1284.png');
 const css='<link rel="stylesheet" href="/photobridge-r1284-mobile-identity.css?v=r1284">';if(!html.includes(css))html=html.replace('</head>',css+'</head>');
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
console.log('[R1284] Original launch artwork restored, web splash removed, mobile identity rows separated.');
