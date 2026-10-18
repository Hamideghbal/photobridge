import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/web/index.html';let html=fs.readFileSync(path,'utf8');
const style='<link rel="stylesheet" href="/photobridge-r1183-lab-image-errors.css?v=r1183">';
if(!html.includes(style))html=html.replace('</head>',style+'\n</head>');
html=html.replace(/(index-UIRefine-v655-r84\.js\?v=[^"']+)/g,v=>v.includes('stream=r1183')?v:v+'&stream=r1183');
// This build is generated from a prebuilt bundle: append the cache marker AFTER R1138 resets its query string.
html=html.replace(/(index-UIRefine-v655-r84\.js\?v=[^"']+)/g,v=>v.includes('labDownload=r1290')?v:v+'&labDownload=r1290');
fs.writeFileSync(path,html);
execFileSync(process.execPath,['--check','dist/api/server.js'],{stdio:'inherit'});
execFileSync(process.execPath,['--check','dist/web/assets/index-UIRefine-v655-r84.js'],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1183-lab-direct-stream.cjs'],{stdio:'inherit'});
