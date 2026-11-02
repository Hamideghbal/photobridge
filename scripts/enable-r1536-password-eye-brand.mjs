import fs from 'node:fs';
// Run after R1535 so all site/registration/reset HTML exists. This does not
// modify authentication, account recovery, credentials, or frozen Windows UI.
const css='/photobridge-r1536-password-eye-brand.css?v=r1536';
const js='/photobridge-r1536-password-eye-brand.js?v=r1536';
for(const file of [
 'dist/web/index.html',
 'dist/web/account-recovery.html',
 'dist/web/lab-login-security.html',
 'dist/api/equipment-rental-register.html',
 'dist/api/equipment-rental-portal.html',
 'dist/api/equipment-rental-book.html',
 'dist/api/admin-equipment-rental.html'
]){
 if(!fs.existsSync(file))continue;
 let html=fs.readFileSync(file,'utf8');
 if(!html.includes(js)){
  if(!html.includes('</head>'))throw Error('R1536 missing head in '+file);
  html=html.replace('</head>',`<link rel="stylesheet" href="${css}"><script defer src="${js}"></script></head>`);
  fs.writeFileSync(file,html);
 }
}
