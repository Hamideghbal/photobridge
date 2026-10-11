import fs from 'node:fs';
const assets='<link rel="stylesheet" href="/photobridge-r1124-photographer-desktop-header.css?v=r1127">\n<script defer src="/photobridge-r1124-photographer-desktop-header.js?v=r1127"></script>\n';
for(const path of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
  let html=fs.readFileSync(path,'utf8');
  if(!html.includes('photobridge-r1124-photographer-desktop-header.css'))html=html.replace('</head>',assets+'</head>');
  html=html.replace(/(photobridge-r1124-photographer-desktop-header\.(?:css|js)\?v=)r112[456]/g,'$1r1127');
  const boot='<link rel="stylesheet" href="/photobridge-r1126-desktop-navigation.css?v=r1127">\n<script src="/photobridge-r1126-desktop-navigation.js?v=r1127"></script>';
  html=html.replace(/<link rel="stylesheet" href="\/photobridge-r1126-desktop-navigation\.css[^"]*">\s*<script src="\/photobridge-r1126-desktop-navigation\.js[^"]*"><\/script>\s*/g,'');
  // Read media queries after the mobile viewport is configured, before any legacy handlers.
  html=html.replace(/<meta name="viewport"[^>]*>/,match=>match+'\n'+boot);
  html=html.replace('photobridge-r1099-photographer-tabs.js?v=1106','photobridge-r1099-photographer-tabs.js?v=r1127');
  fs.writeFileSync(path,html);
}
