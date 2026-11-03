// R1570: make automation control discoverable in Lab print and settings.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const read=p=>fs.readFileSync(p,'utf8');
const write=(p,s)=>fs.writeFileSync(p,s);
const sha=data=>crypto.createHash('sha256').update(data).digest('hex');
const file='photobridge-r1570-automation-entry.js';
const js='dist/web/'+file;
write(js,read('scripts/r1570-automation-entry.js.txt'));
execFileSync(process.execPath,['--check',js],{stdio:'inherit'});
const cssName='photobridge-r1570-automation-entry.css';
const css='dist/web/'+cssName;
write(css,`/* R1570: clear opt-in Lab order automation entry, neutral workspace styling */
.pb1570AutomationEntry{display:inline-flex;align-items:center;justify-content:center;
  flex:0 0 auto;min-height:34px;max-width:100%;padding:5px 13px;box-sizing:border-box;
  border:1px solid #bdd3f1;border-radius:9px;background:#edf4ff;color:#20568e;
  font:700 12px/1.6 Vazirmatn,Tahoma,sans-serif;white-space:nowrap;text-decoration:none!important;
  margin:6px 8px;box-shadow:0 1px 3px rgba(22,78,139,.08)}
.pb1570AutomationEntry:hover,.pb1570AutomationEntry:focus-visible{background:#e0eeff}
.labRoleWorkspace .labRolePageScrollArea>.pb1570AutomationEntry{margin:10px 14px 8px;position:relative}
.labSettingsSectionTabs>.pb1570AutomationEntry{margin-inline:5px}`);
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 if(root.endsWith('lab-desktop-ui')){
  fs.copyFileSync(js,root+'/'+file);
  fs.copyFileSync(css,root+'/'+cssName);
 }
 const htmlPath=root+'/index.html';
 let html=read(htmlPath);
 if(!html.includes('/'+file))html=html.replace('</head>',
   `<script defer src="/${file}?v=r1570"></script>\n</head>`);
 if(!html.includes('/'+cssName))html=html.replace('</head>',
   `<link rel="stylesheet" href="/${cssName}?v=r1570">\n</head>`);
 write(htmlPath,html);
}
const native='dist/web/lab-desktop-ui',manifestFile=native+'/manifest.json',m=JSON.parse(read(manifestFile));
if(m.protocol!==1||m.channel!=='lab')throw Error('R1570 native manifest unexpected');
for(const name of [file,cssName,'index.html']){
 let row=m.files.find(f=>f.name===name);
 if(!row){row={name,url:'/lab-desktop-ui/'+name};m.files.push(row);}
 row.sha256=sha(fs.readFileSync(native+'/'+name));
}
m.files.sort((a,b)=>a.name.localeCompare(b.name,'en'));
m.build=sha(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();
write(manifestFile,JSON.stringify(m));
console.log('[R1570] Lab settings automation entry visible in print orders and settings, both web and Windows UI');
