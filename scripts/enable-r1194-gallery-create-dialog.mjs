import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
// R1194 runs at the very end of the fast production build. The new gallery
// dialog is a body portal and its overlay must stack higher than the fixed
// photographer desktop header (not just be shifted downward).
const css='dist/web/photobridge-r1194-gallery-create-dialog.css';
if(!fs.existsSync(css))throw Error('[R1194] scoped modal CSS missing');
const htmlFile='dist/web/index.html';
let html=fs.readFileSync(htmlFile,'utf8');
const tag='<link rel="stylesheet" href="/photobridge-r1194-gallery-create-dialog.css?v=r1194">';
if(!html.includes(tag)){
 if(html.includes('photobridge-r1194-gallery-create-dialog.css'))throw Error('[R1194] stale or duplicate gallery dialog CSS');
 if(!html.includes('</body>'))throw Error('[R1194] site document body missing');
 html=html.replace('</body>',tag+'\n</body>');
}
fs.writeFileSync(htmlFile,html);
execFileSync(process.execPath,['--test','scripts/test-r1194-gallery-create-dialog.cjs'],{stdio:'inherit'});
