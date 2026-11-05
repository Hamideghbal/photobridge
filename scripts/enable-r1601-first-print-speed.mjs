import fs from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const {patchDesktop,MARK:DESKTOP_MARK}=require('./r1601-first-print-desktop.cjs');
const {patchLabDirectory,MARK:SERVER_MARK}=require('./r1601-lab-directory-fast.cjs');
const navFile='dist/web/photobridge-r1126-desktop-navigation.js';
const serverFile='dist/api/server.js';
let nav=fs.readFileSync(navFile,'utf8');
nav=patchDesktop(nav);
if(!nav.includes(DESKTOP_MARK))throw Error('R1601 desktop Print warm-up not installed');
fs.writeFileSync(navFile,nav);
execFileSync(process.execPath,['--check',navFile],{stdio:'inherit'});
let server=fs.readFileSync(serverFile,'utf8');
server=patchLabDirectory(server);
if(!server.includes(SERVER_MARK))throw Error('R1601 parallel lab directory not installed');
fs.writeFileSync(serverFile,server);
execFileSync(process.execPath,['--check',serverFile],{stdio:'inherit'});
for(const name of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(name,'utf8');
 if(!html.includes('photobridge-r1126-desktop-navigation.js'))continue;
 html=html.replace(/(photobridge-r1126-desktop-navigation\.js\?[^"'\s]*)/g,
   url=>url.includes('&firstPrint=r1601')?url:url+'&firstPrint=r1601');
 fs.writeFileSync(name,html);
}
console.log('[R1601] first Windows Print iframe warms only after authenticated idle; Lab directory read queries run concurrently');
