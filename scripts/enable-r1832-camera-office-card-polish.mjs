/* R1832: camera-only selected booking card and calendar border alignment. */
import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8'),write=(p,c)=>fs.writeFileSync(p,c);
const path='dist/api/equipment-rental-portal.html';
let html=read(path);
if(!html.includes('pb1830OfficeBookingRangeRuntime'))throw Error('[R1832] R1830 must run before polish');
if(html.includes('pb1832OfficeCardPolishStyle'))throw Error('[R1832] already applied');
const last='</body></html>',at=html.lastIndexOf(last);
if(at<0||html.slice(at+last.length).trim())throw Error('[R1832] final portal closing tag missing');
const css=read('scripts/r1832-camera-office-card-polish.css');
html=html.slice(0,at)+'<style id="pb1832OfficeCardPolishStyle">'+css+'</style>\n'+html.slice(at);
write(path,html);
console.log('[R1832] one camera Office booking outline, aligned actions and equal-width calendar selections');
