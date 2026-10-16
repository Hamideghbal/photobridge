import fs from 'node:fs';
const file='dist/web/lab-site-editor.html';fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/(lab-site-editor\.(?:js|css)|equipment-site-editor\.js)\?v=[^"']+/g,'$1?v=r1275'));
console.log('[R1275] Visual text/image positioning refreshed.');
