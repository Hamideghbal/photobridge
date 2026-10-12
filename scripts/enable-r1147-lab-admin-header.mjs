import fs from 'node:fs';
const file='dist/web/index.html';let html=fs.readFileSync(file,'utf8');const tags='<link rel="stylesheet" href="/photobridge-r1147-lab-admin-header.css?v=r1148"><script defer src="/photobridge-r1147-lab-admin-header.js?v=r1148"></script>';
html=html.replace(/(photobridge-r1147-lab-admin-header\.(?:css|js)\?v=)[^"']+/g,'$1r1148');
if(!html.includes('photobridge-r1147-lab-admin-header.css'))html=html.replace('</head>',tags+'\n</head>');fs.writeFileSync(file,html);
