import fs from 'node:fs';
const pages=['dist/web/index.html','dist/api/equipment-rental-book.html'];
const css='<link rel="stylesheet" href="/photobridge-r1132-photo-copies-mobile.css?v=r1134">';
const modulePattern=/(assets\/index-UIRefine-v655-r84\.js\?v=)[^"']+/g;
const navigationPattern=/(photobridge-r1126-desktop-navigation\.(?:css|js)\?v=)[^&"']+/g;
for(const file of pages){
 let html=fs.readFileSync(file,'utf8');
 html=html.replace(/<link\b[^>]*photobridge-r1132-print-copies-mobile-nav\.css[^>]*>\s*/gi,'');
 const isMain=file.endsWith('/index.html');
 const navMatches=[...html.matchAll(navigationPattern)];
 if(navMatches.length!==2)throw Error('[R1132] Expected photographer desktop boot navigation in '+file);
 html=html.replace(navigationPattern,'$1r1239-photographer-store-and-utility-window-fixes');
 if(isMain){
  if(!modulePattern.test(html))throw Error('[R1132] Missing main photographer bundle');
  modulePattern.lastIndex=0;
  html=html.replace(modulePattern,'$1r1158');
 }
 html=html.replace(/(photobridge-r1124-photographer-desktop-header\.js\?v=)[^"']+/g,'$1r1168');
 html=html.replace(/(photobridge-r1132-photo-copies-mobile\\.css\\?v=)[^"']+/g,'$1r1134');
 if(!html.includes(css))html=html.replace('</head>',css+'\n</head>');
 if(html.split('photobridge-r1132-photo-copies-mobile.css').length!==2)throw Error('[R1132] Responsive sheet must be included once in '+file);
 fs.writeFileSync(file,html);
}
console.log('[R1132] Print-copy and photographer header/mobile assets validated after build');
