// R1553: lab website only — export the live account's authorized API data locally.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const root='dist/web';
for(const name of ['html','css','js']){
 const source='scripts/r1553-lab-web-backup.'+name;
 const dest=root+'/'+(name==='html'?'lab-data-backup.html':'photobridge-lab-web-backup.'+name);
 fs.copyFileSync(source,dest);
 if(name==='js')execFileSync(process.execPath,['--check',dest],{stdio:'inherit'});
}
const file=root+'/assets/index-UIRefine-v655-r84.js';
let source=fs.readFileSync(file,'utf8');
const start=source.indexOf('function Nj('),end=source.indexOf('function ',start+13);
if(start<0||end<start)throw Error('R1553 settings component boundary changed');
let ui=source.slice(start,end);
const once=(from,to,label)=>{if(ui.includes(to))return;if(ui.split(from).length!==2)throw Error('R1553 missing '+label);ui=ui.replace(from,to)};
const allowed=ui.match(/const c=new Set\(\[([^\]]+)\]\)/);
if(!allowed)throw Error('R1553 Lab settings allowlist missing: '+ui.slice(0,350));
if(!allowed[1].includes('"backup"'))ui=ui.replace(allowed[0],'const c=new Set(['+allowed[1]+',"backup"])');
once('["snappbox","اسنپ و ارسال"]','["snappbox","اسنپ و ارسال"],["backup","پشتیبان اطلاعات سایت"]','system navigation');
const site='g==="site"&&e.jsx(PB1296LabSite,{})';
const backup=`g==="site"&&e.jsx(PB1296LabSite,{}),g==="backup"&&e.jsxs("section",{className:"card panel compactPanel",children:[e.jsx("h2",{children:"پشتیبان اطلاعات سایت"}),e.jsx("p",{children:"خروجی اطلاعات مالی و فهرست آرشیو سایت، مستقل از بکاپ محلی برنامه ویندوز"}),e.jsx("a",{href:"/lab-data-backup.html",className:"pbActionButton primaryAction",target:"_blank",rel:"noopener noreferrer",children:"تهیه فایل پشتیبان سایت"})]})`;
once(site,backup,'backup settings page');
if(ui===source.slice(start,end))throw Error('R1553 settings UI did not change');
source=source.slice(0,start)+ui+source.slice(end);
fs.writeFileSync(file,source+'\n/* PB1553 Lab site backup navigation */\n');
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
const htmlFile=root+'/index.html';let html=fs.readFileSync(htmlFile,'utf8');
const pattern=/index-UIRefine-v655-r84\.js\?[^"']+/g,entries=html.match(pattern)||[];
if(entries.length!==1)throw Error('R1553 website JS cache entry missing');
html=html.replace(pattern,url=>url.includes('&webBackup=r1553')?url:url+'&webBackup=r1553');
fs.writeFileSync(htmlFile,html);
console.log('[R1553] Lab website backup data export with stage progress and settings entry');
