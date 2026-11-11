/* R1774: include the selected physical add-on in every invoice item's
 * presentation labels, including invoices issued before this release.
 * Native Windows PB R1710 PDFs may read sizeLabel + printTypeLabel rather
 * than the web receipt renderer's chassis flag. Read-only decoration avoids
 * touching invoice totals, finance records or old saved PDFs.
 */
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path='dist/api/server.js';
let server=fs.readFileSync(path,'utf8');
const exactlyOnce=(source,needle,next,label)=>{
 const hits=source.split(needle).length-1;
 if(hits!==1)throw Error('[R1774] '+label+' anchor count '+hits);
 return source.replace(needle,next);
};
const helper=String.raw