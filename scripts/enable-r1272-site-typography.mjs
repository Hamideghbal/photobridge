import fs from 'node:fs';
const file='dist/web/lab-site-editor.html';fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/lab-site-editor.js\?v=[^"']+/g,'lab-site-editor.js?v=r1272'));
console.log('[R1272] Site typography controls refreshed.');
