import fs from 'node:fs';
const assets='<link rel="stylesheet" href="/photobridge-r1124-photographer-desktop-header.css?v=r1129">\n<script defer src="/photobridge-r1124-photographer-desktop-header.js?v=r1129"></script>\n';
for(const path of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
  let html=fs.readFileSync(path,'utf8');
  if(!html.includes('photobridge-r1124-photographer-desktop-header.css'))html=html.replace('</head>',assets+'</head>');
  html=html.replace(/(photobridge-r1124-photographer-desktop-header\.(?:css|js)\?v=)r112[45678]/g,'$1r1135');
  const boot='<link rel="stylesheet" href="/photobridge-r1126-desktop-navigation.css?v=r1135">\n<script src="/photobridge-r1126-desktop-navigation.js?v=r1135"></script>';
  html=html.replace(/<link rel="stylesheet" href="\/photobridge-r1126-desktop-navigation\.css[^"]*">\s*<script src="\/photobridge-r1126-desktop-navigation\.js[^"]*"><\/script>\s*/g,'');
  // Read media queries after the mobile viewport is configured, before any legacy handlers.
  html=html.replace(/<meta name="viewport"[^>]*>/,match=>match+'\n'+boot);
  html=html.replace('photobridge-r1099-photographer-tabs.js?v=1106','photobridge-r1099-photographer-tabs.js?v=r1129');
  html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?v=)[^"]+/g,'$1r1133');
  if(!html.includes('/photobridge-r1132-photo-copies-mobile.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1132-photo-copies-mobile.css?v=r1135">\n</head>');
  html=html.replace(/<script src="\/photobridge-r1106-mobile-store-panel\.js[^"]*"><\/script>\s*/g,'');
  html=html.replace('</head>','<script src="/photobridge-r1106-mobile-store-panel.js?v=r1135"></script>\n</head>');
  html=html.replace(/(photobridge-r1106-mobile-store-panel\.js\?v=)[^"]+/g,'$1r1135').replace(/(photobridge-r1119-mobile-chat\.css\?v=)[^"]+/g,'$1r1135');
  fs.writeFileSync(path,html);
}
