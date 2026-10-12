import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const file='dist/web/index.html';let html=fs.readFileSync(file,'utf8');const tags='<link rel="stylesheet" href="/photobridge-r1147-lab-admin-header.css?v=r1175"><script defer src="/photobridge-r1147-lab-admin-header.js?v=r1175"></script>';
html=html.replace(/(photobridge-r1147-lab-admin-header\.(?:css|js)\?v=)[^"']+/g,'$1r1175');
// Reload the modified native intake launcher as well as the lab header.
html=html.replace(/(photobridge-r1137-lab-local-intake\.js\?v=)[^"']+/g,'$1r1175');
if(!html.includes('photobridge-r1147-lab-admin-header.css'))html=html.replace('</head>',tags+'\n</head>');fs.writeFileSync(file,html);
// R1172: make the production build exercise the desktop-only lab header regression checks.
execFileSync(process.execPath,['--test','scripts/test-r1172-lab-desktop-header.cjs','scripts/test-r1173-lab-header-store-parity.cjs','scripts/test-r1174-lab-header-queue-layout.cjs','scripts/test-r1175-lab-unique-intake-fade-scroll.cjs'],{stdio:'inherit'});
