import fs from 'node:fs';
import path from 'node:path';
import {latestLabChats} from './lab-chat-latest.mjs';
import {softenCss} from './soften-blue-shadows.mjs';
function walk(dir){for(const name of fs.readdirSync(dir)){const file=path.join(dir,name),stat=fs.statSync(file);if(stat.isDirectory())walk(file);else if(file.endsWith('.css')){const before=fs.readFileSync(file,'utf8'),after=softenCss(before);if(after!==before)fs.writeFileSync(file,after)}}}
walk('dist/web');
// Changing this token invalidates cached scroll-controller assets in browser sessions.
const page='dist/web/index.html';
fs.writeFileSync(page,fs.readFileSync(page,'utf8').replace(/(photobridge-r1363-lab-queue\.(?:js|css)\?v=)r1363/g,'$1r1364'));
console.log('R1364: all Lab tab viewports and softer decorative blue shadows.');

const server='dist/api/server.js';fs.writeFileSync(server,latestLabChats(fs.readFileSync(server,'utf8')));
