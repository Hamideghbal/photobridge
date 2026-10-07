import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

if (process.platform !== 'win32') throw new Error('Build and verify the installer on Windows.');
const desktop = JSON.parse(fs.readFileSync('apps/lab-desktop/package.json', 'utf8'));
const filename = `PhotoBridge-Lab-Setup-${desktop.version}-x64.exe`;
const built = path.resolve('apps/lab-desktop/release', filename);
const target = path.resolve('dist/private-downloads', filename);
const manifestPath = path.resolve('dist/private-downloads/lab-desktop.json');
if (!fs.existsSync(built) || fs.statSync(built).size < 10_000_000)
  throw new Error(`New installer missing: ${built}`);

// A source build is not a trusted release. Validate Authenticode before exposing
// the file through the authenticated download endpoint.
const escaped = built.replaceAll("'", "''");
const signature = execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
  `(Get-AuthenticodeSignature -LiteralPath '${escaped}').Status.ToString()`],
  {encoding:'utf8'}).trim();
if (signature !== 'Valid') throw new Error(`Installer signature is ${signature}; a trusted code-signing certificate is required.`);

const hash = crypto.createHash('sha256');
for await (const block of fs.createReadStream(built)) hash.update(block);
const size = fs.statSync(built).size;
const previous = JSON.parse(fs.readFileSync(manifestPath,'utf8'));
fs.copyFileSync(built, target);
const updated={filename,version:desktop.version,size,sha256:hash.digest('hex')};
fs.writeFileSync(`${manifestPath}.tmp`,JSON.stringify(updated,null,2)+'\n');
fs.renameSync(`${manifestPath}.tmp`,manifestPath);
if (previous.filename !== filename) fs.rmSync(path.resolve('dist/private-downloads',previous.filename),{force:true});
console.log(`Signed desktop installer published: ${filename} (${size} bytes).`);
