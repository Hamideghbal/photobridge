import fs from 'node:fs';
const file='dist/web/storefront-management.html';fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/storefront-management.js\?v=[^"']+/g,'storefront-management.js?v=r1274'));
console.log('[R1274] Equipment full-height layout and publication diagnostics refreshed.');
