// R1897 — regenerate exactly the Lab stage assets changed AFTER PB_PERF_FIX_V1.
// PB_PERF_FIX_V1 precompresses before R1894 rewrites the UI. Browsers accepting
// br/gzip were receiving the stale, pre-R1894 code despite a successful deploy.
import fs from 'node:fs';
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const asset = 'assets/index-UIRefine-v655-r84.js';
const rev = 'r1949';
const sha = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

function refreshCompression(file) {
  const original = fs.readFileSync(file);
  const outputs = [file];
  for (const [suffix, bytes] of [
    ['.br', () => zlib.brotliCompressSync(original, {
      params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 5 }
    })],
    ['.gz', () => zlib.gzipSync(original, { level: 6 })]
  ]) {
    if (fs.existsSync(file + suffix)) {
      fs.writeFileSync(file + suffix, bytes());
      outputs.push(file + suffix);
    }
  }
  for (const [suffix, decode] of [
    ['.br', zlib.brotliDecompressSync],
    ['.gz', zlib.gunzipSync]
  ]) {
    if (fs.existsSync(file + suffix) && !decode(fs.readFileSync(file + suffix)).equals(original))
      throw Error('R1897 stale encoded asset ' + file + suffix);
  }
  return outputs;
}

for (const root of ['dist/web', 'dist/web/lab-desktop-ui']) {
  const uiFile = root + '/' + asset;
  const htmlFile = root + '/index.html';
  const ui = fs.readFileSync(uiFile, 'utf8');
  if (!ui.includes('/* PB1894 invoice-first server stages */'))
    throw Error('R1897 stage fix missing in ' + root);
  const ready = ui.slice(ui.indexOf('un=async le=>'), ui.indexOf(',Cn=async', ui.indexOf('un=async le=>')));
  const delivered = ui.slice(ui.indexOf('gn=async le=>'), ui.indexOf(',Vn=async', ui.indexOf('gn=async le=>')));
  if (!ready.includes('const pb1894ReadyResult=await It(le,"ready")') ||
      !ready.includes('if(false)') || !delivered.includes('if(false)'))
    throw Error('R1897 server-only Ready/Delivered not installed in ' + root);

  let html = fs.readFileSync(htmlFile, 'utf8');
  const rx = /index-UIRefine-v655-r84\.js\?[^"'\s>]*/g;
  const matches = [...html.matchAll(rx)];
  if (matches.length !== 1) throw Error('R1897 unexpected Lab module references ' + matches.length);
  const oldUrl = matches[0][0];
  const newUrl = oldUrl.replace(/&labStage=r\d+/g, '') + '&labStage=' + rev;
  if (!newUrl.endsWith('labStage=' + rev)) throw Error('R1897 module URL');
  html = html.replace(oldUrl, newUrl);
  fs.writeFileSync(htmlFile, html);

  const changed = [...refreshCompression(uiFile), ...refreshCompression(htmlFile)]
    .map(file => file.slice(root.length + 1));
  if (root.endsWith('/lab-desktop-ui')) {
    const manifestFile = root + '/manifest.json';
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    for (const name of changed) {
      const row = manifest.files.find(record => record.name === name);
      if (row) row.sha256 = sha(fs.readFileSync(root + '/' + name));
    }
    for (const name of [asset, 'index.html']) {
      if (!manifest.files.some(row => row.name === name))
        throw Error('R1897 missing native manifest hash ' + name);
    }
    manifest.build = sha(Buffer.from(JSON.stringify(manifest.files)));
    manifest.generatedAt = new Date().toISOString();
    fs.writeFileSync(manifestFile, JSON.stringify(manifest));
  }
  console.log('[R1897] latest Lab stage UI, br/gzip and unique asset URL verified: ' + root);
}
