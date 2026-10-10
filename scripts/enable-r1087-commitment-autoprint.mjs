// R1087: The shipped rental portal is a prebuilt HTML document. Install this
// narrowly scoped print receiver before building the desktop hot-update copy.
import fs from 'node:fs';
const portal='dist/api/equipment-rental-portal.html';
const receiver='dist/web/photobridge-r1087-commitment-autoprint.js';
const tag='<script defer src="/photobridge-r1087-commitment-autoprint.js?v=r1087"></script>';
if(!fs.existsSync(receiver))throw Error('Missing R1087 desktop print receiver');
let src=fs.readFileSync(portal,'utf8');
if(!src.includes(tag)){
 const index=src.lastIndexOf('</body>');
 if(index<0)throw Error('Rental portal closing body tag not found');
 src=src.slice(0,index)+tag+'\n'+src.slice(index);
 fs.writeFileSync(portal,src,'utf8');
}
if(src.split(tag).length!==2)throw Error('Automatic print receiver must be installed exactly once');
console.log('[PhotoBridge R1087] desktop commitment print receiver installed into web and app portal');
