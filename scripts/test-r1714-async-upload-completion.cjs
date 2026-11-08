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
    const status = api.slice(start - 9000, start);
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
        assert(js.includes('await pb1714AwaitUploadReady(Me,An.fileId,ht.signal,Un.file)'));
        if (js.includes('const PB1588verifyUpload=')) {
            assert(js.includes('complete:(fileId,file)=>pb1714AwaitUploadReady(Me,fileId,ue.signal,file)'));
            assert(js.includes('await PB1588verifyUpload(Gt.fileId,tt.file)'),
                'preserve R1588 serialized completion queue');
            assert(!js.includes('complete:fileId=>Me("/api/customer/uploads/complete"'));
        } else {
            assert(js.includes('await pb1714AwaitUploadReady(Me,Gt.fileId,ue.signal,tt.file)'));
        }
        assert(!js.includes('await Me("/api/customer/uploads/complete",{method:"POST"'));
        assert(fs.readFileSync(dir+'/index.html','utf8').includes('uploadComplete=r1714'));
    }
});

test('R1715 lost gateway reply for JPEG retries same fileId instead of dropping uploaded original', async () => {
    const code = fs.readFileSync('scripts/r1714-web-upload-helper.js.txt', 'utf8');
    const wait = new Function('setTimeout',code+';return pb1714AwaitUploadReady;')(callback => callback());
    let complete = 0, status = 0;
    const id = 'a0da61bb-67ac-4b07-989a-c045a40b3720';
    const result = await wait(async (url, options) => {
        if (url === '/api/customer/uploads/complete') {
            complete++;
            assert.equal(JSON.parse(options.body).fileId, id, 'reconfirm same file ID');
            if (complete === 1) throw Object.assign(new Error('gateway_502'), {status:502});
            return {ok:true, state:'ready'};
        }
        status++;
        throw Object.assign(new Error('not yet confirmed'), {status:409, data:{error:'upload_not_confirmed'}});
    }, id);
    assert.equal(result.state,'ready');
    assert.equal(complete,2);
    assert.equal(status,1);
});
test('R1715 installer recognizes R1588 queued confirmation before legacy print path', () => {
    const source=fs.readFileSync('scripts/enable-r1714-async-upload-completion.mjs','utf8');
    assert(source.includes("js.includes('const PB1588verifyUpload=')"));
    assert(source.includes('complete:(fileId,file)=>pb1714AwaitUploadReady(Me,fileId,ue.signal,file)'));
    assert(source.includes('await PB1588verifyUpload(Gt.fileId,tt.file)'));
});

test('R1716 recovers a verified HEIC file from browser using same file id after S3 GET read failure', async () => {
    const code = fs.readFileSync('scripts/r1714-web-upload-helper.js.txt', 'utf8');
    const wait = new Function('setTimeout',code+';return pb1714AwaitUploadReady;')(done => done());
    const original = {name:'IMG_1004.HEIC',size:305000,type:'image/heic'};
    const id = 'e5d19ccc-67ac-4b07-989a-c045a40b3749';
    let statusCalls=0,directCalls=0;
    const answer=await wait(async (url, options={}) => {
        if(url==='/api/customer/uploads/complete')return {processing:true};
        if(url==='/api/customer/uploads/status/'+id) {
            statusCalls++;
            if(statusCalls===1)throw Object.assign(new Error('read_failed'),{
                status:422,data:{error:'print_jpeg_conversion_failed',phase:'read',recoveryAvailable:true}
            });
            return {ok:true,state:'ready'};
        }
        if(url==='/api/customer/uploads/'+id+'/direct-heic'){
            directCalls++;
            assert.equal(options.method,'PUT');
            assert.equal(options.body,original);
            assert.equal(options.headers['content-type'],'application/octet-stream');
            return {processing:true};
        }
        throw Error('unexpected request '+url);
    }, id, null, original);
    assert.equal(answer.state,'ready');
    assert.equal(directCalls,1,'client retries source only once, never creates a new fileId');
    assert.equal(statusCalls,2);
});

test('R1716 direct HEIC source route is authenticated, bounded and signature checked',()=>{
    const api=fs.readFileSync('dist/api/server.js','utf8');
    const start=api.indexOf('const pb1716DirectHeic = url.pathname.match(');
    const end=api.indexOf("if (req.method === 'POST' && url.pathname === '/api/customer/uploads/complete') {",start);
    assert(start>0&&end>start,'direct route installed before upload completion');
    const source=api.slice(start,end);
    assert(source.includes('customer_id=$3'),'only own customer can recover');
    assert(source.includes("row.original_state !== 'pending'"),'no finalized order mutation');
    assert(source.includes("!/^read:/.test("),'only after storage read failures');
    assert(source.includes('32 * 1024 * 1024'),'size cap enforced');
    assert(source.includes("bytes !== expected"),'source byte-for-byte length check');
    assert(source.includes('pb1712LooksHeic(filePath)'),'verify actual HEIC signature');
    assert(source.includes('pb1716DirectSources.set(fileId'),'recovered source mapped to same id');
});

test('R1716 uses bounded GET attempts and keeps HEIC conversions serialized across instances',()=>{
    const api=fs.readFileSync('dist/api/server.js','utf8');
    const read=api.slice(api.indexOf('async function pb1712ReadPrintOriginal('),api.indexOf('async function pb1712LooksHeic('));
    const worker=api.slice(api.indexOf('const pb1716DirectSources = new Map();'),api.indexOf('async function ensurePrintReadyJpeg(row) {'));
    assert(read.includes('AbortSignal.timeout'),'S3 read deadline');
    assert(read.includes('direct.path'),'recover source without S3 GET');
    assert(worker.includes("'heic-global'"),'one heavy decoder at a time');
    assert(worker.includes("phase + ':'"),'persist source-read phase');
    const queue=fs.readFileSync('scripts/r1588-completion-queue.cjs','utf8');
    assert(queue.includes('complete(fileId, file)'),'keep original File available for direct recovery');
});
