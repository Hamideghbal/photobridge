import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// The shared UI is included in the Lab desktop payload. Late build patches
// change a few copied files; refresh manifest hashes only after all patches.
const root = path.resolve('dist/web/lab-desktop-ui');
const manifestPath = path.join(root, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.protocol !== 1 || !Array.isArray(manifest.files)) throw Error('Invalid desktop manifest');
for (const entry of manifest.files) {
  const absolute = path.resolve(root, entry.name);
  if (!absolute.startsWith(root + path.sep) || !fs.statSync(absolute).isFile()) throw Error('Invalid desktop manifest path');
  entry.sha256 = crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex');
}
manifest.build = crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex');
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('[R1328] Updated shared Lab desktop UI manifest checksums after late build patches.');
