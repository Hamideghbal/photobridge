// R1714: avoid gateway 502 during HEIC conversion by decoupling upload confirmation.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const one = (source, anchor, replacement, what) => {
    const matches = source.split(anchor).length - 1;
    if (matches !== 1) throw Error('R1714 ' + what + ' anchor count ' + matches);
    return source.replace(anchor, replacement);
};
const apiPath = 'dist/api/server.js';
let api = fs.readFileSync(apiPath, 'utf8');
if (!api.includes('async function pb1712ReadPrintOriginal(')) throw Error('R1714 requires R1713 source read fix');
if (api.includes('function pb1714QueueConversion(')) throw Error('R1714 duplicate server installation');
const convertAnchor = 'async function ensurePrintReadyJpeg(row) {';
api = one(api, convertAnchor, fs.readFileSync('scripts/r1714-async-upload-helper.js.txt', 'utf8') + convertAnchor, 'conversion worker');
const routeAnchor = "        if (req.method === 'POST' && url.pathname === '/api/customer/uploads/complete') {";
api = one(api, routeAnchor, fs.readFileSync('scripts/r1714-upload-status-route.js.txt', 'utf8') + routeAnchor, 'status endpoint');
const routeStart = api.indexOf(routeAnchor);
const routeEnd = api.indexOf("\n    return sendJson(res, 404, { error: 'not_found' });", routeStart);
if (routeStart < 0 || routeEnd < routeStart) throw Error('R1714 customer upload boundary unavailable');
let route = api.slice(routeStart, routeEnd);
const needle = "            const row = q.rows[0];\n            if (String(row.object_key || '').startsWith('local/')) {";
const patch = [
    "            const row = q.rows[0];",
    "            if (row.original_state === 'active') return sendJson(res, 200, { ok: true, state: 'ready' });",
    "            if (row.original_state !== 'pending') return sendJson(res, 409, { error: 'upload_not_pending' });",
    "            // Non-JPEG formats are converted asynchronously after verifying their upload.",
    "            // Never mark them active until the printable JPEG or allowed fallback exists.",
    "            if (!printFileIsJpeg(row)) {",
    "                if (String(row.print_conversion_status || '') === 'failed') {",
    '                    await pool.query("UPDATE order_files SET print_conversion_status=NULL,print_conversion_error=NULL WHERE id=$1 AND original_state=\'pending\'", [row.id]);',
    "                }",
    "                pb1714QueueConversion(row);",
    "                return sendJson(res, 202, { ok: false, processing: true, fileId: row.id });",
    "            }",
    "            if (String(row.object_key || '').startsWith('local/')) {"
].join('\n');
route = one(route, needle, patch, 'fast response for non-JPEG uploads');
api = api.slice(0, routeStart) + route + api.slice(routeEnd);
fs.writeFileSync(apiPath, api);
execFileSync(process.execPath, ['--check', apiPath], { stdio: 'inherit' });

const helper = fs.readFileSync('scripts/r1714-web-upload-helper.js.txt', 'utf8');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
for (const dir of ['dist/web', 'dist/web/lab-desktop-ui']) {
    const bundle = dir + '/assets/index-UIRefine-v655-r84.js';
    let js = fs.readFileSync(bundle, 'utf8');
    js = one(js, 'async function Me(t,a={}){', helper + 'async function Me(t,a={}){', 'browser helper ' + dir);
    js = one(js,
        'await Me("/api/customer/uploads/complete",{method:"POST",body:JSON.stringify({fileId:An.fileId})})',
        'await pb1714AwaitUploadReady(Me,An.fileId,ht.signal)',
        'album upload completion ' + dir);
    js = one(js,
        'await Me("/api/customer/uploads/complete",{method:"POST",body:JSON.stringify({fileId:Gt.fileId})})',
        'await pb1714AwaitUploadReady(Me,Gt.fileId,ue.signal)',
        'print upload completion ' + dir);
    fs.writeFileSync(bundle, js);
    execFileSync(process.execPath, ['--check', bundle], { stdio: 'inherit' });
    const htmlFile = dir + '/index.html';
    let html = fs.readFileSync(htmlFile, 'utf8');
    let number = 0;
    html = html.replace(/index-UIRefine-v655-r84\.js\?[^"'\s]*/g, url => { number++; return url + '&uploadComplete=r1714'; });
    if (number !== 1) throw Error('R1714 HTML cache-bust count ' + dir + ': ' + number);
    fs.writeFileSync(htmlFile, html);
    if (dir.endsWith('lab-desktop-ui')) {
        const manifestFile = dir + '/manifest.json', manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
        for (const name of ['index.html', 'assets/index-UIRefine-v655-r84.js']) {
            const entry = manifest.files.find(item => item.name === name);
            if (!entry) throw Error('R1714 desktop manifest missing ' + name);
            entry.sha256 = hash(fs.readFileSync(dir + '/' + name));
        }
        manifest.build = hash(JSON.stringify(manifest.files));
        manifest.generatedAt = new Date().toISOString();
        fs.writeFileSync(manifestFile, JSON.stringify(manifest));
    }
}
console.log('[R1714] Non-JPEG upload completion runs asynchronously with polling and valid-JPEG gating.');
