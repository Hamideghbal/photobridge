import fs from 'node:fs';
const assets='<link rel="stylesheet" href="/photobridge-r1124-photographer-desktop-header.css?v=r1124">\n<script defer src="/photobridge-r1124-photographer-desktop-header.js?v=r1124"></script>\n';
for(const path of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
  let html=fs.readFileSync(path,'utf8');
  if(!html.includes('photobridge-r1124-photographer-desktop-header.css'))html=html.replace('</head>',assets+'</head>');
  fs.writeFileSync(path,html);
}
