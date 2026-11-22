// R1963: prevent website/home and authenticated panel docks from leaking into app login.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const once=(s,a,b,description)=>{
 const count=s.split(a).length-1;
 if(count!==1)throw Error('[R1963] '+description+' anchor count '+count);
 return s.replace(a,b);
};
const navFile='dist/web/photobridge-public-nav-v625.js';
let nav=fs.readFileSync(navFile,'utf8');
nav=once(nav,"return isPublicRoute(path)||path==='/photographer'||path==='/lab';",
  "return isPublicRoute(path);",'exclude authenticated entry routes from public dock');
fs.writeFileSync(navFile,nav);
const prepaint="<script id=\"pbR1963AuthPrepaint\">(()=>{try{const p=location.pathname,installed=navigator.standalone===true||matchMedia('(display-mode:standalone)').matches||matchMedia('(display-mode:fullscreen)').matches;if(installed&&p==='/'){location.replace('/photographer');return}if(/^\\/(?:photographer(?:\\/login)?|lab|rental)\\/?$/.test(p))document.documentElement.classList.add('pbR1963AuthGate')}catch{}})();</script>";
const assets='<link rel="stylesheet" href="/photobridge-r1963-app-login.css?v=r1963">\n<script defer src="/photobridge-r1963-app-login.js?v=r1963"></script>\n';
for(const file of ['dist/web/index.html','dist/api/equipment-rental-portal.html']){
 let html=fs.readFileSync(file,'utf8');
 html=once(html,'<head>','<head>\n'+prepaint,'early authentication paint '+file);
 html=once(html,'</head>',assets+'</head>','login assets '+file);
 fs.writeFileSync(file,html);
}
fs.writeFileSync('dist/web/photobridge-r1963-app-login.js',fs.readFileSync('scripts/r1963-app-login.js.txt'));
fs.writeFileSync('dist/web/photobridge-r1963-app-login.css',fs.readFileSync('scripts/r1963-app-login.css'));
execFileSync(process.execPath,['--check','dist/web/photobridge-r1963-app-login.js'],{stdio:'inherit'});
execFileSync(process.execPath,['--check',navFile],{stdio:'inherit'});
console.log('[R1963] role login only: no public dock, no stale panel dock, safe standalone role switching');
