// R1963: prevent website/home and authenticated panel docks from leaking into app login.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import zlib from 'node:zlib';
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
// Compression was produced earlier in the build; never serve an older public nav to a Brotli client.
const plain=fs.readFileSync(navFile);
for(const [ext,compress,decompress] of [
 ['.br',bytes=>zlib.brotliCompressSync(bytes,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:5}}),zlib.brotliDecompressSync],
 ['.gz',bytes=>zlib.gzipSync(bytes,{level:6}),zlib.gunzipSync]
]){
 if(!fs.existsSync(navFile+ext))continue;
 fs.writeFileSync(navFile+ext,compress(plain));
 if(!decompress(fs.readFileSync(navFile+ext)).equals(plain))throw Error('[R1963] stale encoded public dock '+ext);
}
const prepaint="<script id=\"pbR1963AuthPrepaint\">(()=>{try{const p=location.pathname,installed=navigator.standalone===true||matchMedia('(display-mode:standalone)').matches||matchMedia('(display-mode:fullscreen)').matches;if(installed&&p==='/'){location.replace('/photographer');return}if(/^\\/(?:photographer(?:\\/login)?|lab|rental)\\/?$/.test(p))document.documentElement.classList.add('pbR1963AuthGate')}catch{}})();</script>";
const assets='<link rel="stylesheet" href="/photobridge-r1963-app-login.css?v=r1963">\n<script defer src="/photobridge-r1963-app-login.js?v=r1963"></script>\n';
for(const file of ['dist/web/index.html','dist/api/equipment-rental-portal.html']){
 let html=fs.readFileSync(file,'utf8');
 const open=html.indexOf('<head>'),close=html.indexOf('</head>',open+6);
 if(open<0||open>1000||close<=open)throw Error('[R1963] no primary HTML head in '+file);
 // Store portal contains additional <head> snippets in inline JS templates.
 // Patch only the actual document head, never scripts' string literals.
 html=html.slice(0,close)+assets+html.slice(close);
 html=html.slice(0,open)+'<head>\n'+prepaint+html.slice(open+6);
 if(file==='dist/web/index.html'){
  const navUrl=/photobridge-public-nav-v625[.]js[?][^"'\\s>]*/g;
  const urls=[...html.matchAll(navUrl)];
  if(urls.length!==1)throw Error('[R1963] public nav URL count '+urls.length);
  html=html.replace(urls[0][0],urls[0][0]+'&authDock=r1963');
 }
 fs.writeFileSync(file,html);
}
fs.writeFileSync('dist/web/photobridge-r1963-app-login.js',fs.readFileSync('scripts/r1963-app-login.js.txt'));
fs.writeFileSync('dist/web/photobridge-r1963-app-login.css',fs.readFileSync('scripts/r1963-app-login.css'));
execFileSync(process.execPath,['--check','dist/web/photobridge-r1963-app-login.js'],{stdio:'inherit'});
execFileSync(process.execPath,['--check',navFile],{stdio:'inherit'});
console.log('[R1963] role login only: no public dock, no stale panel dock, safe standalone role switching');
