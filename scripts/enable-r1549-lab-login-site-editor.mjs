// Native footer and external browser handoff; no credentials leave the existing sessions.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='dist/web/lab-desktop-ui',bundle='assets/index-UIRefine-v655-r84.js';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
let ui=fs.readFileSync(root+'/'+bundle,'utf8');
const marker='/* PB1549 Lab login and site editor handoff */';
if(!ui.includes(marker)){
 for(const [from,to] of [
  ["href:'/lab/site-editor',children:'ویرایش سایت'", "href:'https://photobridge.ir/lab/settings/site?openSiteEditor=1',title:'ویرایش سایت در مرورگر',children:'ویرایش سایت'"],
  ['e.jsx("a",{href:"/",children:"صفحه اصلی"})','!E&&e.jsx("a",{href:"/",children:"صفحه اصلی"})'],
  ['href:"https://photobridge.ir/lab/site-editor",target:"_blank",rel:"noopener noreferrer",title:"ویرایش سایت در مرورگر"','href:"https://photobridge.ir/lab/settings/site?openSiteEditor=1",title:"ویرایش سایت در مرورگر"']
 ]){
  if(ui.split(from).length!==2)throw Error('R1549 native anchor changed: '+from);
  ui=ui.replace(from,to);
 }
 fs.writeFileSync(root+'/'+bundle,ui+'\n'+marker+'\n');
}
execFileSync(process.execPath,['--check',root+'/'+bundle],{stdio:'inherit'});
const script=fs.readFileSync('scripts/r1549-site-editor-handoff.js.txt','utf8');
fs.writeFileSync('dist/web/photobridge-r1549-site-editor-handoff.js',script);
execFileSync(process.execPath,['--check','dist/web/photobridge-r1549-site-editor-handoff.js'],{stdio:'inherit'});
const tag='<script defer src="/photobridge-r1549-site-editor-handoff.js?v=r1549"></script>';
let html=fs.readFileSync('dist/web/index.html','utf8');
if(!html.includes(tag)){
 if(!html.includes('</body>'))throw Error('R1549 website body missing');
 fs.writeFileSync('dist/web/index.html',html.replace('</body>',tag+'\n</body>'));
}
let nativeHtml=fs.readFileSync(root+'/index.html','utf8');
if(!nativeHtml.includes('&labEntry=r1549'))nativeHtml=nativeHtml.replace('&nativeNavigation=r1548','&nativeNavigation=r1548&labEntry=r1549');
if(!nativeHtml.includes('&labEntry=r1549'))throw Error('R1549 native entry missing');
fs.writeFileSync(root+'/index.html',nativeHtml);
const manifestFile=root+'/manifest.json',manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
for(const name of [bundle,'index.html']){
 const entry=manifest.files.find(row=>row.name===name);
 if(!entry)throw Error('R1549 manifest entry missing: '+name);
 entry.sha256=hash(fs.readFileSync(root+'/'+name));
}
manifest.build=hash(JSON.stringify(manifest.files));manifest.generatedAt=new Date().toISOString();
fs.writeFileSync(manifestFile,JSON.stringify(manifest));
console.log('[PhotoBridge R1549] Lab-only login footer and authenticated browser site-editor handoff',manifest.build.slice(0,12));
