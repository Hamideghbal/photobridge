import fs from 'node:fs';
const pages=['dist/web/index.html','dist/api/equipment-rental-book.html'];
const versions=[
 [/((?:\/)?assets\/index-UIRefine-v655-r84\.js\?v=)[^"']+/g,'$1r1132'],
 [/(photobridge-r1126-desktop-navigation\.(?:css|js)\?v=)[^"']+/g,'$1r1132']
];
for(const file of pages){
 let html=fs.readFileSync(file,'utf8');
 for(const [pattern,replacement] of versions){
  if(!pattern.test(html))throw Error('[R1132] Missing expected production asset in '+file+': '+pattern);
  pattern.lastIndex=0;html=html.replace(pattern,replacement);
 }
 if(file.endsWith('/index.html')){
  const css='<link rel="stylesheet" href="/photobridge-r1132-photo-copies-mobile.css?v=r1132">';
  if(!html.includes(css))html=html.replace('</head>',css+'\n</head>');
  if(html.split('photobridge-r1132-photo-copies-mobile.css').length!==2)throw Error('[R1132] Unexpected responsive sheet count');
 }
 fs.writeFileSync(file,html);
}
console.log('[PhotoBridge R1132] photo-copy print payload and header/mobile assets pinned after build');
