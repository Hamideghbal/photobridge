import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const root='dist/web/',htmlFile=root+'index.html',manifestFile=root+'photobridge.webmanifest';
const navJS='photobridge-r1598-photographer-mobile-invoice-dock.js';
const navCSS='photobridge-r1598-photographer-mobile-invoice-dock.css';
const htmlBefore=fs.readFileSync(htmlFile,'utf8');
if(!htmlBefore.includes('id="pb1493MobileSessionResume"'))throw Error('R1598 mobile session bootstrap missing');
if(!htmlBefore.includes('</head>'))throw Error('R1598 mobile HTML head missing');
for(const [name,source] of [
  [navJS,'scripts/r1598-photographer-mobile-invoice-dock.js'],
  [navCSS,'scripts/r1598-photographer-mobile-invoice-dock.css']
])fs.copyFileSync(source,root+name);
execFileSync(process.execPath,['--check',root+navJS],{stdio:'inherit'});
execFileSync(process.execPath,['--check','scripts/r1493-mobile-session-resume.js'],{stdio:'inherit'});
let html=htmlBefore;
const tags='<link rel="stylesheet" href="/'+navCSS+'?v=r1598">' +
  '\n<script defer src="/'+navJS+'?v=r1598"></script>';
if(!html.includes('/'+navJS+'?'))html=html.replace('</head>',tags+'\n</head>');
fs.writeFileSync(htmlFile,html);
// An installed PWA should start in the neutral application entry point,
// not force /photographer before checking the active portal. Existing installs
// whose start_url remains /photographer are handled by the revised R1493 script.
const m=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
if(m.id!=='/photobridge-pwa')throw Error('R1598 unrecognized PWA manifest');
m.start_url='/';
fs.writeFileSync(manifestFile,JSON.stringify(m,null,2)+'\n');
console.log('[R1598] mobile last-valid-role landing, stable one-row invoice dock; no Lab native changes');