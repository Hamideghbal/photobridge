import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{patchOrderLive}=require('./r1520-live-order-patch.cjs'),{patchLiveStatus}=require('./r1520-live-status.cjs');
const ui='dist/web/assets/index-UIRefine-v655-r84.js',server='dist/api/server.js';
fs.writeFileSync(ui,patchOrderLive(fs.readFileSync(ui,'utf8')));
fs.writeFileSync(server,patchLiveStatus(fs.readFileSync(server,'utf8')));
const index='dist/web/index.html';let html=fs.readFileSync(index,'utf8');html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&liveStatus=r1520')?url:url+'&liveStatus=r1520');fs.writeFileSync(index,html);
