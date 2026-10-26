import fs from 'node:fs';
const root='dist/web/';
for(const [source,target] of [['scripts/r1482-lab-mobile.js','photobridge-r1482-lab-mobile.js'],['scripts/r1482-lab-mobile.css','photobridge-r1482-lab-mobile.css']])fs.copyFileSync(source,root+target);
let html=fs.readFileSync(root+'index.html','utf8');
html=html.replace(/<link\b[^>]*href="\/photobridge-r1448-lab-phone-nav\.css[^"\s]*"[^>]*>\s*/g,'').replace(/<script\b[^>]*src="\/photobridge-r1448-lab-phone-nav\.js[^"\s]*"[^>]*><\/script>\s*/g,'');
const tags='<link rel="stylesheet" href="/photobridge-r1482-lab-mobile.css?v=r1482">\n<script defer src="/photobridge-r1482-lab-mobile.js?v=r1482"></script>';
if(!html.includes('src="/photobridge-r1482-lab-mobile.js'))html=html.replace('</head>',tags+'\n</head>');
fs.writeFileSync(root+'index.html',html);
