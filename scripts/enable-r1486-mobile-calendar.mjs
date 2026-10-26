import fs from 'node:fs';
const root='dist/web/';
fs.copyFileSync('scripts/r1486-calendar.js',root+'photobridge-r1486-calendar.js');fs.copyFileSync('scripts/r1486-mobile-calendar.css',root+'photobridge-r1486-mobile-calendar.css');
let html=fs.readFileSync(root+'index.html','utf8');
html=html.replace(/<script\b[^>]*src="\/photobridge-r1485-calendar\.js[^"\s]*"[^>]*><\/script>\s*/g,'');
const tags='<link rel="stylesheet" href="/photobridge-r1486-mobile-calendar.css?v=r1486">\n<script defer src="/photobridge-r1486-calendar.js?v=r1486"></script>';
if(!html.includes('src="/photobridge-r1486-calendar.js'))html=html.replace('</head>',tags+'\n</head>');fs.writeFileSync(root+'index.html',html);
