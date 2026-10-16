import fs from 'node:fs';
const file='dist/web/lab-site-editor.html';fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/lab-site-editor.js\?v=[^"']+/g,'lab-site-editor.js?v=r1270'));
console.log('[R1270] Separate equipment pages and visual page editor refreshed.');
