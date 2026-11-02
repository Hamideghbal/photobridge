import fs from 'node:fs';
import crypto from 'node:crypto';
const file='dist/web/assets/index-UIRefine-v586.css';
const asset='dist/web/assets/photobridge-handover-vazirmatn.woff2';
// Use the existing licensed variable font, including in the native UI snapshot.
if(crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex')!=='4e3fa217d38fdafc1fea4414ceb58ca5e662cf0ab5fa735a8c8c20e8b42cad92')throw Error('R1533 unexpected bundled Vazirmatn font');
let css=fs.readFileSync(file,'utf8');
css=css.replace(/@import\s*(?:url\(\s*)?["']https:\/\/fonts\.googleapis\.com\/[^"']*family=Vazirmatn[^"']*["']\s*\)?\s*;/gi,'');
if(!css.includes('/* PB1533 bundled UI font */'))css='/* PB1533 bundled UI font */\n@font-face{font-family:Vazirmatn;src:url("/assets/photobridge-handover-vazirmatn.woff2") format("woff2");font-style:normal;font-weight:100 900;font-display:swap}\n'+css;
fs.writeFileSync(file,css);
