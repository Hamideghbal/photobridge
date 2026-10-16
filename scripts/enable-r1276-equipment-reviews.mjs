import fs from 'node:fs';
const file='dist/web/lab-site-editor.html';fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/(lab-site-editor\.(?:js|css))\?v=[^"']+/g,'$1?v=r1276'));
console.log('[R1276] FAQ icon, compact equipment typography and moderated reviews refreshed.');
