import fs from 'node:fs';
// Website only: run after the immutable desktop UI snapshot. Prepare header
// enhancement before the React entry can mount, rather than on DOMContentLoaded.
const script = 'dist/web/photobridge-r1147-lab-admin-header.js';
let js = fs.readFileSync(script, 'utf8');
const oldStart = "if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();";
if (!js.includes('/* PB1532 early header observer */')) {
  if (!js.includes(oldStart) || !js.includes("document.getElementById('root')||document.body") || !js.includes('function schedule(){if(scheduled)return;')) throw Error('R1532 header startup contract changed');
  js = js.replace("document.getElementById('root')||document.body", 'document.documentElement');
  js = js.replace('function schedule(){if(scheduled)return;', "function schedule(){const initial=document.querySelector('.labRoleWorkspace .labSingleHeader:not(.pb1147LabAdminHeader)');if(media.matches&&initial?.querySelector('.settingsIconBtn,.mobileHeaderSettings')){render();return;}if(scheduled)return;");
  js = js.replace(oldStart, '/* PB1532 early header observer */start();');
  fs.writeFileSync(script, js);
}
const file = 'dist/web/index.html';
let html = fs.readFileSync(file, 'utf8');
html = html.replace(/<script\b[^>]*\bsrc=["']\/photobridge-r1147-lab-admin-header\.js[^"']*["'][^>]*><\/script>\s*/g, '');
const entry = /<script\b[^>]*type="module"[^>]*src="\/assets\/index-[^>]+>/;
if (!entry.test(html)) throw Error('R1532 expected React module entry');
html = html.replace(entry, '<script src="/photobridge-r1147-lab-admin-header.js?v=r1532-first-paint" fetchpriority="high"></script>\n$&');
fs.writeFileSync(file, html);
