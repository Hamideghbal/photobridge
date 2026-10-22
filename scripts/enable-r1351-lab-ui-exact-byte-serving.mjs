import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Lab Desktop updater verifies each downloaded byte against manifest.files.sha256.
// The website's generic index.html handler injects SEO markup and previously
// transformed /lab-desktop-ui/index.html AFTER the manifest was generated.
// Preserve exact bytes and disable caching of mutable, fixed-name UI assets.
export function patchLabDesktopStaticBytes(root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')){
 const serverFile=path.join(root,'dist/api/server.js');
 let code=fs.readFileSync(serverFile,'utf8');
 const changes=[
  [
   "    let full = path.resolve(WEB_DIR, rel);\n    if (!full.startsWith(WEB_DIR) || !fs.existsSync(full) || fs.statSync(full).isDirectory())",
   "    let full = path.resolve(WEB_DIR, rel);\n    const isLabDesktopUiAsset = /^\\/lab-desktop-ui\\//.test(pathname);\n    if (isLabDesktopUiAsset && (!full.startsWith(WEB_DIR) || !fs.existsSync(full) || !fs.statSync(full).isFile()))\n        return sendText(res, 404, 'Desktop UI asset unavailable.');\n    if (!full.startsWith(WEB_DIR) || !fs.existsSync(full) || fs.statSync(full).isDirectory())"
  ],
  [
   "cacheControl = (isIndex || isRetouchAccount || isBuildMarker) ?",
   "cacheControl = isLabDesktopUiAsset ? 'no-store, max-age=0, must-revalidate' : (isIndex || isRetouchAccount || isBuildMarker) ?"
  ],
  [
   "        const raw = fs.readFileSync(full, 'utf8');",
   "        const raw = fs.readFileSync(full, isLabDesktopUiAsset ? undefined : 'utf8');"
  ],
  [
   "        const html = seoInjectHtml(raw, pathname);\n        res.writeHead(200, { ...common, 'content-length': Buffer.byteLength(html),",
   "        const html = isLabDesktopUiAsset ? raw : seoInjectHtml(raw, pathname);\n        res.writeHead(200, { ...common, 'content-length': Buffer.byteLength(html),"
  ],
  [
   "    if (!String(req.headers.range || '').trim() && String(req.headers['if-none-match'] || '') === etag) {",
   "    if (!isLabDesktopUiAsset && !String(req.headers.range || '').trim() && String(req.headers['if-none-match'] || '') === etag) {"
  ]
 ];
 for(const [before,after]of changes){
  const occurrences=code.split(before).length-1;
  // The script is safe to run twice but must never silently patch a different server shape.
  if(occurrences!==1 && !code.includes(after))throw Error('R1351 expected server static route anchor missing or duplicated: '+before.slice(0,90));
  if(occurrences===1)code=code.replace(before,after);
 }
 if(!code.includes('const isLabDesktopUiAsset')||!code.includes('isLabDesktopUiAsset ? raw : seoInjectHtml(raw, pathname)'))throw Error('R1351 patch not integrated');
 fs.writeFileSync(serverFile,code);
 console.log('[R1351] Lab Desktop UI assets served byte-exact, uncached, and never as HTML fallbacks.');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))patchLabDesktopStaticBytes();
