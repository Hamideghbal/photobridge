import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const allowed = /\.(html|js|css|png|jpg|jpeg|webp|svg|ico|woff2?|ttf|json)$/i;
const excluded = new Set(['desktop-ui','lab-desktop-ui','downloads']);

// Fail the build if a late website patch was not included in the Windows UI.
// The manifest can be self-consistent yet still reference an old site snapshot.
export function verifyLabDesktopUiFreshness(root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')) {
  const web = path.join(root, 'dist/web');
  const payload = path.join(web, 'lab-desktop-ui');
  const manifest = JSON.parse(fs.readFileSync(path.join(payload, 'manifest.json'), 'utf8'));
  if (manifest.protocol !== 1 || manifest.channel !== 'lab' || !Array.isArray(manifest.files)) throw Error('Invalid laboratory UI manifest');
  if (manifest.build !== sha(Buffer.from(JSON.stringify(manifest.files)))) throw Error('Stale laboratory UI manifest hash');
  const declared = new Map(manifest.files.map(f => [f.name, f]));
  if (declared.size !== manifest.files.length) throw Error('Duplicate laboratory UI manifest path');
  const expected = new Map();
  const walk = (directory, relative='') => {
    for (const ent of fs.readdirSync(directory, {withFileTypes:true})) {
      if (excluded.has(ent.name)) continue;
      const name = path.posix.join(relative, ent.name), full = path.join(directory, ent.name);
      if (ent.isDirectory()) walk(full, name);
      else if (ent.isFile() && allowed.test(name)) {
        if (fs.statSync(full).size <= 20e6) expected.set(name, full);
      }
    }
  };
  walk(web);
  expected.set('desktop-overlay.js', path.join(root, 'apps/lab-desktop/desktop-overlay.js'));
  if (!expected.has('index.html')) throw Error('Website index.html not found');
  if (expected.size !== declared.size) throw Error('Lab desktop payload file count differs from latest website: '+declared.size+' vs '+expected.size);
  for (const [name, full] of expected) {
    const item = declared.get(name);
    if (!item || item.url !== '/lab-desktop-ui/'+name || item.sha256 !== sha(fs.readFileSync(full))) throw Error('Lab desktop payload is older than website file: '+name);
    if (sha(fs.readFileSync(path.join(payload, name))) !== item.sha256) throw Error('Lab desktop payload copy mismatch: '+name);
  }
  console.log('[PhotoBridge] LAB native UI matches final website files:', declared.size, manifest.build.slice(0,12));
  return {files:declared.size, build:manifest.build};
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) verifyLabDesktopUiFreshness();
