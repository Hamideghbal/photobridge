'use strict';
const {test} = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');

test('R1714 returns a short 202 for non-JPEG upload before starting conversion', () => {
    const api = fs.readFileSync('dist/api/server.js', 'utf8');
    const start = api.indexOf("if (req.method === 'POST' && url.pathname === '/api/customer/uploads/complete') {");
    const stop = api.indexOf("\n    return sendJson(res, 404, { error: 'not_found' });", start);
    assert(start > 0 && stop > start);
    const route = api.slice(start, stop);
    assert.match(route, /if \(!printFileIsJpeg\(row\)\)/);
    assert(route.indexOf('pb1714QueueConversion(row)') < route.indexOf('await ensurePrintReadyJpeg(row)'));
    assert.match(route, /return sendJson\(res, 202, \{ ok: false, processing: true, fileId: row.id \}\)/);
    assert.match(route, /if \(row.original_state === 'active'\)/);
    assert.match(route, /UPDATE order_files SET original_state='active'/);
    const status = api.slice(start - 2300, start);
    assert(status.includes('const pb1714Status = url.pathname.match('));
    assert.match(status, /file.original_state === 'active'/);
    assert.match(status, /file.original_state !== 'pending'/);
});

test('R1714 worker uses cross-instance advisory lock and activates only after conversion', () => {
    const api = fs.readFileSync('dist/api/server.js', 'utf8');
    const a = api.indexOf('function pb1714QueueConversion('), b = api.indexOf('async function ensurePrintReadyJpeg(row) {', a);
    assert(a > 0 && b > a);
    const code = api.slice(a, b);
    assert.match(code, /pg_try_advisory_lock/);
    assert.match(code, /pg_advisory_unlock/);
    assert.match(code, /const converted = await ensurePrintReadyJpeg\(fresh\)/);
    assert(code.indexOf('const converted = await ensurePrintReadyJpeg(fresh)') < code.indexOf("SET original_state='active'"));
    assert.match(code, /!converted.print_object_key && !printOriginalRasterFallbackAllowed\(fresh\)/);
});

test('R1714 browser polls processing and treats gateway timeouts as unknown, not lost uploads', async () => {
    const code = fs.readFileSync('scripts/r1714-web-upload-helper.js.txt','utf8');
    const create = new Function('setTimeout',code+';return pb1714AwaitUploadReady;');
    const wait = create(callback => callback());
    let pollCount = 0;
    const result = await wait(async (url) => {
        if (url === '/api/customer/uploads/complete') throw Object.assign(new Error('Bad Gateway'), {status:502});
        pollCount++;
        return pollCount < 3 ? {processing:true} : {ok:true, state:'ready'};
    }, 'e4f1c999-cabb-4321-a234-8899c000ee11');
    assert.equal(result.state,'ready');
    assert.equal(pollCount,3);
    for (const dir of ['dist/web','dist/web/lab-desktop-ui']) {
        const js = fs.readFileSync(dir+'/assets/index-UIRefine-v655-r84.js','utf8');
        assert(js.includes('await pb1714AwaitUploadReady(Me,An.fileId,ht.signal)'));
        assert(js.includes('await pb1714AwaitUploadReady(Me,Gt.fileId,ue.signal)'));
        assert(!js.includes('await Me("/api/customer/uploads/complete",{method:"POST"'));
        assert(fs.readFileSync(dir+'/index.html','utf8').includes('uploadComplete=r1714'));
    }
});
