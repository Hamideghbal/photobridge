import fs from 'node:fs';
import zlib from 'node:zlib';

function replaceOne(source, before, after) {
  if (source.split(before).length !== 2) throw new Error('R2106 missing or duplicate anchor: ' + before.slice(0, 100));
  return source.replace(before, () => after);
}

// Only change the account chooser UI lifecycle. Session cookies, server checks,
// explicit launch selection, password changes, and login/logout are untouched.
export function patchPicker(source) {
  if (source.includes('PB2106 preserve selected workspace')) return source;
  return replaceOne(source, 'function foreground(){', `function foreground(){
   /* PB2106 preserve selected workspace */
   // A file picker, browser focus change or return from another app is not an
   // account-switch action. The normal portal still checks server authentication.
   if(authorized&&!checking&&!chooser&&currentPortal()){
     wasHidden=false;blurred=false;needsResume=false;return;
   }`);
}

export function patchBooking(source) {
  if (source.includes('PB2106 visible booking feedback')) return source;
  source=replaceOne(source, 'if(submit)submit.disabled=true;let out;', `if(submit){submit.disabled=true;submit.setAttribute('aria-busy','true');submit.dataset.pb2106Label=submit.textContent;submit.textContent='در حال ثبت آفیش…'}/* PB2106 visible booking feedback */let out;`);
  source=replaceOne(source, "if(submit)submit.disabled=!$('#rentalRequestConsentV809')?.checked", "if(submit){submit.disabled=!$('#rentalRequestConsentV809')?.checked;submit.removeAttribute('aria-busy');submit.textContent=submit.dataset.pb2106Label||submit.textContent;delete submit.dataset.pb2106Label}");
  // Do not compete with the booking POST using optional foreground poll requests.
  source=replaceOne(source, "function refreshVisibleStoreData(force=false){if(document.hidden", "function refreshVisibleStoreData(force=false){if(pb2100Submitting)return;if(document.hidden");
  return source;
}

function write(path, content) {
  const bytes=Buffer.from(content);
  fs.writeFileSync(path, bytes);
  for(const [ext, compress] of [['.br',zlib.brotliCompressSync],['.gz',zlib.gzipSync]]){
    if(fs.existsSync(path+ext))fs.writeFileSync(path+ext,compress(bytes));
  }
}

export function run(){
  for(const path of ['dist/web/index.html','dist/api/equipment-rental-portal.html','dist/api/equipment-rental-book.html']){
    let html=fs.readFileSync(path,'utf8');
    const pattern=/(<script id="pb1493MobileSessionResume">)([\s\S]*?)(<\/script>)/g;
    if([...html.matchAll(pattern)].length!==1)throw new Error('R2106 picker count: '+path);
    html=html.replace(pattern,(_,start,body,end)=>{const patched=patchPicker(body);new Function(patched);return start+patched+end});
    if(path.endsWith('book.html'))html=patchBooking(html);
    write(path,html);
  }
  console.log('[R2106] selected workspace retained on focus; booking progress and polling isolation');
}
if(process.argv[1]?.endsWith('enable-r2106-workspace-responsiveness.mjs'))run();
