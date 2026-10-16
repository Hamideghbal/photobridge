import fs from 'node:fs';
const file='dist/web/index.html';
let html=fs.readFileSync(file,'utf8');
html=html.replace(/(\/assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.replace(/&siteEditor=[^&"']*/g,'')+'&siteEditor=r1267');
if(!html.includes('/lab-site-entry.css?v=r1267'))html=html.replace('</head>','<link rel="stylesheet" href="/lab-site-entry.css?v=r1267">\n</head>');
fs.writeFileSync(file,html);
console.log('[R1267] Laboratory visual editor and main application cache refreshed.');
