// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import sharp from 'sharp';
// This worker is intentionally low-retention: libvips/Sharp must not keep decoded
// group-photo tiles around between ONNX passes.
sharp.cache({ memory: 0, files: 0, items: 0 });
sharp.concurrency(1);
const MODEL_CACHE = path.resolve(String(process.env.FACE_MODEL_CACHE_DIR || path.join(os.tmpdir(), 'photobridge-face-models')));
const MODEL_FILE = 'yolov12n-face.onnx';
const MODEL_URLS = Array.from(new Set([
    String(process.env.FACE_YOLO_MODEL_URL || '').trim(),
    'https://huggingface.co/kiwidata/face_models/resolve/main/yolov12n-face.onnx?download=true',
    'https://github.com/YapaLab/yolo-face/releases/download/1.0.0/yolov12n-face.onnx'
].filter(Boolean)));
const BUNDLED_MODEL_CANDIDATES = [
    String(process.env.FACE_YOLO_MODEL_PATH || '').trim(),
    path.resolve(process.cwd(), 'models', MODEL_FILE),
    path.resolve(process.cwd(), 'dist', 'api', 'models', MODEL_FILE),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), 'models', MODEL_FILE)
].filter(Boolean);
// v0.17.565 group-face recall patch: the upstream YOLO export can score distant
// faces below the old .20 gate, especially after a photographer's upload has
// been compressed. Keep the model threshold low and let the group selection
// screen expose the candidates for user confirmation.
const THRESHOLD = Number(process.env.FACE_YOLO_THRESHOLD || .08);
const TILED = String(process.env.FACE_YOLO_TILED || '1') !== '0';
const TILE_TRIGGER = Math.max(480, Number(process.env.FACE_YOLO_TILE_TRIGGER_PX || 640) || 640);
const ONNX_THREADS = Math.max(1, Math.min(2, Number(process.env.FACE_ONNX_THREADS || 2) || 2));
// v0.17.196: RSS is guarded together with cgroup headroom. A higher worker-only
// ceiling is safe because the cgroup guard still stops us before container OOM.
const MAX_RSS_MB = Math.max(256, Number(process.env.FACE_DETECTOR_WORKER_MAX_RSS_MB || 520) || 520);
const MAX_RSS_OVER_BASELINE_MB = Math.max(96, Number(process.env.FACE_DETECTOR_WORKER_MAX_RSS_OVER_BASELINE_MB || 260) || 260);
const CGROUP_MAX_PCT = Math.max(.60, Math.min(.94, Number(process.env.FACE_DETECTOR_CGROUP_MAX_PCT || .94) || .94));
const CGROUP_PRESSURE_PCT = Math.max(.60, Math.min(CGROUP_MAX_PCT - .01, Number(process.env.FACE_DETECTOR_CGROUP_PRESSURE_PCT || .86) || .86));
const MODEL_DOWNLOAD_TIMEOUT_MS = Math.max(12_000, Math.min(45_000, Number(process.env.FACE_MODEL_DOWNLOAD_TIMEOUT_MS || 28_000) || 28_000));
let session = null, ort = null, modelInfo = null, busy = false, baselineRssMb = 0;
const rssMb = () => Math.round(process.memoryUsage().rss / 1024 / 1024);
const send = (m) => { try {
    process.send?.(m);
}
catch { } };
const sleepImmediate = () => new Promise(resolve => setImmediate(resolve));
function orientedDims(meta) { const swap = [5, 6, 7, 8].includes(Number(meta?.orientation || 1)); return { width: swap ? Number(meta?.height || 0) : Number(meta?.width || 0), height: swap ? Number(meta?.width || 0) : Number(meta?.height || 0) }; }
function iou(a, b) { const ax2 = a.x + a.w, ay2 = a.y + a.h, bx2 = b.x + b.w, by2 = b.y + b.h, ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a.x, b.x)), iy = Math.max(0, Math.min(ay2, by2) - Math.max(a.y, b.y)), inter = ix * iy, uni = a.w * a.h + b.w * b.h - inter; return uni > 0 ? inter / uni : 0; }
function nms(items, threshold = .4, max = 64) { const out = []; for (const b of [...items].sort((a, b) => Number(b.score || 0) - Number(a.score || 0))) {
    if (out.some(q => iou(b, q) > threshold))
        continue;
    out.push(b);
    if (out.length >= max)
        break;
} return out; }
function toNorm(items, W, H, maxFaces = 8) { return nms(items, .42, 96).filter(b => b.w >= 1.5 && b.h >= 1.5 && b.x < W && b.y < H && b.x + b.w > 0 && b.y + b.h > 0).slice(0, Math.max(1, Math.min(32, maxFaces))).map((b, i) => { const x = Math.max(0, b.x), y = Math.max(0, b.y), w = Math.min(W - x, b.w), h = Math.min(H - y, b.h); return { x: Number((x / W * 1000).toFixed(2)), y: Number((y / H * 1000).toFixed(2)), w: Number((w / W * 1000).toFixed(2)), h: Number((h / H * 1000).toFixed(2)), score: Number(Number(b.score || 0).toFixed(4)), validationScore: Number(Number(b.score || 0).toFixed(4)), rank: i + 1 }; }); }
function readNumberFile(p) { try {
    const v = String(fs.readFileSync(p, 'utf8')).trim();
    if (!v || v === 'max')
        return null;
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
}
catch {
    return null;
} }
function readMemoryStat() {
    for (const p of ['/sys/fs/cgroup/memory.stat', '/sys/fs/cgroup/memory/memory.stat']) {
        try {
            const out = {};
            for (const line of String(fs.readFileSync(p, 'utf8')).split(/\n+/)) {
                const [k, v] = line.trim().split(/\s+/);
                const n = Number(v);
                if (k && Number.isFinite(n))
                    out[k] = n;
            }
            return out;
        }
        catch { }
    }
    return {};
}
function cgroupMemory() {
    let limit = readNumberFile('/sys/fs/cgroup/memory.max'), used = readNumberFile('/sys/fs/cgroup/memory.current');
    if (limit == null || used == null) {
        limit = readNumberFile('/sys/fs/cgroup/memory/memory.limit_in_bytes');
        used = readNumberFile('/sys/fs/cgroup/memory/memory.usage_in_bytes');
    }
    // memory.current includes reclaimable Linux file/page cache. Repeated photo selections
    // can grow inactive_file even after the disposable detector process exits. Guarding
    // against raw memory.current therefore produces false OOMs after a few good runs.
    // Use inactive_file as reclaimable cache and guard the effective working set instead.
    const stat = readMemoryStat(), reclaimable = Math.max(0, Number(stat.inactive_file || stat.total_inactive_file || 0)), effective = used == null ? null : Math.max(0, used - reclaimable);
    if (limit != null && limit > 1024 * 1024 * 1024 * 1024)
        limit = null;
    return { usedMb: used == null ? null : Math.round(used / 1024 / 1024), reclaimableMb: Math.round(reclaimable / 1024 / 1024), effectiveUsedMb: effective == null ? null : Math.round(effective / 1024 / 1024), limitMb: limit == null ? null : Math.round(limit / 1024 / 1024), pct: used != null && limit != null && limit > 0 ? used / limit : null, effectivePct: effective != null && limit != null && limit > 0 ? effective / limit : null };
}
function memorySnapshot() { const p = process.memoryUsage(), cg = cgroupMemory(); return { rssMb: Math.round(p.rss / 1024 / 1024), heapUsedMb: Math.round(p.heapUsed / 1024 / 1024), externalMb: Math.round(p.external / 1024 / 1024), arrayBuffersMb: Math.round(p.arrayBuffers / 1024 / 1024), baselineRssMb, cgroupUsedMb: cg.usedMb, cgroupReclaimableMb: cg.reclaimableMb, cgroupEffectiveUsedMb: cg.effectiveUsedMb, cgroupLimitMb: cg.limitMb, cgroupPct: cg.pct == null ? null : Number((cg.pct * 100).toFixed(1)), cgroupEffectivePct: cg.effectivePct == null ? null : Number((cg.effectivePct * 100).toFixed(1)) }; }
function memoryGuardReason() {
    const r = rssMb(), dynamicCeiling = baselineRssMb ? Math.min(MAX_RSS_MB, baselineRssMb + MAX_RSS_OVER_BASELINE_MB) : MAX_RSS_MB, cg = cgroupMemory();
    if (cg.effectivePct != null && cg.effectivePct > CGROUP_MAX_PCT)
        return { code: `face_detector_memory_guard_cgroup:${Math.round(cg.effectivePct * 100)}pct`, rssMb: r, maxRssMb: dynamicCeiling, cgroupUsedMb: cg.usedMb, cgroupReclaimableMb: cg.reclaimableMb, cgroupEffectiveUsedMb: cg.effectiveUsedMb, cgroupLimitMb: cg.limitMb };
    if (r > dynamicCeiling)
        return { code: `face_detector_memory_guard:${r}mb`, rssMb: r, maxRssMb: dynamicCeiling, cgroupUsedMb: cg.usedMb, cgroupReclaimableMb: cg.reclaimableMb, cgroupEffectiveUsedMb: cg.effectiveUsedMb, cgroupLimitMb: cg.limitMb };
    return null;
}
async function compactMemory() { try {
    global.gc?.();
}
catch { } ; await sleepImmediate(); }
async function ensureModel() {
    // Prefer a model shipped with the app (or mounted by env) so production never
    // depends on a GitHub download. This also supports future one-file deployment.
    for (const candidate of BUNDLED_MODEL_CANDIDATES) {
        try {
            const st = fs.statSync(candidate);
            if (st.size > 250_000)
                return { path: candidate, cached: true, bundled: true, bytes: st.size, source: 'local' };
        }
        catch { }
    }
    const target = path.join(MODEL_CACHE, MODEL_FILE);
    try {
        const st = fs.statSync(target);
        if (st.size > 250_000)
            return { path: target, cached: true, bundled: false, bytes: st.size, source: 'cache' };
    }
    catch { }
    fs.mkdirSync(MODEL_CACHE, { recursive: true });
    const failures = [];
    for (const modelUrl of MODEL_URLS) {
        const tmp = `${target}.${process.pid}.${Date.now()}.part`, controller = new AbortController(), timer = setTimeout(() => controller.abort(), MODEL_DOWNLOAD_TIMEOUT_MS);
        try {
            const r = await fetch(modelUrl, { signal: controller.signal, redirect: 'follow', headers: { 'user-agent': 'PhotoBridge-FaceDetector/0.17.549' } });
            if (!r.ok)
                throw new Error(`model_download_http_${r.status}`);
            if (!r.body)
                throw new Error('model_download_empty_body');
            await pipeline(Readable.fromWeb(r.body), fs.createWriteStream(tmp));
            const st = fs.statSync(tmp);
            if (st.size < 250_000)
                throw new Error('model_download_too_small');
            try {
                fs.renameSync(tmp, target);
            }
            catch (e) {
                if (!fs.existsSync(target))
                    throw e;
                try { fs.unlinkSync(tmp); } catch { }
            }
            const done = fs.statSync(target);
            return { path: target, cached: false, bundled: false, bytes: done.size, source: modelUrl.includes('huggingface.co') ? 'huggingface' : 'github' };
        }
        catch (e) {
            failures.push(`${modelUrl.includes('huggingface.co') ? 'hf' : 'gh'}:${String(e?.name === 'AbortError' ? 'timeout' : e?.message || e)}`);
        }
        finally {
            clearTimeout(timer);
            try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch { }
        }
    }
    throw new Error(`face_model_unavailable:${failures.join('|').slice(0, 320)}`);
}
function disposeTensor(t) { try {
    if (t && typeof t.dispose === 'function')
        t.dispose();
}
catch { } }
async function warmupSession() {
    const size = 640, plane = size * size, arr = new Float32Array(plane * 3), input = new ort.Tensor('float32', arr, [1, 3, size, size]), feeds = {};
    feeds[session.inputNames[0]] = input;
    let result = null;
    try {
        result = await session.run(feeds);
    }
    finally {
        if (result)
            for (const t of Object.values(result))
                disposeTensor(t);
        disposeTensor(input);
    }
    await compactMemory();
    baselineRssMb = rssMb();
}
async function init() {
    modelInfo = await ensureModel();
    ort = await import('onnxruntime-node');
    session = await ort.InferenceSession.create(modelInfo.path, { executionProviders: ['cpu'], graphOptimizationLevel: 'all', intraOpNumThreads: ONNX_THREADS, interOpNumThreads: 1, enableCpuMemArena: false, enableMemPattern: false, executionMode: 'sequential' });
    await warmupSession();
    send({ type: 'ready', ok: true, pid: process.pid, rssMb: rssMb(), baselineRssMb, model: MODEL_FILE, modelCached: modelInfo.cached, modelBundled: Boolean(modelInfo.bundled), modelSource: modelInfo.source || null, modelBytes: modelInfo.bytes, cgroup: cgroupMemory() });
}
async function sourceDims(source) { const meta = await sharp(source, { sequentialRead: true }).metadata(), dims = orientedDims(meta); if (!dims.width || !dims.height)
    throw new Error('face_detector_invalid_image'); return dims; }
