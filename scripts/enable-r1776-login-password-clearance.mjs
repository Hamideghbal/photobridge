// R1776: browser auth pages only. Runs after R1726/1727 and all earlier HTML rewrites.
import fs from 'node:fs';
const css='/photobridge-r1776-login-password-clearance.css?v=r1776';
const js='/photobridge-r1776-login-password-clearance.js?v=r1776';
const pages=['dist/web/index.html','dist/web/account-recovery.html','dist/web/lab-login-security.html','dist/api/equipment-rental-register.html','dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html','dist/api/admin-equipment-rental.html'];
for(const path of pages){
 if(!fs.existsSync(path))continue;
 let html=fs.readFileSync(path,'utf8');
 if(!html.trim())continue;
 if(!html.includes('</head>'))throw Error('[R1776] missing head '+path);
 if(!html.includes(css))html=html.replace('</head>','<link rel="stylesheet" href="'+css+'">\n</head>');
 if(!html.includes(js))html=html.replace('</head>','<script defer src="'+js+'"></script>\n</head>');
 if(html.split(css).length!==2||html.split(js).length!==2)throw Error('[R1776] duplicate assets '+path);
 if(path==='dist/web/index.html'&&html.indexOf(css)<html.indexOf('/photobridge-r1726-mobile-login.css'))throw Error('[R1776] old mobile login CSS must load first');
 fs.writeFileSync(path,html);
}
console.log('[R1776] browser auth password text clearance active');
