import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='dist/web/lab-desktop-ui',bundle='assets/index-UIRefine-v655-r84.js';
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1567 changed anchor: '+a.slice(0,90));return s.replace(a,b)};
const omitted=[
 'photobridge-v792-runtime-fix.js', // public client-gallery only
 'photobridge-v877-store-appearance-fix.js',
 'photobridge-v904r100f45-store-identity-alignment.js',
 'photobridge-r1124-photographer-desktop-header.js',
 'photobridge-r1163-desktop-gallery-header.js',
 'photobridge-r1162-gallery-card-cleanup.js',
 'photobridge-r1109-gallery-guide.js',
 'photobridge-r1293-lab-installer-in-settings.js'
];
let source=fs.readFileSync(root+'/'+bundle,'utf8');
if(!source.includes('/* PB1567 native lightweight workspace */')){
 // Keep the source navigation schema for installed updater compatibility,
 // then omit website-only entries from the rendered native menu.
 source=once(source,'}];E.flatMap(ae=>ae.items);',"}];E[0]={...E[0],items:E[0].items.filter(([key])=>!['site','desktop'].includes(key))};E.flatMap(ae=>ae.items);");
 source=once(source,'function PB1365LabFeature({kind}){','function PB1365LabFeature({kind}){return null;');
 source=once(source,'async function Me(t,a={}){',fs.readFileSync('scripts/r1567-native-request.js.txt','utf8')+'\nasync function pb1567RawMe(t,a={}){');
 source+='\n/* PB1567 native lightweight workspace */\n';fs.writeFileSync(root+'/'+bundle,source);
}
// Idempotent promoted headers: source-state changes still repaint immediately.
for(const name of ['photobridge-r1147-lab-admin-header.js','photobridge-r1372-third-header.js']){
 let s=fs.readFileSync(root+'/'+name,'utf8');
 if(!s.includes('/* PB1567 stable header */')){
 s=s.replaceAll('button.disabled=original.disabled;','if(button.disabled!==original.disabled)button.disabled=original.disabled;');
 s=s.replaceAll("button.setAttribute('aria-selected',String(active));","if(button.getAttribute('aria-selected')!==String(active))button.setAttribute('aria-selected',String(active));");
 s=s.replaceAll("button.setAttribute('aria-pressed',String(active));","if(button.getAttribute('aria-pressed')!==String(active))button.setAttribute('aria-pressed',String(active));");
 s=s.replace('new MutationObserver(schedule)',"new MutationObserver(records=>{if(records.some(record=>{const node=record.target.nodeType===1?record.target:record.target.parentElement;return !node?.closest('.pb1372ThirdHeader,.pb1148SecondaryHeader,.pb1147LabNav,.pb1148LabAvatar,.pb1148Manager')}))schedule()})");
 s+='\n/* PB1567 stable header */\n';fs.writeFileSync(root+'/'+name,s);
 }
}
// Diagnostic status is needed only when a diagnostics dialog is opened.
for(const file of ['apps/lab-desktop/desktop-overlay.js',root+'/desktop-overlay.js']){
 let s=fs.readFileSync(file,'utf8');
 s=s.replace("   const link=element('a','صفحهٔ دانلود برنامهٔ ویندوز لابراتوار',panel);\n   link.href='https://photobridge.ir/lab-windows-download.html';link.target='_blank';link.rel='noopener noreferrer';",'');
 s=s.replace(' void refresh();setInterval(()=>void refresh(),10000);',' // Status is refreshed on demand by openSync/openUpdate, not polled while idle.');fs.writeFileSync(file,s);
}
let html=fs.readFileSync(root+'/index.html','utf8');
const guard="<script>/* PB1567 native website-only routes */(()=>{const redirect=()=>{if(/^\\/lab\\/settings\\/(?:site|desktop|windowsAlert)\\/?$/.test(location.pathname))history.replaceState(null,'','/lab/settings')};redirect();addEventListener('popstate',redirect)})();</script>";
if(!html.includes('PB1567 native website-only routes'))html=html.replace('</head>',guard+'\n</head>');

for(const name of omitted)html=html.replace(new RegExp('<script\\b[^>]*src=["\'][^"\']*'+name.replaceAll('.','\\.')+'(?:\\?[^"\']*)?["\'][^>]*>\\s*</script>','g'),'');
const css='photobridge-r1567-native-performance.css';
fs.writeFileSync(root+'/'+css,`/* Native-only layout work reduction; printing remains fully expanded. */
@media screen {
 .labRoleWorkspace .labOrderCard{content-visibility:auto;contain-intrinsic-size:auto 180px;animation:none!important}
 .labRoleWorkspace .labRolePageScrollArea,.labRoleWorkspace .settingsBody,.labRoleWorkspace .financeWorkspace{animation:none!important}
 .labRoleWorkspace .pb1175HeaderFade{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
}
@media print {.labRoleWorkspace .labOrderCard{content-visibility:visible;contain:none;contain-intrinsic-size:none}}
`);
if(!html.includes(css))html=html.replace('</head>','<link rel="stylesheet" href="/'+css+'?v=r1567">\n</head>');
for(const name of [bundle,'photobridge-r1147-lab-admin-header.js','photobridge-r1372-third-header.js','desktop-overlay.js'])html=html.replace(new RegExp('('+name.split('/').at(-1).replaceAll('.','\\.')+'\\?[^"\']*)','g'),u=>u.includes('&nativePerf=r1567')?u:u+'&nativePerf=r1567');
fs.writeFileSync(root+'/index.html',html);
const manifestFile=root+'/manifest.json',m=JSON.parse(fs.readFileSync(manifestFile,'utf8')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
m.files=m.files.filter(f=>!omitted.includes(f.name));
for(const name of [bundle,'photobridge-r1147-lab-admin-header.js','photobridge-r1372-third-header.js','desktop-overlay.js','index.html',css]){let row=m.files.find(f=>f.name===name);if(!row){row={name,url:'/lab-desktop-ui/'+name};m.files.push(row);}row.sha256=hash(fs.readFileSync(root+'/'+name));}
m.build=hash(JSON.stringify(m.files));m.generatedAt=new Date().toISOString();fs.writeFileSync(manifestFile,JSON.stringify(m));
execFileSync(process.execPath,['--check',root+'/'+bundle],{stdio:'inherit'});
console.log('[R1567] Native-only features, 8 irrelevant scripts omitted, in-flight reads and on-demand diagnostics');