async function letterboxSource(source, size = 640, region = null, dimsHint = null) {
    const dims = region ? { width: Number(region.width), height: Number(region.height) } : (dimsHint || await sourceDims(source));
    if (!dims.width || !dims.height)
        throw new Error('face_detector_invalid_image');
    const scale = Math.min(size / dims.width, size / dims.height), rw = Math.max(1, Math.round(dims.width * scale)), rh = Math.max(1, Math.round(dims.height * scale)), left = Math.floor((size - rw) / 2), top = Math.floor((size - rh) / 2);
    let op = sharp(source, { sequentialRead: true, limitInputPixels: false }).rotate();
    if (region)
        op = op.extract({ left: Number(region.left), top: Number(region.top), width: Number(region.width), height: Number(region.height) });
    // Ultralytics letterbox uses a neutral 114 fill. Black padding lowers the
    // confidence of faces near the edge of a wide group photo.
    const data = await op.resize({ width: rw, height: rh, fit: 'fill', kernel: 'lanczos3' }).removeAlpha().toColourspace('srgb').extend({ left, top, right: size - rw - left, bottom: size - rh - top, background: { r: 114, g: 114, b: 114 } }).raw().toBuffer();
    return { data, W: dims.width, H: dims.height, size, scale, left, top };
}
function tensor(raw, size) { const plane = size * size, out = new Float32Array(plane * 3); for (let i = 0; i < plane; i++) {
    const r = raw[i * 3], g = raw[i * 3 + 1], b = raw[i * 3 + 2];
    out[i] = r / 255;
    out[plane + i] = g / 255;
    out[2 * plane + i] = b / 255;
} return new ort.Tensor('float32', out, [1, 3, size, size]); }
function unletterbox(b, prep) { const x1 = (b.x - prep.left) / prep.scale, y1 = (b.y - prep.top) / prep.scale, x2 = (b.x + b.w - prep.left) / prep.scale, y2 = (b.y + b.h - prep.top) / prep.scale; return { x: Math.max(0, x1), y: Math.max(0, y1), w: Math.max(0, Math.min(prep.W, x2) - Math.max(0, x1)), h: Math.max(0, Math.min(prep.H, y2) - Math.max(0, y1)), score: b.score }; }
function decode(output, prep) {
    const data = output.data, d = (output.dims || []).map((x) => Number(x));
    let rows = 0, cols = 0, transposed = false;
    if (d.length === 3) {
        const a = d[1], b = d[2];
        if (a <= 64 && b > a) {
            rows = b;
            cols = a;
            transposed = true;
        }
        else {
            rows = a;
            cols = b;
        }
    }
    else if (d.length === 2) {
        const a = d[0], b = d[1];
        if (a <= 64 && b > a) {
            rows = b;
            cols = a;
            transposed = true;
        }
        else {
            rows = a;
            cols = b;
        }
    }
    else
        throw new Error(`yoloface_output_shape:${d.join('x')}`);
    if (cols < 5)
        throw new Error(`yoloface_output_columns:${cols}`);
    const at = (r, c) => transposed ? Number(data[c * rows + r]) : Number(data[r * cols + c]);
    const nmsXyxy = cols >= 6 && rows <= 1000, format = nmsXyxy ? 'xyxy-score-class' : 'cxcywh-score';
    let coordMax = 0;
    for (let i = 0; i < Math.min(rows, 200); i++) {
        const score = at(i, 4);
        if (!Number.isFinite(score) || score < .01)
            continue;
        for (let c = 0; c < 4; c++)
            coordMax = Math.max(coordMax, Math.abs(at(i, c)));
    }
    const normalizedCoords = coordMax > 0 && coordMax <= 2.5, coordScale = normalizedCoords ? prep.size : 1, found = [];
    for (let i = 0; i < rows; i++) {
        const score = at(i, 4);
        if (!Number.isFinite(score) || score < THRESHOLD)
            continue;
        let a = at(i, 0) * coordScale, b = at(i, 1) * coordScale, c = at(i, 2) * coordScale, d2 = at(i, 3) * coordScale, x = 0, y = 0, w = 0, h = 0;
        if (![a, b, c, d2].every(Number.isFinite))
            continue;
        if (nmsXyxy) {
            x = a;
            y = b;
            w = c - a;
            h = d2 - b;
        }
        else {
            x = a - c / 2;
            y = b - d2 / 2;
            w = c;
            h = d2;
        }
        if (w < 1.5 || h < 1.5 || w > prep.size * 1.15 || h > prep.size * 1.15)
            continue;
        const box = unletterbox({ x, y, w, h, score }, prep);
        if (box.w < 1.5 || box.h < 1.5)
            continue;
        found.push(box);
    }
    return { found, diagnostics: { outputShape: d.join('x'), decoderFormat: format, transposed, normalizedCoords, rows, cols } };
}
async function passSource(source, maxFaces = 32, region = null, dimsHint = null) {
    const before = memorySnapshot();
    let prep = null, input = null, result = null;
    try {
        prep = await letterboxSource(source, 640, region, dimsHint);
        input = tensor(prep.data, 640);
        prep.data = null;
        const feeds = {};
        feeds[session.inputNames[0]] = input;
        result = await session.run(feeds);
        const outs = Object.entries(result).map(([name, t]) => ({ name, data: t.data, dims: t.dims, tensor: t })), o = outs.sort((a, b) => b.data.length - a.data.length)[0];
        if (!o)
            throw new Error('yoloface_no_output');
        const decoded = decode(o, prep), boxes = toNorm(nms(decoded.found, .42, 96), prep.W, prep.H, maxFaces);
        return { boxes, diagnostics: { ...decoded.diagnostics, memoryBefore: before, memoryAfterInference: memorySnapshot() } };
    }
    finally {
        if (result)
            for (const t of Object.values(result))
                disposeTensor(t);
        disposeTensor(input);
        if (prep)
            prep.data = null;
        result = null;
        input = null;
        prep = null;
        await compactMemory();
    }
}
function tileToFull(b, tile, W, H) { const x = tile.left + Number(b.x || 0) / 1000 * tile.width, y = tile.top + Number(b.y || 0) / 1000 * tile.height, w = Number(b.w || 0) / 1000 * tile.width, h = Number(b.h || 0) / 1000 * tile.height; return { x: x / W * 1000, y: y / H * 1000, w: w / W * 1000, h: h / H * 1000, score: Number(b.score || 0), validationScore: Number(b.validationScore || b.score || 0), source: 'tile' }; }
function pixelIou(a, b) { return iou(a, b); }
function plausibleFaceCandidate(b, all, W, H, recallMode = false) {
    const w = Math.max(1, Number(b.w || 0)), h = Math.max(1, Number(b.h || 0)), ratio = w / h, score = Number(b.score || 0);
    // v0.17.561 recall-balanced gate: profile and three-quarter faces can be noticeably
    // narrower than frontal faces. Let them reach the server-side context verifier instead
    // of deleting them inside the ONNX worker. The context verifier still rejects decor.
    if (ratio < .32 || ratio > 2.18) return false;
    // v0.17.562: close portraits can legitimately occupy most of the frame. The previous
    // 74% ceiling silently removed some obvious large faces while small group faces worked.
    if (w < (recallMode ? 2 : 4) || h < (recallMode ? 2 : 4) || w > W * .94 || h > H * .94) return false;
    const faceLikeShape = ratio >= .48 && ratio <= 1.88;
    const profileLikeShape = ratio >= .32 && ratio < .58;
    const directThreshold = recallMode ? (b.source === 'tile' ? .10 : .12) : (b.source === 'tile' ? .285 : .315);
    if (faceLikeShape && score >= directThreshold) return true;
    if (profileLikeShape && score >= (recallMode ? (b.source === 'tile' ? .09 : .11) : (b.source === 'tile' ? .27 : .30))) return true;
    if (score >= (recallMode ? .24 : .54) && ratio >= .38 && ratio <= 2.02) return true;
    if (score < (recallMode ? .08 : .20)) return false;
    // Borderline candidates survive when an independent pass overlaps them. This path is
    // mainly useful for distant faces in group portraits and is verified again upstream.
    return all.some(q => q !== b && q.source !== b.source && pixelIou(b, q) >= .13 && Number(q.score || 0) >= (recallMode ? .09 : .23));
}
async function detect(source, maxFaces = 8, tiled = TILED) {
    const started = Date.now(), recallMode = Number(maxFaces || 0) >= 12, dims = await sourceDims(source), full = await passSource(source, Math.max(24, maxFaces), null, dims), all = full.boxes.map((b) => ({ ...b, source: 'full' })), passes = [{ kind: 'full', count: full.boxes.length, diagnostics: full.diagnostics, memoryAfter: memorySnapshot() }];
    if (tiled && Math.max(dims.width, dims.height) >= TILE_TRIGGER) {
        // v0.17.566: group mode uses a dense, overlapping 3x2 (landscape) or
        // 2x3 (portrait) grid. A single-axis strip pass leaves too few pixels for
        // a second row of small people; the grid gives every face a closer view
        // while retaining bounded, sequential memory use.
        const landscape = dims.width >= dims.height;
        // v0.17.591: recall rescue uses broad overlapping stripes for landscape/portrait
        // group photos (3 tile passes) and 2x2 only for near-square frames. This keeps
        // distant-face recall while halving the previous 3x2 / 2x3 six-pass scan.
        const aspect = dims.width / Math.max(1, dims.height), wideRecall = recallMode && aspect >= 1.20, tallRecall = recallMode && aspect <= .83;
        const gridCols = recallMode ? (wideRecall ? 3 : tallRecall ? 1 : 2) : (landscape ? 3 : 1), gridRows = recallMode ? (wideRecall ? 1 : tallRecall ? 3 : 2) : (landscape ? 1 : 3), tileFractionW = recallMode ? (wideRecall ? .58 : tallRecall ? .94 : .72) : .68, tileFractionH = recallMode ? (wideRecall ? .94 : tallRecall ? .58 : .72) : .68;
        const tw = Math.min(dims.width, Math.max(480, Math.round(dims.width * tileFractionW))), th = Math.min(dims.height, Math.max(480, Math.round(dims.height * tileFractionH)));
        const positions = Array.from({ length: gridRows }, (_, row) => Array.from({ length: gridCols }, (_, col) => ({ left: Math.max(0, Math.round((dims.width - tw) * col / Math.max(1, gridCols - 1))), top: Math.max(0, Math.round((dims.height - th) * row / Math.max(1, gridRows - 1))) }))).flat(), seen = new Set();
        for (const pos of positions) {
            const left = pos.left, top = pos.top, key = `${left}:${top}:${tw}:${th}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const tile = { left, top, width: tw, height: th }, memBefore = memorySnapshot(), r = await passSource(source, 48, tile, dims);
            let kept = 0;
            for (const b of r.boxes) {
                const bx = Number(b.x || 0), by = Number(b.y || 0), br = bx + Number(b.w || 0), bb = by + Number(b.h || 0), innerLeft = left > 0, innerTop = top > 0, innerRight = left + tw < dims.width, innerBottom = top + th < dims.height;
                if ((innerLeft && bx < 12) || (innerTop && by < 12) || (innerRight && br > 988) || (innerBottom && bb > 988)) continue;
                all.push(tileToFull(b, tile, dims.width, dims.height));
                kept++;
            }
            await compactMemory();
            passes.push({ kind: 'tile', left, top, width: tw, height: th, count: r.boxes.length, kept, diagnostics: r.diagnostics, memoryBefore: memBefore, memoryAfter: memorySnapshot() });
            const reason = memoryGuardReason();
            if (reason) throw new Error(reason.code);
        }
    }
    const pixel = all.map((b) => ({ x: Number(b.x || 0) / 1000 * dims.width, y: Number(b.y || 0) / 1000 * dims.height, w: Number(b.w || 0) / 1000 * dims.width, h: Number(b.h || 0) / 1000 * dims.height, score: Number(b.score || 0), source: b.source }));
    const plausible = pixel.filter(b => plausibleFaceCandidate(b, pixel, dims.width, dims.height, recallMode));
    // In multi-face mode, keeping a geometrically valid low-score candidate is
    // intentional. The caller presents these boxes for user selection; dropping
    // them here is what previously made a whole group photo look face-free.
    const accepted = recallMode ? pixel.filter(b => plausible.includes(b) || (b.w >= 2 && b.h >= 2 && b.w <= dims.width * .94 && b.h <= dims.height * .94 && b.score >= .06 && b.w / Math.max(1, b.h) >= .26 && b.w / Math.max(1, b.h) <= 2.35)) : plausible;
    const merged = toNorm(nms(accepted, .34, 128), dims.width, dims.height, maxFaces).sort((a, b) => a.x - b.x);
    return { boxes: merged, candidates: [], usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, requestId: '', attemptCount: 0, strategy: `onnx-yolov12n-face-adaptive-recall-v591${recallMode ? '-group' : ''}`, provider: 'local-onnx-worker', externalCalls: 0, model: MODEL_FILE, modelCached: true, modelBytes: modelInfo?.bytes || null, durationMs: Date.now() - started, previewDimensions: { width: dims.width, height: dims.height }, decoder: full.diagnostics, passes, attempts: merged.map((b) => ({ status: 'accepted-yoloface', score: b.score })), worker: { pid: process.pid, ...memorySnapshot(), maxRssMb: (baselineRssMb ? Math.min(MAX_RSS_MB, baselineRssMb + MAX_RSS_OVER_BASELINE_MB) : MAX_RSS_MB), cgroupMaxPct: Number((CGROUP_MAX_PCT * 100).toFixed(0)), cgroupPressurePct: Number((CGROUP_PRESSURE_PCT * 100).toFixed(0)), preloaded: true, streamedTiles: Boolean(tiled), groupRecallMode: recallMode } };
}
async function handle(msg) {
    if (!msg || msg.type !== 'detect' || busy)
        return;
    busy = true;
    const id = String(msg.id || '');
    let guard = null;
    try {
        if (!session)
            throw new Error('face_detector_worker_not_ready');
        const pre = memoryGuardReason();
        if (pre)
            throw new Error(pre.code);
        let tripped = false;
        guard = setInterval(() => { const reason = memoryGuardReason(); if (reason && !tripped) {
            tripped = true;
            send({ type: 'result', id, ok: false, error: reason.code, worker: { pid: process.pid, ...memorySnapshot(), ...reason } });
            setTimeout(() => process.exit(86), 25).unref();
        } }, 250);
        guard.unref?.();
        const source = String(msg.path || '');
        if (!source || !fs.existsSync(source))
            throw new Error('face_detector_worker_input_missing');
        const cgStart = cgroupMemory(), pressureMode = cgStart.effectivePct != null && cgStart.effectivePct > CGROUP_PRESSURE_PCT;
        const groupRecallMode = Number(msg.maxFaces || 0) >= 12;
        const result = await detect(source, Number(msg.maxFaces || 8), msg.tiled !== false && (!pressureMode || groupRecallMode));
        if (!tripped)
            send({ type: 'result', id, ok: true, result: { ...result, pressureMode, pressureCgroupEffectivePct: cgStart.effectivePct == null ? null : Number((cgStart.effectivePct * 100).toFixed(1)) } });
    }
    catch (e) {
        send({ type: 'result', id, ok: false, error: String(e?.message || e).slice(0, 700), worker: { pid: process.pid, ...memorySnapshot(), maxRssMb: (baselineRssMb ? Math.min(MAX_RSS_MB, baselineRssMb + MAX_RSS_OVER_BASELINE_MB) : MAX_RSS_MB) } });
    }
    finally {
        if (guard)
            clearInterval(guard);
        busy = false;
        await compactMemory();
    }
}
process.on('message', (m) => void handle(m));
process.on('uncaughtException', (e) => { send({ type: 'fatal', error: String(e?.message || e), pid: process.pid, ...memorySnapshot() }); setTimeout(() => process.exit(1), 10).unref(); });
process.on('unhandledRejection', (e) => { send({ type: 'fatal', error: String(e?.message || e), pid: process.pid, ...memorySnapshot() }); setTimeout(() => process.exit(1), 10).unref(); });
init().catch((e) => { send({ type: 'ready', ok: false, error: String(e?.message || e).slice(0, 700), pid: process.pid, ...memorySnapshot() }); setTimeout(() => process.exit(2), 25).unref(); });
