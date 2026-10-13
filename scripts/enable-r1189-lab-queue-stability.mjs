import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// R1189: stop the REAL queuePageTurn full-page 3D slide, not a header animation.
const cssPath='dist/web/photobridge-r1189-lab-queue-stability.css';
if(!fs.existsSync(cssPath))throw Error('R1189 required browser stylesheet is missing');
const core=fs.readFileSync('dist/web/assets/index-UIRefine-v586.css','utf8');
const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
for(const marker of ['.queuePageTurn.out.forward','pbQueueTurn446OutForward','pbQueueTurn446InBackward','.orderEnterFade']){
 if(!core.includes(marker))throw Error('R1189 base CSS animation anchor missing: '+marker);
}
if(!ui.includes('labOrderScrollArea queuePageTurn'))throw Error('R1189 queue component no longer uses motion class');
const index='dist/web/index.html';
let html=fs.readFileSync(index,'utf8');
const tag='<link rel="stylesheet" href="/photobridge-r1189-lab-queue-stability.css?v=r1189">';
if(!html.includes(tag)){
 if(html.includes('photobridge-r1189-lab-queue-stability.css'))throw Error('R1189 stale stylesheet reference');
 html=html.replace('</head>',tag+'\n</head>');
}
fs.writeFileSync(index,html);
execFileSync(process.execPath,['--test','scripts/test-r1189-lab-queue-stability.cjs'],{stdio:'inherit'});
