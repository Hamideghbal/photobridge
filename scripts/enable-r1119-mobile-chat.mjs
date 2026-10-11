import fs from 'node:fs';
for(const path of ['dist/web/index.html','dist/api/equipment-rental-book.html']){let html=fs.readFileSync(path,'utf8');if(!html.includes('/photobridge-r1119-mobile-chat.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1119-mobile-chat.css?v=r1119">\n</head>');fs.writeFileSync(path,html);}
