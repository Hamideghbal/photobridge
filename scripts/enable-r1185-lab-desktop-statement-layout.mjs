import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/web/index.html';let html=fs.readFileSync(path,'utf8');
const link='<link rel="stylesheet" href="/photobridge-r1185-lab-desktop-statement-layout.css?v=r1185">';
if(!html.includes(link))html=html.replace('</head>',link+'\n</head>');
html=html.replace(/(index-UIRefine-v655-r84\.js\?v=[^"']+)/g,v=>v.includes('statement=r1185')?v:v+'&statement=r1185');
fs.writeFileSync(path,html);
execFileSync(process.execPath,['--test','scripts/test-r1185-lab-desktop-statement-layout.cjs'],{stdio:'inherit'});
