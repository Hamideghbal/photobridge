// R1727: web-mobile-only login header layout. Leaves auth logic, desktop and native Windows untouched.
import fs from 'node:fs';
const asset='/photobridge-r1727-mobile-login-header.css?v=r1727';
for(const name of ['dist/web/index.html','dist/api/equipment-rental-portal.html']){
  if(!fs.existsSync(name))continue;
  let html=fs.readFileSync(name,'utf8');
  if(!html.trim())continue; // rental portal placeholder in source tree
  if(!html.includes('</head>'))throw Error('[R1727] missing document head in '+name);
  if(!html.includes('/photobridge-r1726-mobile-login.css'))
    throw Error('[R1727] R1726 login CSS must be installed first: '+name);
  if(!html.includes(asset)){
    html=html.replace('</head>','<link rel="stylesheet" href="'+asset+'">\n</head>');
  }
  if(html.split(asset).length!==2)throw Error('[R1727] header CSS must be unique: '+name);
  if(html.indexOf(asset)<html.indexOf('/photobridge-r1726-mobile-login.css'))
    throw Error('[R1727] header CSS must override R1726: '+name);
  fs.writeFileSync(name,html);
}
console.log('[R1727] Mobile login top row: logo, PhotoBridge, Persian title; keyboard behavior unchanged.');
