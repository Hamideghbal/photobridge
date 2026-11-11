// R1776: post-build installer for browser login password clearance.
// Always move both tags to the END of head, after R1726/R1727, even when the
// source index.html already contains the assets for manual ZIP deployments.
import fs from 'node:fs';
const css='/photobridge-r1776-login-password-clearance.css?v=r1776';
const js='/photobridge-r1776-login-password-clearance.js?v=r1776';
const cssTag='<link rel="stylesheet" href="'+css+'">';
const jsTag='<script defer src="'+js+'"></script>';
const pages=['dist/web/index.html','dist/web/account-recovery.html','dist/web/lab-login-security.html','dist/api/equipment-rental-register.html','dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html','dist/api/admin-equipment-rental.html'];
for(const path of pages){
 if(!fs.existsSync(path))continue;
 let html=fs.readFileSync(path,'utf8');
 if(!html.trim())continue;
 if(!html.includes('</head>'))throw Error('[R1776] missing head '+path);
 // Idempotent relocation is intentional; later build scripts insert CSS at </head>.
 html=html.replaceAll(cssTag,'').replaceAll(jsTag,'');
 html=html.replace('</head>',cssTag+"\n"+jsTag+"\n"+'</head>');
 if(html.split(css).length!==2||html.split(js).length!==2)throw Error('[R1776] duplicate assets '+path);
 if(path==='dist/web/index.html'&&html.includes('/photobridge-r1726-mobile-login.css')&&html.indexOf(css)<html.indexOf('/photobridge-r1726-mobile-login.css'))
  throw Error('[R1776] old mobile login CSS must load first');
 fs.writeFileSync(path,html);
}
console.log('[R1776] auth password clearance loaded after legacy login styles');
