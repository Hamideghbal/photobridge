// R1729: cache refresh for the corrected mobile password-field clearance.
// The R1726 CSS asset is modified in place, so no additional blocking CSS file
// is requested. Touch only web login HTML, never Windows/native UI assets.
import fs from 'node:fs';
const filename='/photobridge-r1726-mobile-login.css?v=';
for(const path of ['dist/web/index.html','dist/api/equipment-rental-portal.html']){
  if(!fs.existsSync(path))continue;
  let html=fs.readFileSync(path,'utf8');
  if(!html.trim())continue;
  const re=/\/photobridge-r1726-mobile-login\.css\?v=[^"'<>\s]+/g;
  const matches=[...html.matchAll(re)];
  if(matches.length!==1)throw Error('[R1729] expected exactly one mobile login CSS reference in '+path+', got '+matches.length);
  html=html.replace(re,filename+'r1729');
  fs.writeFileSync(path,html);
}
const css=fs.readFileSync('dist/web/photobridge-r1726-mobile-login.css','utf8');
if(!css.includes('/* R1729:')||!css.includes('padding-left:76px!important;'))
 throw Error('[R1729] password button clearance CSS missing');
console.log('[R1729] Mobile login password input reserves space for the Show/Hide button; login shell/keyboard untouched.');
