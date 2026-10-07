// @ts-nocheck
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import sharp from 'sharp';
// Stage 4 runs in this isolated process so a native libvips/Sharp failure or
// worker-local memory exhaustion does not have to take the PhotoBridge API down.
// v0.17.183 keeps the v0.17.182 low-disk strip pipeline and extends it to multiple retouch regions: strips are piped
// directly into a one-frame ffmpeg encoder with Node stream backpressure. Texture and
// mask assets stay bounded in memory so low-disk Stage 4 only creates the final output.
// v0.17.272: keep libvips in a tiny tile cache. The Stage 4 worker is isolated,
// so this cap is process-local and prevents large source frames from inflating RAM.
sharp.cache(false);
sharp.concurrency(1);
function cgroupMemory() {
    const mb = (v) => Math.round(v / 1024 / 1024);
    try {
        const currentRaw = fs.readFileSync('/sys/fs/cgroup/memory.current', 'utf8').trim(), maxRaw = fs.readFileSync('/sys/fs/cgroup/memory.max', 'utf8').trim();
        return { cgroupCurrentMb: mb(Number(currentRaw) || 0), cgroupLimitMb: maxRaw === 'max' ? null : mb(Number(maxRaw) || 0) };
    }
    catch { }
    try {
        const currentRaw = fs.readFileSync('/sys/fs/cgroup/memory/memory.usage_in_bytes', 'utf8').trim(), maxRaw = fs.readFileSync('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'utf8').trim();
        return { cgroupCurrentMb: mb(Number(currentRaw) || 0), cgroupLimitMb: mb(Number(maxRaw) || 0) };
    }
    catch {
        return {};
    }
}
function memorySnapshot() {
    const m = process.memoryUsage();
    const mb = (v) => Math.round(v / 1024 / 1024), ru = process.resourceUsage?.();
    return { rssMb: mb(m.rss), heapUsedMb: mb(m.heapUsed), externalMb: mb(m.external), arrayBuffersMb: mb(m.arrayBuffers || 0), maxRssMb: ru?.maxRSS ? Math.round(Number(ru.maxRSS) / 1024) : null, freeSystemMb: mb(os.freemem()), ...cgroupMemory() };
}
function processRssMb(pid) { try {
    const raw = fs.readFileSync(`/proc/${pid}/status`, 'utf8'), m = /^VmRSS:\s+(\d+)\s+kB/im.exec(raw);
    return m ? Math.round(Number(m[1]) / 1024) : null;
}
catch {
    return null;
} }
function diskSnapshot(target) {
    try {
        const s = fs.statfsSync(target);
        const free = Number(s.bavail || s.bfree || 0) * Number(s.bsize || s.frsize || 4096);
        return { diskFreeMb: Math.round(free / 1024 / 1024), diskFreeBytes: free };
    }
    catch {
        return { diskFreeMb: null, diskFreeBytes: null };
    }
}
let inProcessEmitHook = null;
function emit(type, payload = {}) {
    const message = { type, at: new Date().toISOString(), pid: process.pid, memory: memorySnapshot(), ...payload };
    if (inProcessEmitHook) {
        try {
            void Promise.resolve(inProcessEmitHook(message)).catch(() => { });
        }
        catch { }
        ;
        return;
    }
    try {
        process.stdout.write(JSON.stringify(message) + '\n');
    }
    catch { }
}
function orientedImageDimensions(meta) {
    const orientation = Number(meta?.orientation || 1), swap = [5, 6, 7, 8].includes(orientation);
    return { width: Math.max(1, Number(swap ? meta?.height : meta?.width) || 1), height: Math.max(1, Number(swap ? meta?.width : meta?.height) || 1) };
}
function geometryEdgeMap(gray, width, height) {
    const out = new Uint16Array(width * height);
    for (let y = 1; y < height - 1; y++)
        for (let x = 1; x < width - 1; x++) {
            const i = y * width + x, gx = Math.abs(Number(gray[i + 1]) - Number(gray[i - 1])), gy = Math.abs(Number(gray[i + width]) - Number(gray[i - width]));
            out[i] = Math.min(510, gx + gy);
        }
    return out;
}
function geometryShiftScore(src, edit, width, height, roi, dx, dy) {
    let dot = 0, aa = 0, bb = 0, n = 0;
    const x0 = Math.max(2, Math.round(Number(roi.x) || 0)), y0 = Math.max(2, Math.round(Number(roi.y) || 0)), x1 = Math.min(width - 2, Math.round((Number(roi.x) || 0) + (Number(roi.w) || 0))), y1 = Math.min(height - 2, Math.round((Number(roi.y) || 0) + (Number(roi.h) || 0)));
    for (let y = y0; y < y1; y += 2) {
        const by = y + dy;
        if (by < 1 || by >= height - 1)
            continue;
        for (let x = x0; x < x1; x += 2) {
            const bx = x + dx;
            if (bx < 1 || bx >= width - 1)
                continue;
            const a = src[y * width + x], b = edit[by * width + bx];
            if (a + b < 38)
                continue;
            dot += a * b;
            aa += a * a;
            bb += b * b;
            n++;
        }
    }
    if (n < 48 || aa <= 0 || bb <= 0)
        return -1;
    return dot / Math.sqrt(aa * bb);
}
async function translatePatchBuffer(buffer, width, height, tx, ty) {
    tx = Math.round(tx);
    ty = Math.round(ty);
    if (!tx && !ty)
        return buffer;
    const srcLeft = Math.max(0, -tx), srcTop = Math.max(0, -ty), dstLeft = Math.max(0, tx), dstTop = Math.max(0, ty), w = Math.min(width - srcLeft, width - dstLeft), h = Math.min(height - srcTop, height - dstTop);
    if (w < 2 || h < 2)
        return buffer;
    const piece = await sharp(buffer, { sequentialRead: true, limitInputPixels: false }).extract({ left: srcLeft, top: srcTop, width: w, height: h }).ensureAlpha().png({ compressionLevel: 1 }).toBuffer();
    return sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: piece, left: dstLeft, top: dstTop, blend: 'over' }]).png({ compressionLevel: 1 }).toBuffer();
}
async function geometryLockPatch(args) {
    const crop = args.crop || {}, faces = Array.isArray(crop?.faces) && crop.faces.length ? crop.faces : [crop?.face].filter(Boolean), skinRects = Array.isArray(crop?.skinRects) ? crop.skinRects : [];
    // A manually edited box is an explicit user decision. Never replace its AI result
    // with the original pixels because a geometry heuristic sees a shift; that was the
    // reason one edited face in a multi-person photo could come out completely untouched.
    if (Boolean(crop?.expansion?.manualExact || crop?.expansion?.tightAi))
        return { buffer: args.textureBuffer, applied: false, fallbackOriginal: false, reason: crop?.expansion?.manualExact ? 'manual-exact-user-selection' : 'tight-ai-user-approved-face' };
    if (skinRects.length || faces.length !== 1)
        return { buffer: args.textureBuffer, applied: false, reason: skinRects.length ? 'body-skin' : 'shared-or-no-face' };
    const face = faces[0], cw = Math.max(1, Math.round(Number(crop.width) || 1)), ch = Math.max(1, Math.round(Number(crop.height) || 1));
    // v0.17.266: Geometry Lock only needs a small edge map. Keeping this
    // deliberately tiny prevents libvips from overlapping a large source decode with
    // the AI patch while another region checkpoint is still being released.
    const maxSide = 112, scale = Math.min(1, maxSide / Math.max(cw, ch)), w = Math.max(40, Math.round(cw * scale)), h = Math.max(40, Math.round(ch * scale));
    const sourceCrop = sharp(args.imagePath, { sequentialRead: true, limitInputPixels: false }).rotate().extract({ left: Math.round(Number(crop.left) || 0), top: Math.round(Number(crop.top) || 0), width: cw, height: ch });
    const sourceGray = await sourceCrop.clone().resize(w, h, { fit: 'fill', kernel: 'cubic' }).greyscale().raw().toBuffer();
    const editGray = await sharp(args.textureBuffer, { sequentialRead: true, limitInputPixels: false }).resize(w, h, { fit: 'fill', kernel: 'cubic' }).greyscale().raw().toBuffer();
    const srcEdge = geometryEdgeMap(sourceGray, w, h), editEdge = geometryEdgeMap(editGray, w, h), sfX = w / cw, sfY = h / ch;
    const roi = { x: Math.max(0, (Number(face.x) - Number(face.w) * .28) * sfX), y: Math.max(0, (Number(face.y) - Number(face.h) * .34) * sfY), w: Math.min(w, (Number(face.w) * 1.56) * sfX), h: Math.min(h, (Number(face.h) * 1.72) * sfY) };
    const maxDx = Math.max(2, Math.min(12, Math.round(Math.max(2, Number(face.w) * sfX * .095)))), maxDy = Math.max(2, Math.min(12, Math.round(Math.max(2, Number(face.h) * sfY * .095))));
    const base = geometryShiftScore(srcEdge, editEdge, w, h, roi, 0, 0);
    let best = { dx: 0, dy: 0, score: base };
    for (let dy = -maxDy; dy <= maxDy; dy++)
        for (let dx = -maxDx; dx <= maxDx; dx++) {
            if (!dx && !dy)
                continue;
            const raw = geometryShiftScore(srcEdge, editEdge, w, h, roi, dx, dy);
            if (raw < 0)
                continue;
            const score = raw - (Math.abs(dx) + Math.abs(dy)) * .0007;
            if (score > best.score)
                best = { dx, dy, score };
        }
    const improvement = best.score - base, tx = Math.round(-best.dx / Math.max(.0001, sfX)), ty = Math.round(-best.dy / Math.max(.0001, sfY));
    const atBoundary = Math.abs(best.dx) >= maxDx || Math.abs(best.dy) >= maxDy, maxSafeX = Math.max(3, Math.round(Number(face.w) * .085)), maxSafeY = Math.max(3, Math.round(Number(face.h) * .085));
    if (atBoundary && improvement > .018) {
        const original = await sourceCrop.clone().removeAlpha().png({ compressionLevel: 1 }).toBuffer();
        return { buffer: original, applied: false, fallbackOriginal: true, reason: 'geometry-shift-exceeds-safe-window', tx, ty, baseScore: base, bestScore: best.score, improvement };
    }
    if (Math.abs(tx) > maxSafeX || Math.abs(ty) > maxSafeY) {
        const original = await sourceCrop.clone().removeAlpha().png({ compressionLevel: 1 }).toBuffer();
        return { buffer: original, applied: false, fallbackOriginal: true, reason: 'geometry-shift-unsafe', tx, ty, baseScore: base, bestScore: best.score, improvement };
    }
    if ((Math.abs(tx) + Math.abs(ty) < 1) || improvement < .006)
        return { buffer: args.textureBuffer, applied: false, reason: 'already-aligned', tx, ty, baseScore: base, bestScore: best.score, improvement };
    const aligned = await translatePatchBuffer(args.textureBuffer, cw, ch, tx, ty);
    return { buffer: aligned, applied: true, reason: 'translation-corrected', tx, ty, baseScore: base, bestScore: best.score, improvement };
}
async function geometryLockPathDecision(args) {
    const crop = args.crop || {}, faces = Array.isArray(crop?.faces) && crop.faces.length ? crop.faces : [crop?.face].filter(Boolean), skinRects = Array.isArray(crop?.skinRects) ? crop.skinRects : [];
    if (Boolean(crop?.expansion?.manualExact))
        return { keepAi: true, fallbackOriginal: false, applied: false, reason: 'manual-exact-user-selection' };
    if (skinRects.length || faces.length !== 1)
        return { keepAi: true, fallbackOriginal: false, applied: false, reason: skinRects.length ? 'body-skin' : 'shared-or-no-face' };
    const face = faces[0], cw = Math.max(1, Math.round(Number(crop.width) || 1)), ch = Math.max(1, Math.round(Number(crop.height) || 1));
    const mem = cgroupMemory(), limit = Number(mem.cgroupLimitMb || 0), current = Number(mem.cgroupCurrentMb || 0), headroom = limit > 0 ? limit - current : 99999;
    // v0.17.270: on small Liara containers even a tiny Sharp read of a very large JPEG
    // can make libvips cross the cgroup ceiling. Geometry Lock is therefore skipped
    // entirely in the low-memory lane; the strict feathered mask still protects the
    // head/neck boundary and, crucially, the AI face is never silently discarded.
    if ((limit > 0 && limit <= 1024) || headroom < 220)
        return { keepAi: true, fallbackOriginal: false, applied: false, reason: 'geometry-skipped-memory-guard', memory: { limit, current, headroom } };
    // Larger containers keep the tiny path-only edge check, sequentially (never two
    // libvips decodes at once).
    const maxSide = 64, scale = Math.min(1, maxSide / Math.max(cw, ch)), w = Math.max(28, Math.round(cw * scale)), h = Math.max(28, Math.round(ch * scale));
    const sourceGray = await sharp(args.imagePath, { sequentialRead: true, limitInputPixels: false }).rotate().extract({ left: Math.round(Number(crop.left) || 0), top: Math.round(Number(crop.top) || 0), width: cw, height: ch }).resize(w, h, { fit: 'fill', kernel: 'cubic' }).greyscale().raw().toBuffer();
    const editGray = await sharp(args.texturePath, { sequentialRead: true, limitInputPixels: false }).resize(w, h, { fit: 'fill', kernel: 'cubic' }).greyscale().raw().toBuffer();
    const srcEdge = geometryEdgeMap(sourceGray, w, h), editEdge = geometryEdgeMap(editGray, w, h), sfX = w / cw, sfY = h / ch;
    const roi = { x: Math.max(0, (Number(face.x) - Number(face.w) * .28) * sfX), y: Math.max(0, (Number(face.y) - Number(face.h) * .34) * sfY), w: Math.min(w, (Number(face.w) * 1.56) * sfX), h: Math.min(h, (Number(face.h) * 1.72) * sfY) };
    const maxDx = Math.max(2, Math.min(9, Math.round(Math.max(2, Number(face.w) * sfX * .085)))), maxDy = Math.max(2, Math.min(9, Math.round(Math.max(2, Number(face.h) * sfY * .085))));
    const base = geometryShiftScore(srcEdge, editEdge, w, h, roi, 0, 0);
    let best = { dx: 0, dy: 0, score: base };
    for (let dy = -maxDy; dy <= maxDy; dy++)
        for (let dx = -maxDx; dx <= maxDx; dx++) {
            if (!dx && !dy)
                continue;
            const raw = geometryShiftScore(srcEdge, editEdge, w, h, roi, dx, dy);
            if (raw < 0)
                continue;
            const score = raw - (Math.abs(dx) + Math.abs(dy)) * .0007;
            if (score > best.score)
                best = { dx, dy, score };
        }
    const improvement = best.score - base, tx = Math.round(-best.dx / Math.max(.0001, sfX)), ty = Math.round(-best.dy / Math.max(.0001, sfY));
    // In the hard-low-memory path we do not create another full translated PNG. When a
    // meaningful shift is detected we conservatively keep the original pixels for this
    // region. This protects head/neck geometry and removes the libvips memory spike that
    // previously caused SIGKILL at geometry-lock-region-1.
    if ((Math.abs(tx) + Math.abs(ty) >= 1) && improvement >= .006)
        return { keepAi: false, fallbackOriginal: true, applied: false, reason: 'low-memory-geometry-original-fallback', tx, ty, baseScore: base, bestScore: best.score, improvement };
    return { keepAi: true, fallbackOriginal: false, applied: false, reason: 'already-aligned-path-only', tx, ty, baseScore: base, bestScore: best.score, improvement };
}
function outputFormat(mimeType) {
    return mimeType === 'image/png' ? { contentType: 'image/png', ext: '.png' } : mimeType === 'image/webp' ? { contentType: 'image/webp', ext: '.webp' } : { contentType: 'image/jpeg', ext: '.jpg' };
}
function clampNumber(v, min, max) { return Math.max(min, Math.min(max, v)); }
async function validateEncodedOutput(outputPath, width, height) {
    try {
        const st = await fs.promises.stat(outputPath);
        if (!st.isFile() || st.size < 1024)
            return false;
        const meta = await sharp(outputPath, { failOn: 'truncated', sequentialRead: true, limitInputPixels: false }).metadata(), dims = orientedImageDimensions(meta);
        if (dims.width !== width || dims.height !== height)
            return false;
        // v0.17.591: FFmpeg/Sharp has already completed the encode successfully and
        // metadata validates dimensions. A second full-resolution pixel decode was a
        // costly Stage-4 tax on large camera files. Keep it as an opt-in diagnostic.
        if (String(process.env.STAGE4_DEEP_VALIDATE || '') === '1')
            await sharp(outputPath, { failOn: 'truncated', sequentialRead: true, limitInputPixels: false }).resize(1, 1, { fit: 'fill' }).raw().toBuffer();
        return true;
    }
    catch {
        return false;
    }
}
async function matchGentleSkinTone(args) {
    const { imagePath, textureBuffer, maskBuffer, crop } = args;
    const maxSide = 96, scale = Math.min(1, maxSide / Math.max(1, Number(crop.width) || 1, Number(crop.height) || 1)), w = Math.max(8, Math.round((Number(crop.width) || 1) * scale)), h = Math.max(8, Math.round((Number(crop.height) || 1) * scale));
    const [source, edited, mask] = await Promise.all([
        sharp(imagePath, { sequentialRead: true, limitInputPixels: false }).rotate().toColourspace('srgb').extract({ left: Number(crop.left) || 0, top: Number(crop.top) || 0, width: Number(crop.width) || 1, height: Number(crop.height) || 1 }).resize(w, h, { fit: 'fill', kernel: 'cubic' }).removeAlpha().raw().toBuffer(),
        sharp(textureBuffer, { sequentialRead: true, limitInputPixels: false }).toColourspace('srgb').resize(w, h, { fit: 'fill', kernel: 'cubic' }).removeAlpha().raw().toBuffer(),
        sharp(maskBuffer, { sequentialRead: true, limitInputPixels: false }).resize(w, h, { fit: 'fill', kernel: 'cubic' }).greyscale().raw().toBuffer()
    ]);
    let weight = 0, sr = 0, sg = 0, sb = 0, er = 0, eg = 0, eb = 0;
    const pixels = Math.min(mask.length, Math.floor(source.length / 3), Math.floor(edited.length / 3));
    for (let i = 0; i < pixels; i++) {
        const m = Number(mask[i] || 0) / 255;
        if (m < .68)
            continue;
        const ww = m * m, j = i * 3;
        weight += ww;
        sr += source[j] * ww;
        sg += source[j + 1] * ww;
        sb += source[j + 2] * ww;
        er += edited[j] * ww;
        eg += edited[j + 1] * ww;
        eb += edited[j + 2] * ww;
    }
    if (weight < 8)
        return { buffer: textureBuffer, applied: false, offsets: [0, 0, 0], sampleWeight: weight };
    const delta = [sr / weight - er / weight, sg / weight - eg / weight, sb / weight - eb / weight], offsets = delta.map(d => clampNumber(d * .92, -36, 36));
    if (Math.max(...offsets.map(Math.abs)) < .75)
        return { buffer: textureBuffer, applied: false, offsets, sampleWeight: weight };
    const buffer = await sharp(textureBuffer, { sequentialRead: true, limitInputPixels: false }).toColourspace('srgb').removeAlpha().linear([1, 1, 1], offsets).png({ compressionLevel: 3 }).toBuffer();
    return { buffer, applied: true, offsets: offsets.map(x => Number(x.toFixed(2))), sampleWeight: Number(weight.toFixed(2)) };
}
async function sourceIsEffectivelyMonochrome(filePath) {
    const { data, info } = await sharp(filePath, { sequentialRead: true, limitInputPixels: false }).rotate().resize(96, 96, { fit: 'inside', withoutEnlargement: true, kernel: 'cubic' }).toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const pixels = Math.max(1, Number(info?.width || 0) * Number(info?.height || 0));
    let spread = 0, colored = 0;
    for (let i = 0; i < pixels; i++) {
        const j = i * 3, r = Number(data[j] || 0), g = Number(data[j + 1] || 0), b = Number(data[j + 2] || 0), d = Math.max(r, g, b) - Math.min(r, g, b);
        spread += d;
        if (d > 10)
            colored++;
    }
    const avgSpread = spread / pixels, coloredRatio = colored / pixels;
    return { monochrome: avgSpread < 3.25 && coloredRatio < .018, avgSpread: Number(avgSpread.toFixed(3)), coloredRatio: Number(coloredRatio.toFixed(4)) };
}
function maskSvg(crop, scale = 1) {
    const s = Math.max(.1, Math.min(1, Number(scale) || 1)), sw = Math.max(1, Math.round(crop.width * s)), sh = Math.max(1, Math.round(crop.height * s));
    const fx = Number(crop.face.x) * s, fy = Number(crop.face.y) * s, fw = Math.max(1, Number(crop.face.w) * s), fh = Math.max(1, Number(crop.face.h) * s);
    // stage4MaskProfile: face-ears-full-neck-edgefade-v594
    // v0.17.594 — full face + ears + full visible neck, with a second crop-edge
    // fade.  The edge fade is important: even when the detector box is tight, alpha
    // is guaranteed to reach zero before the crop boundary so no rectangular seam can
    // be stamped back onto the original photograph.
    const faceSide = Math.max(1, Math.min(fw, fh));
    const outerFeather = Math.max(16, Math.min(176 * s, Math.round(faceSide * .30)));
    const innerFeather = Math.max(5, Math.min(56 * s, Math.round(faceSide * .075)));
    const faceCx = fx + fw * .58, faceCy = fy + fh * .54;
    const faceRx = Math.min(sw * .49, fw * .88), faceRy = Math.min(sh * .49, fh * .82);
    const earCy = fy + fh * .55, earRx = Math.min(sw * .22, fw * .40), earRy = Math.min(sh * .33, fh * .48);
    const leftEarCx = fx - fw * .10, rightEarCx = fx + fw * 1.10;
    const jawCy = fy + fh * .98, jawRx = Math.min(sw * .44, fw * .72), jawRy = Math.min(sh * .27, fh * .44);
    const edgePadX = Math.max(2 * s, Math.min(sw * .025, outerFeather * .22));
    const edgePadTop = Math.max(2 * s, Math.min(sh * .018, outerFeather * .16));
    const edgePadBottom = Math.max(3 * s, Math.min(sh * .030, outerFeather * .24));
    const safeBottom = Math.max(fy + fh * 1.22, sh - edgePadBottom - Math.max(4 * s, outerFeather * .18));
    const neckStart = fy + fh * .92, availableNeck = Math.max(fh * .24, safeBottom - neckStart);
    const neckCy = Math.min(safeBottom, fy + fh * 1.22), neckRx = Math.min(sw * .42, fw * .66), neckRy = Math.min(sh * .31, fh * .46);
    const lowerNeckCy = Math.min(safeBottom, neckStart + availableNeck * .68), lowerNeckRx = Math.min(sw * .39, fw * .58), lowerNeckRy = Math.max(6, Math.min(fh * .26, availableNeck * .36));
    const bridgeX = Math.max(0, faceCx - Math.min(sw * .42, fw * .54)), bridgeY = Math.max(0, fy + fh * .88), bridgeW = Math.min(sw - bridgeX, Math.min(sw * .84, fw * 1.08)), bridgeH = Math.max(1, safeBottom - bridgeY);
    const innerX = Math.max(0, fx - fw * .12), innerY = Math.max(0, fy - fh * .06), innerW = Math.min(sw - innerX, fw * 1.24), innerH = Math.min(sh - innerY, fh * 1.20);
    const outer = `<ellipse cx="${faceCx.toFixed(1)}" cy="${faceCy.toFixed(1)}" rx="${Math.max(5, faceRx).toFixed(1)}" ry="${Math.max(5, faceRy).toFixed(1)}" fill="white"/><ellipse cx="${leftEarCx.toFixed(1)}" cy="${earCy.toFixed(1)}" rx="${Math.max(5, earRx).toFixed(1)}" ry="${Math.max(5, earRy).toFixed(1)}" fill="white"/><ellipse cx="${rightEarCx.toFixed(1)}" cy="${earCy.toFixed(1)}" rx="${Math.max(5, earRx).toFixed(1)}" ry="${Math.max(5, earRy).toFixed(1)}" fill="white"/><ellipse cx="${faceCx.toFixed(1)}" cy="${jawCy.toFixed(1)}" rx="${Math.max(5, jawRx).toFixed(1)}" ry="${Math.max(5, jawRy).toFixed(1)}" fill="white"/><rect x="${bridgeX.toFixed(1)}" y="${bridgeY.toFixed(1)}" width="${Math.max(1, bridgeW).toFixed(1)}" height="${Math.max(1, bridgeH).toFixed(1)}" rx="${Math.max(6, Math.min(bridgeW, fw * .46)).toFixed(1)}" fill="white"/><ellipse cx="${faceCx.toFixed(1)}" cy="${neckCy.toFixed(1)}" rx="${Math.max(5, neckRx).toFixed(1)}" ry="${Math.max(5, neckRy).toFixed(1)}" fill="white"/><ellipse cx="${faceCx.toFixed(1)}" cy="${lowerNeckCy.toFixed(1)}" rx="${Math.max(5, lowerNeckRx).toFixed(1)}" ry="${Math.max(5, lowerNeckRy).toFixed(1)}" fill="white"/>`;
    const inner = `<rect x="${innerX.toFixed(1)}" y="${innerY.toFixed(1)}" width="${Math.max(1, innerW).toFixed(1)}" height="${Math.max(1, innerH).toFixed(1)}" rx="${Math.max(5, fw * .36).toFixed(1)}" fill="white"/><ellipse cx="${leftEarCx.toFixed(1)}" cy="${earCy.toFixed(1)}" rx="${Math.max(5, earRx * .82).toFixed(1)}" ry="${Math.max(5, earRy * .82).toFixed(1)}" fill="white"/><ellipse cx="${rightEarCx.toFixed(1)}" cy="${earCy.toFixed(1)}" rx="${Math.max(5, earRx * .82).toFixed(1)}" ry="${Math.max(5, earRy * .82).toFixed(1)}" fill="white"/><rect x="${(bridgeX + bridgeW * .10).toFixed(1)}" y="${bridgeY.toFixed(1)}" width="${Math.max(1, bridgeW * .80).toFixed(1)}" height="${Math.max(1, bridgeH * .82).toFixed(1)}" rx="${Math.max(6, Math.min(bridgeW * .32, fw * .38)).toFixed(1)}" fill="white"/><ellipse cx="${faceCx.toFixed(1)}" cy="${neckCy.toFixed(1)}" rx="${Math.max(5, neckRx * .88).toFixed(1)}" ry="${Math.max(5, neckRy * .86).toFixed(1)}" fill="white"/>`;
    const edgeW = Math.max(1, sw - edgePadX * 2), edgeH = Math.max(1, sh - edgePadTop - edgePadBottom), edgeBlur = Math.max(2, Math.min(22 * s, outerFeather * .12));
    return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh}"><defs><filter id="outer" x="-55%" y="-55%" width="210%" height="210%"><feGaussianBlur stdDeviation="${outerFeather}"/></filter><filter id="inner" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${innerFeather}"/></filter><filter id="edge" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${edgeBlur}"/></filter><mask id="shape" maskUnits="userSpaceOnUse" x="0" y="0" width="${sw}" height="${sh}"><rect width="100%" height="100%" fill="black"/><g filter="url(#outer)">${outer}</g><g filter="url(#inner)">${inner}</g></mask><mask id="edgeFade" maskUnits="userSpaceOnUse" x="0" y="0" width="${sw}" height="${sh}"><rect width="100%" height="100%" fill="black"/><rect x="${edgePadX.toFixed(1)}" y="${edgePadTop.toFixed(1)}" width="${edgeW.toFixed(1)}" height="${edgeH.toFixed(1)}" rx="${Math.max(4, edgeBlur * 1.8).toFixed(1)}" fill="white" filter="url(#edge)"/></mask></defs><g mask="url(#edgeFade)"><rect width="100%" height="100%" fill="white" mask="url(#shape)"/></g></svg>`);
}
function bodySkinMaskSvg(crop, scale = 1) {
    const rects = Array.isArray(crop?.skinRects) ? crop.skinRects : [];
    const s = Math.max(.1, Math.min(1, Number(scale) || 1)), sw = Math.max(1, Math.round(crop.width * s)), sh = Math.max(1, Math.round(crop.height * s)), feather = Math.max(2, Math.min(64 * s, Math.round(Math.min(crop.width, crop.height) * .018 * s)));
    const shapes = rects.map((r) => { const x = Math.max(0, Number(r.x || 0)) * s, y = Math.max(0, Number(r.y || 0)) * s, w = Math.max(1, Number(r.w || 0)) * s, h = Math.max(1, Number(r.h || 0)) * s, rx = Math.max(3, Math.min(w, h) * .22); return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx.toFixed(1)}" fill="white"/>`; }).join('');
    return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh}"><defs><filter id="b" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${feather}"/></filter><mask id="m" maskUnits="userSpaceOnUse" x="0" y="0" width="${sw}" height="${sh}"><rect width="100%" height="100%" fill="black"/><g filter="url(#b)">${shapes}</g></mask></defs><rect width="100%" height="100%" fill="white" mask="url(#m)"/></svg>`);
}
function multiMaskSvg(crop, scale = 1) {
    const skinRects = Array.isArray(crop?.skinRects) ? crop.skinRects.filter((r) => r && Number(r.w) > 0 && Number(r.h) > 0) : [];
    if (skinRects.length) return bodySkinMaskSvg({ ...crop, skinRects }, scale);
    const faces = Array.isArray(crop?.faces) && crop.faces.length ? crop.faces : [crop?.face].filter(Boolean);
    if (faces.length <= 1) return maskSvg({ ...crop, face: faces[0] || crop.face }, scale);
    const s = Math.max(.1, Math.min(1, Number(scale) || 1)), sw = Math.max(1, Math.round(crop.width * s)), sh = Math.max(1, Math.round(crop.height * s));
    const faceSide = Math.max(1, Math.min(...faces.map((f) => Math.min(Math.max(1, Number(f.w) * s), Math.max(1, Number(f.h) * s)))));
    const outerFeather = Math.max(16, Math.min(172 * s, Math.round(faceSide * .29))), innerFeather = Math.max(5, Math.min(54 * s, Math.round(faceSide * .072)));
    const edgePadX = Math.max(2 * s, Math.min(sw * .020, outerFeather * .20)), edgePadTop = Math.max(2 * s, Math.min(sh * .015, outerFeather * .15)), edgePadBottom = Math.max(3 * s, Math.min(sh * .028, outerFeather * .23));
    let outer = '', inner = '';
    for (const f0 of faces) {
        const fx = Number(f0.x) * s, fy = Number(f0.y) * s, fw = Math.max(1, Number(f0.w) * s), fh = Math.max(1, Number(f0.h) * s), cx = fx + fw * .58;
        const faceCy = fy + fh * .54, faceRx = Math.min(sw * .49, fw * .88), faceRy = Math.min(sh * .49, fh * .82);
        const earCy = fy + fh * .55, earRx = Math.min(sw * .22, fw * .40), earRy = Math.min(sh * .33, fh * .48), leftEarCx = fx - fw * .10, rightEarCx = fx + fw * 1.10;
        const jawCy = fy + fh * .98, jawRx = Math.min(sw * .44, fw * .72), jawRy = Math.min(sh * .27, fh * .38);
        const safeBottom = Math.max(fy + fh * 1.22, sh - edgePadBottom - Math.max(4 * s, outerFeather * .18)), neckStart = fy + fh * .92, availableNeck = Math.max(fh * .24, safeBottom - neckStart);
        const neckCy = Math.min(safeBottom, fy + fh * 1.22), neckRx = Math.min(sw * .42, fw * .66), neckRy = Math.min(sh * .31, fh * .46), lowerNeckCy = Math.min(safeBottom, neckStart + availableNeck * .68), lowerNeckRx = Math.min(sw * .39, fw * .58), lowerNeckRy = Math.max(6, Math.min(fh * .26, availableNeck * .36));
        const bridgeX = Math.max(0, cx - Math.min(sw * .42, fw * .54)), bridgeY = Math.max(0, fy + fh * .88), bridgeW = Math.min(sw - bridgeX, Math.min(sw * .84, fw * 1.08)), bridgeH = Math.max(1, safeBottom - bridgeY);
        const ix = Math.max(0, fx - fw * .12), iy = Math.max(0, fy - fh * .06), iw = Math.min(sw - ix, fw * 1.24), ih = Math.min(sh - iy, fh * 1.20);
        outer += `<ellipse cx="${cx.toFixed(1)}" cy="${faceCy.toFixed(1)}" rx="${Math.max(5, faceRx).toFixed(1)}" ry="${Math.max(5, faceRy).toFixed(1)}" fill="white"/><ellipse cx="${leftEarCx.toFixed(1)}" cy="${earCy.toFixed(1)}" rx="${Math.max(5, earRx).toFixed(1)}" ry="${Math.max(5, earRy).toFixed(1)}" fill="white"/><ellipse cx="${rightEarCx.toFixed(1)}" cy="${earCy.toFixed(1)}" rx="${Math.max(5, earRx).toFixed(1)}" ry="${Math.max(5, earRy).toFixed(1)}" fill="white"/><ellipse cx="${cx.toFixed(1)}" cy="${jawCy.toFixed(1)}" rx="${Math.max(5, jawRx).toFixed(1)}" ry="${Math.max(5, jawRy).toFixed(1)}" fill="white"/><rect x="${bridgeX.toFixed(1)}" y="${bridgeY.toFixed(1)}" width="${Math.max(1, bridgeW).toFixed(1)}" height="${Math.max(1, bridgeH).toFixed(1)}" rx="${Math.max(6, Math.min(bridgeW, fw * .46)).toFixed(1)}" fill="white"/><ellipse cx="${cx.toFixed(1)}" cy="${neckCy.toFixed(1)}" rx="${Math.max(5, neckRx).toFixed(1)}" ry="${Math.max(5, neckRy).toFixed(1)}" fill="white"/><ellipse cx="${cx.toFixed(1)}" cy="${lowerNeckCy.toFixed(1)}" rx="${Math.max(5, lowerNeckRx).toFixed(1)}" ry="${Math.max(5, lowerNeckRy).toFixed(1)}" fill="white"/>`;
        inner += `<rect x="${ix.toFixed(1)}" y="${iy.toFixed(1)}" width="${Math.max(1, iw).toFixed(1)}" height="${Math.max(1, ih).toFixed(1)}" rx="${Math.max(5, fw * .36).toFixed(1)}" fill="white"/><ellipse cx="${leftEarCx.toFixed(1)}" cy="${earCy.toFixed(1)}" rx="${Math.max(5, earRx * .82).toFixed(1)}" ry="${Math.max(5, earRy * .82).toFixed(1)}" fill="white"/><ellipse cx="${rightEarCx.toFixed(1)}" cy="${earCy.toFixed(1)}" rx="${Math.max(5, earRx * .82).toFixed(1)}" ry="${Math.max(5, earRy * .82).toFixed(1)}" fill="white"/><rect x="${(bridgeX + bridgeW * .10).toFixed(1)}" y="${bridgeY.toFixed(1)}" width="${Math.max(1, bridgeW * .80).toFixed(1)}" height="${Math.max(1, bridgeH * .82).toFixed(1)}" rx="${Math.max(6, Math.min(bridgeW * .32, fw * .38)).toFixed(1)}" fill="white"/><ellipse cx="${cx.toFixed(1)}" cy="${neckCy.toFixed(1)}" rx="${Math.max(5, neckRx * .88).toFixed(1)}" ry="${Math.max(5, neckRy * .86).toFixed(1)}" fill="white"/>`;
    }
    const edgeW = Math.max(1, sw - edgePadX * 2), edgeH = Math.max(1, sh - edgePadTop - edgePadBottom), edgeBlur = Math.max(2, Math.min(22 * s, outerFeather * .12));
    return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh}"><defs><filter id="outer" x="-55%" y="-55%" width="210%" height="210%"><feGaussianBlur stdDeviation="${outerFeather}"/></filter><filter id="inner" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${innerFeather}"/></filter><filter id="edge" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${edgeBlur}"/></filter><mask id="shape" maskUnits="userSpaceOnUse" x="0" y="0" width="${sw}" height="${sh}"><rect width="100%" height="100%" fill="black"/><g filter="url(#outer)">${outer}</g><g filter="url(#inner)">${inner}</g></mask><mask id="edgeFade" maskUnits="userSpaceOnUse" x="0" y="0" width="${sw}" height="${sh}"><rect width="100%" height="100%" fill="black"/><rect x="${edgePadX.toFixed(1)}" y="${edgePadTop.toFixed(1)}" width="${edgeW.toFixed(1)}" height="${edgeH.toFixed(1)}" rx="${Math.max(4, edgeBlur * 1.8).toFixed(1)}" fill="white" filter="url(#edge)"/></mask></defs><g mask="url(#edgeFade)"><rect width="100%" height="100%" fill="white" mask="url(#shape)"/></g></svg>`);
}
function safeFallbackMaskSvg(crop, scale = 1) {
    const s = Math.max(.1, Math.min(1, Number(scale) || 1)), sw = Math.max(1, Math.round(Number(crop.width || 1) * s)), sh = Math.max(1, Math.round(Number(crop.height || 1) * s));
    const faces = Array.isArray(crop?.faces) && crop.faces.length ? crop.faces : [crop?.face].filter(Boolean);
    const shapes = faces.map((f0) => {
        const fx = Number(f0.x || 0) * s, fy = Number(f0.y || 0) * s, fw = Math.max(1, Number(f0.w || 1) * s), fh = Math.max(1, Number(f0.h || 1) * s), cx = fx + fw * .5, cy = fy + fh * .52;
        const earCy = fy + fh * .55, erx = Math.max(6, fw * .38), ery = Math.max(8, fh * .46), neckCy = fy + fh * 1.22, lowerCy = fy + fh * 1.52;
        return `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${Math.max(8, fw * .78).toFixed(1)}" ry="${Math.max(10, fh * .72).toFixed(1)}" fill="white"/><ellipse cx="${(fx-fw*.10).toFixed(1)}" cy="${earCy.toFixed(1)}" rx="${erx.toFixed(1)}" ry="${ery.toFixed(1)}" fill="white"/><ellipse cx="${(fx+fw*1.10).toFixed(1)}" cy="${earCy.toFixed(1)}" rx="${erx.toFixed(1)}" ry="${ery.toFixed(1)}" fill="white"/><ellipse cx="${cx.toFixed(1)}" cy="${neckCy.toFixed(1)}" rx="${Math.max(7, fw * .66).toFixed(1)}" ry="${Math.max(8, fh * .38).toFixed(1)}" fill="white"/><ellipse cx="${cx.toFixed(1)}" cy="${lowerCy.toFixed(1)}" rx="${Math.max(7, fw * .58).toFixed(1)}" ry="${Math.max(8, fh * .16).toFixed(1)}" fill="white"/>`;
    }).join('');
    const faceSizes = faces.map((f) => Math.min(Math.max(1, Number(f.w || 1) * s), Math.max(1, Number(f.h || 1) * s))), minFace = Math.max(1, Math.min(120, ...(faceSizes.length ? faceSizes : [120]))), blur = Math.max(9, Math.min(56, minFace * .20));
    return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${sh}"><defs><filter id="b" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${blur.toFixed(1)}"/></filter></defs><rect width="100%" height="100%" fill="black"/><g filter="url(#b)">${shapes}</g></svg>`);
}
async function writeStage4MaskFile(svgBuffer, fallbackCrop, scale, targetPath) {
    try {
        await sharp(svgBuffer, { limitInputPixels: false }).greyscale().png({ compressionLevel: 1, adaptiveFiltering: false }).toFile(targetPath);
        return { fallback: false };
    }
    catch (e) {
        await sharp(safeFallbackMaskSvg(fallbackCrop, scale), { limitInputPixels: false }).greyscale().png({ compressionLevel: 1, adaptiveFiltering: false }).toFile(targetPath);
        return { fallback: true, reason: String(e?.message || e).slice(0, 220) };
    }
}
function stage4StripHeight(width) {
    const cgroup = cgroupMemory(), limit = Number(cgroup.cgroupLimitMb || 0);
    // v0.17.270 emergency fallback only: keep the strip tiny.  Normal Stage 4 now
    // uses the path-only FFmpeg overlay and never builds a full source strip in Node.
    const defaultTarget = limit > 0 && limit <= 512 ? 1 : limit > 0 && limit <= 768 ? 1.5 : limit > 0 && limit <= 1024 ? 2 : 3;
    const targetMb = Math.max(.75, Math.min(4, Number(process.env.STAGE4_STRIP_TARGET_MB || defaultTarget) || defaultTarget));
    const targetBytes = targetMb * 1024 * 1024, raw = Math.floor(targetBytes / Math.max(1, width * 4));
    return Math.max(16, Math.min(96, raw || 16));
}
function encoderArgs(mimeType, width, height, pixelFormat, outputPath) {
    const size = `${width}x${height}`, jpegPixelFormat = 'yuvj444p';
    const a = ['-y', '-hide_banner', '-loglevel', 'error', '-threads', '1', '-f', 'rawvideo', '-pixel_format', pixelFormat, '-video_size', size, '-framerate', '1', '-i', 'pipe:0', '-frames:v', '1'];
    if (mimeType === 'image/png')
        a.push('-c:v', 'png', '-compression_level', '4', '-pix_fmt', 'rgba');
    else if (mimeType === 'image/webp')
        a.push('-c:v', 'libwebp', '-lossless', '1', '-quality', '100', '-compression_level', '4');
    else
        a.push('-c:v', 'mjpeg', '-q:v', '2', '-pix_fmt', jpegPixelFormat);
    a.push('-threads', '2', outputPath);
    return { args: a, jpegPixelFormat };
}
function stage4SharpCompositeAllowed(width, height, prefer = false) {
    const pixels = Math.max(1, width * height), limit = Number(cgroupMemory().cgroupLimitMb || 0);
    // v0.17.266: on Liara-sized containers the direct libvips composite can hold
    // decoded source + overlays + encoder state concurrently. Always prefer the
    // bounded strip pipeline when the cgroup is 1 GB or smaller.
    if (limit > 0 && limit <= 1024)
        return false;
    // libvips can composite/encode directly from the source without materialising a full
    // RGBA frame. Prefer it for normal camera files; keep the raw-strip encoder for very
    // large files on small containers. A repeated Stage-4 retry may bias toward Sharp,
    // but it still respects a hard pixel ceiling.
    const ceiling = prefer ? (limit > 0 && limit <= 512 ? 36_000_000 : limit > 0 && limit <= 768 ? 52_000_000 : 82_000_000) : (limit > 0 && limit <= 512 ? 26_000_000 : limit > 0 && limit <= 768 ? 40_000_000 : 68_000_000);
    return pixels <= ceiling;
}
async function stage4MaskedPatch(textureBuffer, maskBuffer, width, height) {
    const mask = await sharp(maskBuffer, { sequentialRead: true, limitInputPixels: false }).resize(width, height, { fit: 'fill', kernel: 'cubic' }).greyscale().png({ compressionLevel: 1, adaptiveFiltering: false }).toBuffer();
    return await sharp(textureBuffer, { sequentialRead: true, limitInputPixels: false }).resize(width, height, { fit: 'fill', kernel: 'cubic' }).ensureAlpha().composite([{ input: mask, left: 0, top: 0, blend: 'dest-in' }]).png({ compressionLevel: 1, adaptiveFiltering: false }).toBuffer();
}
async function stage4SharpEncode(args) {
    const { imagePath, overlays, sourceDims, outputPath, mimeType, setStep, mode } = args;
    setStep('sharp-compose');
    emit('step', { step: 'sharp-compose', status: 'start', mode, overlayCount: overlays.length, disk: diskSnapshot(path.dirname(outputPath)) });
    let pipeline = sharp(imagePath, { sequentialRead: true, limitInputPixels: false }).rotate();
    if (args.normalizeSourceColor)
        pipeline = pipeline.toColourspace('srgb');
    pipeline = pipeline.ensureAlpha().composite(overlays).withMetadata({ orientation: 1 });
    if (mimeType === 'image/png')
        await pipeline.png({ compressionLevel: 4, adaptiveFiltering: false }).toFile(outputPath);
    else if (mimeType === 'image/webp')
        await pipeline.webp({ lossless: true, quality: 100, effort: 2 }).toFile(outputPath);
    else
        await pipeline.removeAlpha().jpeg({ quality: 100, chromaSubsampling: '4:4:4', mozjpeg: false }).toFile(outputPath);
    const valid = await validateEncodedOutput(outputPath, sourceDims.width, sourceDims.height);
    if (!valid)
        throw Object.assign(new Error('stage4_sharp_output_invalid'), { debugStep: 'sharp-compose' });
    const bytes = (await fs.promises.stat(outputPath)).size;
    emit('step', { step: 'sharp-compose', status: 'done', mode, overlayCount: overlays.length, bytes, disk: diskSnapshot(path.dirname(outputPath)) });
    return { bytes, streamedBytes: 0, channels: 4, pixelFormat: 'libvips', width: sourceDims.width, height: sourceDims.height, stripHeight: 0, stripCount: 0, encoderExit: { pid: null, code: 0, signal: null, stderr: '', encoder: 'sharp' }, mode };
}
async function pasteBySharpDirect(args) {
    const masked = await stage4MaskedPatch(args.textureBuffer, args.maskBuffer, args.crop.width, args.crop.height);
    return await stage4SharpEncode({ ...args, overlays: [{ input: masked, left: args.crop.left, top: args.crop.top, blend: 'over' }], mode: 'sharp-direct' });
}
async function pasteMultipleBySharpDirect(args) {
    const overlays = [];
    for (const p of args.patches) {
        args.setStep(`sharp-mask-region-${p.regionIndex}`);
        // Normal Stage 4 is path-only. Read only the small crop assets here (never the
        // full source frame) so the disabled direct fast path works with durable checkpoints.
        const textureBuffer = p.textureBuffer || (p.texturePath ? await fs.promises.readFile(String(p.texturePath)) : null);
        const maskBuffer = p.maskBuffer || (p.maskPath ? await fs.promises.readFile(String(p.maskPath)) : null);
        if (!textureBuffer || !maskBuffer)
            throw Object.assign(new Error('stage4_sharp_patch_asset_missing'), { debugStep: `sharp-mask-region-${p.regionIndex}` });
        const masked = await stage4MaskedPatch(textureBuffer, maskBuffer, p.crop.width, p.crop.height);
        overlays.push({ input: masked, left: p.crop.left, top: p.crop.top, blend: 'over' });
    }
    return await stage4SharpEncode({ ...args, overlays, mode: 'multiface-sharp-direct-v549-disabled' });
}
function skinPixelLikely(r, g, b) {
    const y = .299 * r + .587 * g + .114 * b, cb = 128 - .168736 * r - .331264 * g + .5 * b, cr = 128 + .5 * r - .418688 * g - .081312 * b, max = Math.max(r, g, b), min = Math.min(r, g, b);
    return y > 24 && y < 246 && cb > 68 && cb < 148 && cr > 122 && cr < 198 && (max - min) > 7 && r > g * .78 && r > b * .82;
}
async function sampleSkinRgb(filePath, rect, rotate = false, maxSide = 72) {
    const rw = Math.max(1, Math.round(Number(rect.width) || 1)), rh = Math.max(1, Math.round(Number(rect.height) || 1)), scale = Math.min(1, maxSide / Math.max(rw, rh)), w = Math.max(12, Math.round(rw * scale)), h = Math.max(12, Math.round(rh * scale));
    let pipe = sharp(filePath, { sequentialRead: true, limitInputPixels: false });
    if (rotate)
        pipe = pipe.rotate();
    pipe = pipe.extract({ left: Math.max(0, Math.round(Number(rect.left) || 0)), top: Math.max(0, Math.round(Number(rect.top) || 0)), width: rw, height: rh }).resize(w, h, { fit: 'fill', kernel: 'cubic' }).toColourspace('srgb').removeAlpha();
    const raw = await pipe.raw().toBuffer();
    let n = 0, r = 0, g = 0, b = 0;
    const mask = Buffer.alloc(w * h);
    for (let i = 0; i < w * h; i++) {
        const j = i * 3, rr = raw[j], gg = raw[j + 1], bb = raw[j + 2];
        if (skinPixelLikely(rr, gg, bb)) {
            mask[i] = 255;
            n++;
            r += rr;
            g += gg;
            b += bb;
        }
    }
    return { count: n, r: n ? r / n : 0, g: n ? g / n : 0, b: n ? b / n : 0, mask, width: w, height: h };
}
async function lockPatchColorToSourceFace(args) {
    // v0.17.540: color-lock the accepted AI face(s) toward the ORIGINAL face(s),
    // never the other way around. This prevents a warm/cool AI cast from creating a
    // two-tone face boundary while preserving retouch texture and local contrast.
    if (args?.sourceMonochrome)
        return { applied: false, reason: 'monochrome-source-preserve' };
    const c = args?.crop || {}, faces = Array.isArray(c.faces) && c.faces.length ? c.faces : [c.face].filter(Boolean);
    if (Array.isArray(c.skinRects) && c.skinRects.length)
        return { applied: false, reason: 'explicit-skin-region-skip' };
    if (!faces.length)
        return { applied: false, reason: 'no-face-anchor' };
    let weight = 0, sr = 0, sg = 0, sb = 0, er = 0, eg = 0, eb = 0, sampledFaces = 0;
    for (const f of faces) {
        const fw = Math.max(1, Number(f.w) || 1), fh = Math.max(1, Number(f.h) || 1), fx = Math.max(0, Number(f.x) || 0), fy = Math.max(0, Number(f.y) || 0);
        const lx = Math.max(0, Math.round(fx + fw * .23)), ly = Math.max(0, Math.round(fy + fh * .20));
        const lw = Math.max(2, Math.min(Math.round(fw * .54), Math.round(Number(c.width) || 1) - lx)), lh = Math.max(2, Math.min(Math.round(fh * .50), Math.round(Number(c.height) || 1) - ly));
        if (lw < 2 || lh < 2)
            continue;
        const localRect = { left: lx, top: ly, width: lw, height: lh }, sourceRect = { left: Math.max(0, Math.round(Number(c.left) || 0) + lx), top: Math.max(0, Math.round(Number(c.top) || 0) + ly), width: lw, height: lh };
        try {
            const original = await sampleSkinRgb(String(args.imagePath), sourceRect, true, 72), edited = await sampleSkinRgb(String(args.texturePath), localRect, false, 72), w = Math.min(original.count, edited.count);
            if (w < 16)
                continue;
            weight += w;
            sr += original.r * w;
            sg += original.g * w;
            sb += original.b * w;
            er += edited.r * w;
            eg += edited.g * w;
            eb += edited.b * w;
            sampledFaces++;
        }
        catch { }
    }
    if (weight < 16)
        return { applied: false, reason: 'insufficient-skin-sample', sampledFaces, faceCount: faces.length };
    const original = { r: sr / weight, g: sg / weight, b: sb / weight }, edited = { r: er / weight, g: eg / weight, b: eb / weight };
    const raw = [original.r - edited.r, original.g - edited.g, original.b - edited.b], mean = (raw[0] + raw[1] + raw[2]) / 3;
    // v0.17.565 natural color lock: correct only a mild colour cast and preserve the
    // AI result's luminance/contrast. The previous brightness component could make the
    // automatic result look more processed than the same prompt used manually.
    const offsets = raw.map((d) => clampNumber((d - mean) * .42 + mean * .04, -8, 8));
    if (Math.max(...offsets.map(Math.abs)) < .85)
        return { applied: false, reason: 'already-matched-natural', offsets, sampledFaces };
    const tmp = `${args.texturePath}.colorlock-${process.pid}.png`;
    try {
        await sharp(String(args.texturePath), { sequentialRead: true, limitInputPixels: false }).toColourspace('srgb').removeAlpha().linear([1, 1, 1], offsets).png({ compressionLevel: 1, adaptiveFiltering: false }).toFile(tmp);
        await fs.promises.rename(tmp, String(args.texturePath));
    }
    finally {
        await fs.promises.rm(tmp, { force: true }).catch(() => { });
    }
    return { applied: true, reason: 'original-face-chroma-lock-v565-natural', offsets: offsets.map((x) => Number(x.toFixed(2))), originalRgb: [original.r, original.g, original.b].map((x) => Math.round(x)), editedRgb: [edited.r, edited.g, edited.b].map((x) => Math.round(x)), sampledFaces };
}

async function lockPatchBoundaryToneToSource(args) {
    // v0.17.593: match only the FEATHER BAND to the untouched source. The old center-face
    // chroma lock could still leave a visible warm/cool or brightness step around ears,
    // jaw and neck. A tiny downsample keeps this inexpensive and avoids flattening the
    // actual retouch texture.
    if (args?.sourceMonochrome) return { applied: false, reason: 'monochrome-source-preserve' };
    const c = args?.crop || {}, maxSide = 120, scale = Math.min(1, maxSide / Math.max(1, Number(c.width) || 1, Number(c.height) || 1));
    const ww = Math.max(12, Math.round((Number(c.width) || 1) * scale)), hh = Math.max(12, Math.round((Number(c.height) || 1) * scale));
    try {
        const [source, edited, mask] = await Promise.all([
            sharp(String(args.imagePath), { sequentialRead: true, limitInputPixels: false }).rotate().toColourspace('srgb').extract({ left: Math.max(0, Math.round(Number(c.left) || 0)), top: Math.max(0, Math.round(Number(c.top) || 0)), width: Math.max(1, Math.round(Number(c.width) || 1)), height: Math.max(1, Math.round(Number(c.height) || 1)) }).resize(ww, hh, { fit: 'fill', kernel: 'cubic' }).removeAlpha().raw().toBuffer(),
            sharp(String(args.texturePath), { sequentialRead: true, limitInputPixels: false }).toColourspace('srgb').resize(ww, hh, { fit: 'fill', kernel: 'cubic' }).removeAlpha().raw().toBuffer(),
            sharp(String(args.maskPath), { sequentialRead: true, limitInputPixels: false }).resize(ww, hh, { fit: 'fill', kernel: 'cubic' }).greyscale().raw().toBuffer()
        ]);
        let weight=0,sr=0,sg=0,sb=0,er=0,eg=0,eb=0;
        const pixels=Math.min(mask.length,Math.floor(source.length/3),Math.floor(edited.length/3));
        for(let i=0;i<pixels;i++){
            const a=Number(mask[i]||0)/255;
            if(a<.06||a>.94) continue;
            const j=i*3, r=source[j], g=source[j+1], b=source[j+2];
            if(!skinPixelLikely(r,g,b)) continue;
            const re=edited[j], ge=edited[j+1], be=edited[j+2];
            if(!skinPixelLikely(re,ge,be)) continue;
            const band=1-Math.min(1,Math.abs(a-.50)/.44), wt=Math.max(.10,band);
            weight+=wt; sr+=r*wt; sg+=g*wt; sb+=b*wt; er+=re*wt; eg+=ge*wt; eb+=be*wt;
        }
        if(weight<14) return { applied:false, reason:'insufficient-boundary-skin', sampleWeight:Number(weight.toFixed(2)) };
        const src=[sr/weight,sg/weight,sb/weight], edit=[er/weight,eg/weight,eb/weight];
        const srcY=.2126*src[0]+.7152*src[1]+.0722*src[2], editY=.2126*edit[0]+.7152*edit[1]+.0722*edit[2];
        const gain=clampNumber(srcY/Math.max(1,editY),.965,1.035);
        const residual=src.map((v,i)=>v-edit[i]*gain), mean=(residual[0]+residual[1]+residual[2])/3;
        const offsets=residual.map(d=>clampNumber((d-mean)*.72+mean*.42,-10,10));
        const maxOffset=Math.max(...offsets.map(Math.abs));
        if(Math.abs(gain-1)<.004&&maxOffset<.65) return { applied:false, reason:'boundary-already-matched', gain:Number(gain.toFixed(4)), offsets:offsets.map(x=>Number(x.toFixed(2))), sampleWeight:Number(weight.toFixed(2)) };
        const tmp=`${args.texturePath}.boundary-${process.pid}.png`;
        try {
            await sharp(String(args.texturePath), { sequentialRead:true, limitInputPixels:false }).toColourspace('srgb').removeAlpha().linear([gain,gain,gain],offsets).png({compressionLevel:1,adaptiveFiltering:false}).toFile(tmp);
            await fs.promises.rename(tmp,String(args.texturePath));
        } finally { await fs.promises.rm(tmp,{force:true}).catch(()=>{}); }
        return { applied:true, reason:'feather-band-tone-lock-v594', gain:Number(gain.toFixed(4)), offsets:offsets.map(x=>Number(x.toFixed(2))), sampleWeight:Number(weight.toFixed(2)) };
    } catch(e) {
        return { applied:false, reason:'boundary-tone-lock-failed', detail:String(e?.message||e).slice(0,180) };
    }
}
async function buildBodySkinTonePatches(args) {
    // v0.17.540: the public retouch service is face-only.  Never classify/recolor a
    // broad body rectangle implicitly: beige/brown clothing can be mistaken for skin
    // and produces the visible two-tone patch reported by photographers.
    if (args?.allowBodyToneHarmonization !== true) {
        emit('step', { step: 'color-match', status: 'skipped', reason: 'face-only-source-color-lock-v540' });
        return [];
    }
    if (args.sourceMonochrome) {
        emit('step', { step: 'color-match', status: 'skipped', reason: 'monochrome-source-preserve' });
        return [];
    }
    const out = [];
    let toneIndex = 0;
    for (const p of args.patches) {
        if (out.length >= 3)
            break;
        const c = p?.crop || {}, faces = Array.isArray(c.faces) && c.faces.length ? c.faces : [c.face].filter(Boolean);
        if (faces.length !== 1 || Array.isArray(c.skinRects) && c.skinRects.length)
            continue;
        const f = faces[0];
        const fw = Math.max(1, Number(f.w) || 1), fh = Math.max(1, Number(f.h) || 1), fx = Number(f.x) || 0, fy = Number(f.y) || 0;
        // Sample the inner AI face (avoid hair/jaw edge) and a conservative body strip
        // below it. The body region is source-derived and skin-masked, so clothing and
        // background stay untouched.
        const targetRect = { left: Math.max(0, Math.round(fx + fw * .20)), top: Math.max(0, Math.round(fy + fh * .18)), width: Math.max(2, Math.min(Math.round(fw * .60), Math.round(Number(c.width) || 1) - Math.max(0, Math.round(fx + fw * .20)))), height: Math.max(2, Math.min(Math.round(fh * .54), Math.round(Number(c.height) || 1) - Math.max(0, Math.round(fy + fh * .18)))) };
        const bodyLeft = Math.max(0, Math.round((Number(c.left) || 0) + fx - fw * .48)), bodyTop = Math.max(0, Math.round((Number(c.top) || 0) + fy + fh * .88)), bodyRight = Math.min(args.sourceDims.width, Math.round((Number(c.left) || 0) + fx + fw * 1.48)), bodyBottom = Math.min(args.sourceDims.height, Math.round((Number(c.top) || 0) + fy + fh * 3.10));
        let body = { left: bodyLeft, top: bodyTop, width: Math.max(0, bodyRight - bodyLeft), height: Math.max(0, bodyBottom - bodyTop) };
        if (body.width < 20 || body.height < 20)
            continue;
        const area = body.width * body.height, maxArea = 3_200_000;
        if (area > maxArea) {
            const sc = Math.sqrt(maxArea / area), nw = Math.max(20, Math.floor(body.width * sc)), nh = Math.max(20, Math.floor(body.height * sc));
            body = { left: Math.max(0, Math.min(args.sourceDims.width - nw, Math.round(body.left + (body.width - nw) / 2))), top: body.top, width: nw, height: nh };
        }
        let target, source;
        try {
            target = await sampleSkinRgb(String(p.texturePath), targetRect, false, 68);
            source = await sampleSkinRgb(args.imagePath, body, true, 96);
        }
        catch {
            continue;
        }
        if (target.count < 10 || source.count < 18)
            continue;
        const deltas = [target.r - source.r, target.g - source.g, target.b - source.b], mean = (deltas[0] + deltas[1] + deltas[2]) / 3, strength = .34, lightStrength = .10, offsets = deltas.map(d => clampNumber((d - mean) * strength + mean * lightStrength, -22, 22));
        if (Math.max(...offsets.map(Math.abs)) < 1.2)
            continue;
        toneIndex++;
        const tex = path.join(args.workDir, `stage4-body-tone-${toneIndex}.png`), mask = path.join(args.workDir, `stage4-body-tone-${toneIndex}-mask.png`);
        await sharp(args.imagePath, { sequentialRead: true, limitInputPixels: false }).rotate().extract(body).toColourspace('srgb').removeAlpha().linear([1, 1, 1], offsets).png({ compressionLevel: 1, adaptiveFiltering: false }).toFile(tex);
        // Low-resolution classification mask is intentionally upscaled only by FFmpeg at
        // final composite time; this keeps memory bounded while feathering skin islands.
        await sharp(source.mask, { raw: { width: source.width, height: source.height, channels: 1 } }).blur(.8).png({ compressionLevel: 1, adaptiveFiltering: false }).toFile(mask);
        out.push({ regionIndex: -toneIndex, kind: 'body-tone-harmonize', texturePath: tex, maskPath: mask, crop: body, toneOffsets: offsets.map((x) => Number(x.toFixed(2))), targetRgb: [target.r, target.g, target.b].map((x) => Math.round(x)), sourceRgb: [source.r, source.g, source.b].map((x) => Math.round(x)) });
    }
    if (out.length)
        emit('step', { step: 'color-match', status: 'done', mode: 'body-toward-ai-midpoint-v270', patchCount: out.length, patches: out.map((p) => ({ regionIndex: p.regionIndex, offsets: p.toneOffsets, crop: p.crop })) });
    else
        emit('step', { step: 'color-match', status: 'skipped', reason: 'no-safe-body-skin-sample' });
    return out;
}
function ffmpegImageEncoderArgs(mimeType, width, height) {
    // v0.17.540: final retouch output keeps full chroma resolution.  Stage 4 is a
    // photographic finishing pass; 4:2:0/4:2:2 can visibly soften lips, skin texture
    // and the feather boundary even when the luma channel is high quality.
    const jpegPixelFormat = 'yuvj444p';
    if (mimeType === 'image/png')
        return ['-c:v', 'png', '-compression_level', '4', '-pix_fmt', 'rgba'];
    if (mimeType === 'image/webp')
        return ['-c:v', 'libwebp', '-lossless', '1', '-quality', '100', '-compression_level', '4'];
    return ['-c:v', 'mjpeg', '-q:v', '2', '-pix_fmt', jpegPixelFormat];
}
async function spawnCapture(command, args, env = {}) {
    return await new Promise((resolve, reject) => {
        const child = spawn(command, args, { env: { ...process.env, ...env }, stdio: ['ignore', 'ignore', 'pipe'] });
        let stderr = '';
        child.stderr?.on('data', (d) => { stderr = (stderr + String(d)).slice(-9000); });
        child.once('error', reject);
        child.once('close', (code, signal) => resolve({ pid: child.pid || null, code: code == null ? null : Number(code), signal: signal || null, stderr: stderr.slice(-1800) }));
    });
}
async function pasteMultipleByMagickDisk(args) {
    const { imagePath, patches, sourceDims, outputPath, mimeType, workDir, setStep } = args;
    setStep('paste-magick-prepare');
    emit('step', { step: 'paste-magick-prepare', status: 'start', mode: 'imagemagick-disk-cache-v271', patchCount: patches.length, disk: diskSnapshot(workDir) });
    const maskedPaths = [];
    for (let i = 0; i < patches.length; i++) {
        const p = patches[i], c = p.crop || {}, w = Math.max(1, Math.round(Number(c.width) || 1)), h = Math.max(1, Math.round(Number(c.height) || 1)), masked = path.join(workDir, `stage4-magick-patch-${String(i + 1).padStart(2, '0')}.png`);
        const mask = await sharp(String(p.maskPath), { sequentialRead: true, limitInputPixels: false }).resize(w, h, { fit: 'fill', kernel: 'cubic' }).greyscale().png({ compressionLevel: 1, adaptiveFiltering: false }).toBuffer();
        await sharp(String(p.texturePath), { sequentialRead: true, limitInputPixels: false }).resize(w, h, { fit: 'fill', kernel: 'cubic' }).ensureAlpha().composite([{ input: mask, left: 0, top: 0, blend: 'dest-in' }]).png({ compressionLevel: 1, adaptiveFiltering: false }).toFile(masked);
        maskedPaths.push(masked);
        emit('step', { step: 'paste-magick-prepare', status: 'running', index: i + 1, count: patches.length, regionIndex: p.regionIndex, patchBytes: (await fs.promises.stat(masked)).size, memoryMode: 'region-only' });
    }
    const common = ['-limit', 'thread', '1', '-limit', 'memory', '40MiB', '-limit', 'map', '48MiB', '-limit', 'area', '12MP', '-limit', 'disk', '3GiB', imagePath, '-auto-orient', '-alpha', 'on'];
    for (let i = 0; i < patches.length; i++) {
        const c = patches[i].crop || {}, x = Math.max(0, Math.round(Number(c.left) || 0)), y = Math.max(0, Math.round(Number(c.top) || 0));
        common.push(maskedPaths[i], '-geometry', `+${x}+${y}`, '-compose', 'over', '-composite');
    }
    if (mimeType === 'image/jpeg')
        common.push('-alpha', 'off', '-sampling-factor', '4:4:4', '-quality', '100');
    else if (mimeType === 'image/webp')
        common.push('-quality', '100', '-define', 'webp:lossless=true');
    else
        common.push('-define', 'png:compression-level=4');
    common.push(outputPath);
    const candidates = [String(process.env.IMAGEMAGICK_BINARY || '').trim(), '/opt/imagemagick/bin/magick', 'magick', 'convert'].filter(Boolean);
    let lastErr = null;
    setStep('paste-encode');
    emit('step', { step: 'paste-encode', status: 'start', mode: 'imagemagick-disk-cache-v271', patchCount: patches.length, sourceDimensions: sourceDims, memoryLimitMb: 40, mapLimitMb: 48, disk: diskSnapshot(workDir) });
    for (const bin of candidates) {
        try {
            const exit = await spawnCapture(bin, common, { MAGICK_TEMPORARY_PATH: workDir, MAGICK_MEMORY_LIMIT: '40MiB', MAGICK_MAP_LIMIT: '48MiB', MAGICK_DISK_LIMIT: '3GiB', MAGICK_THREAD_LIMIT: '1', OMP_NUM_THREADS: '1' });
            if (exit.code === 0 && await validateEncodedOutput(outputPath, sourceDims.width, sourceDims.height)) {
                const bytes = (await fs.promises.stat(outputPath)).size;
                emit('step', { step: 'paste-encode', status: 'done', mode: 'imagemagick-disk-cache-v271', binary: bin, bytes, encoderExit: { ...exit, encoder: 'imagemagick' }, disk: diskSnapshot(workDir) });
                return { bytes, streamedBytes: 0, channels: 4, pixelFormat: 'imagemagick-disk-cache', width: sourceDims.width, height: sourceDims.height, stripHeight: 0, stripCount: 0, encoderExit: { ...exit, encoder: 'imagemagick' }, mode: 'imagemagick-disk-cache-v271' };
            }
            lastErr = Object.assign(new Error(`stage4_magick_failed_${exit.code ?? 'null'}`), { exit });
        }
        catch (e) {
            lastErr = e;
            if (String(e?.code || '') === 'ENOENT')
                continue;
        }
    }
    const e = new Error('stage4_magick_unavailable_or_failed');
    e.debugStep = 'paste-encode';
    e.debugDetail = String(lastErr?.exit?.stderr || lastErr?.message || lastErr || 'ImageMagick unavailable').slice(-900);
    throw e;
}
async function applyStage4PatchInChild(inputPath, patchPath, outputPath, x, y, rotate) {
    // v0.17.276: keep Stage 4 in one process. Spawning a second Node/libvips
    // instance caused cgroup SIGKILL on large Liara photos before the tile began.
    let pipe = sharp(inputPath, { sequentialRead: true, limitInputPixels: false });
    if (rotate)
        pipe = pipe.rotate();
    await pipe.composite([{ input: patchPath, left: x, top: y, blend: 'over' }]).tiff({ compression: 'deflate', quality: 90, tile: true, tileWidth: 256, tileHeight: 256, pyramid: false }).toFile(outputPath);
    return true;
}
async function encodeStage4FinalFromPath(inputPath, outputPath, mimeType) {
    // v0.17.276: no encoder child worker; encode from the tiled path in-process.
    let pipe = sharp(inputPath, { sequentialRead: true, limitInputPixels: false }).toColourspace('srgb');
    if (mimeType === 'image/png')
        pipe = pipe.png({ compressionLevel: 6, adaptiveFiltering: false });
    else if (mimeType === 'image/webp')
        pipe = pipe.webp({ quality: 98, lossless: true, effort: 3 });
    else
        pipe = pipe.jpeg({ quality: 100, chromaSubsampling: '4:4:4', mozjpeg: false, progressive: false, optimizeCoding: false, trellisQuantisation: false, overshootDeringing: false, optimizeScans: false });
    await pipe.toFile(outputPath);
}
async function pasteMultipleBySharpTiledDisk(args) {
    const { imagePath, patches, sourceDims, outputPath, mimeType, workDir, setStep } = args;
    setStep('paste-disk-prepare');
    emit('step', { step: 'paste-disk-prepare', status: 'start', mode: 'sharp-tiled-disk-v276-single-process', patchCount: patches.length, sourceDimensions: sourceDims, sharpCacheMb: 0, disk: diskSnapshot(workDir) });
    const maskedPaths = [];
    const cleanup = new Set();
    try {
        for (let i = 0; i < patches.length; i++) {
            const p = patches[i], c = p.crop || {}, w = Math.max(1, Math.round(Number(c.width) || 1)), h = Math.max(1, Math.round(Number(c.height) || 1));
            const maskResized = path.join(workDir, `stage4-tiled-mask-${String(i + 1).padStart(2, '0')}.png`), masked = path.join(workDir, `stage4-tiled-patch-${String(i + 1).padStart(2, '0')}.png`);
            cleanup.add(maskResized);
            cleanup.add(masked);
            await sharp(String(p.maskPath), { sequentialRead: true, limitInputPixels: false }).resize(w, h, { fit: 'fill', kernel: 'cubic' }).greyscale().png({ compressionLevel: 1, adaptiveFiltering: false }).toFile(maskResized);
            await sharp(String(p.texturePath), { sequentialRead: true, limitInputPixels: false }).resize(w, h, { fit: 'fill', kernel: 'cubic' }).toColourspace('srgb').ensureAlpha().composite([{ input: maskResized, left: 0, top: 0, blend: 'dest-in' }]).png({ compressionLevel: 1, adaptiveFiltering: false }).toFile(masked);
            maskedPaths.push(masked);
            emit('step', { step: 'paste-disk-prepare', status: 'running', mode: 'sharp-tiled-disk-v276-single-process', index: i + 1, count: patches.length, regionIndex: p.regionIndex, patchBytes: (await fs.promises.stat(masked)).size, memory: memorySnapshot(), disk: diskSnapshot(workDir) });
        }
        let currentPath = imagePath, ownedCurrent = false;
        for (let i = 0; i < patches.length; i++) {
            const p = patches[i], c = p.crop || {}, x = Math.max(0, Math.round(Number(c.left) || 0)), y = Math.max(0, Math.round(Number(c.top) || 0));
            const nextPath = path.join(workDir, `stage4-tiled-pass-${String(i + 1).padStart(2, '0')}.tif`);
            cleanup.add(nextPath);
            setStep('paste-disk-tile');
            emit('step', { step: 'paste-disk-tile', status: 'start', mode: 'sharp-tiled-disk-v276-single-process', index: i + 1, count: patches.length, regionIndex: p.regionIndex, disk: diskSnapshot(workDir) });
            const childApplied = await applyStage4PatchInChild(currentPath, maskedPaths[i], nextPath, x, y, !ownedCurrent);
            if (!childApplied) {
                let pipe = sharp(currentPath, { sequentialRead: true, limitInputPixels: false });
                if (!ownedCurrent)
                    pipe = pipe.rotate();
                if (args.normalizeSourceColor)
                    pipe = pipe.toColourspace('srgb');
                await pipe.composite([{ input: maskedPaths[i], left: x, top: y, blend: 'over' }]).tiff({ compression: 'deflate', quality: 90, tile: true, tileWidth: 256, tileHeight: 256, pyramid: false }).toFile(nextPath);
            }
            if (ownedCurrent) {
                await fs.promises.rm(currentPath, { force: true }).catch(() => { });
                cleanup.delete(currentPath);
            }
            currentPath = nextPath;
            ownedCurrent = true;
            emit('step', { step: 'paste-disk-tile', status: 'done', mode: 'sharp-tiled-disk-v276-single-process', index: i + 1, count: patches.length, regionIndex: p.regionIndex, intermediateBytes: (await fs.promises.stat(currentPath)).size, memory: memorySnapshot(), disk: diskSnapshot(workDir) });
        }
        setStep('paste-disk-encode');
        emit('step', { step: 'paste-disk-encode', status: 'start', mode: 'sharp-tiled-disk-v276-single-process', sourceDimensions: sourceDims, memory: memorySnapshot(), disk: diskSnapshot(workDir) });
        await encodeStage4FinalFromPath(currentPath, outputPath, mimeType);
        const valid = await validateEncodedOutput(outputPath, sourceDims.width, sourceDims.height);
        if (!valid) {
            const e = new Error('stage4_tiled_disk_output_invalid');
            e.debugStep = 'paste-disk-encode';
            e.debugDetail = 'The disk-backed libvips compositor produced an invalid final image.';
            throw e;
        }
        const bytes = (await fs.promises.stat(outputPath)).size;
        emit('step', { step: 'paste-disk-encode', status: 'done', mode: 'sharp-tiled-disk-v276-single-process', bytes, memory: memorySnapshot(), disk: diskSnapshot(workDir) });
        return { bytes, streamedBytes: 0, channels: 4, pixelFormat: 'sharp-tiled-disk', width: sourceDims.width, height: sourceDims.height, stripHeight: 256, stripCount: Math.ceil(sourceDims.height / 256), encoderExit: { pid: process.pid, code: 0, signal: null, encoder: 'sharp-libvips-tiled' }, patchCount: patches.length, mode: 'sharp-tiled-disk-v276-single-process' };
    }
    finally {
        for (const fp of cleanup)
            await fs.promises.rm(fp, { force: true }).catch(() => { });
        sharp.cache(false);
    }
}
async function pasteMultipleSafest(args) {
    const pixels = Math.max(1, args.sourceDims.width * args.sourceDims.height), limit = Number(cgroupMemory().cgroupLimitMb || 0), heavy = pixels >= 8_000_000 || (limit > 0 && limit <= 1536);
    const patchCount = Array.isArray(args.patches) ? args.patches.length : 0;
    const directSharpCeiling = 0, directSharpAllowed = false;
    const fastOverlayAllowed = Boolean(args.ffmpegPath) && patchCount > 0 && patchCount <= 16 && !(limit > 0 && limit <= 512 && pixels > 42_000_000);
    emit('step', { step: 'paste-backend-select', status: 'done', selected: fastOverlayAllowed ? 'ffmpeg-one-pass-overlay-v593' : 'imagemagick-disk-first-v593', heavy, pixels, patchCount, cgroupLimitMb: limit || null, fastOverlayAllowed, directSharpAllowed, directSharpCeiling });
    if (fastOverlayAllowed) {
        try { return await pasteByFfmpegOverlayPaths(args, false); }
        catch (e) {
            await fs.promises.rm(args.outputPath, { force: true }).catch(() => {});
            emit('step', { step: 'paste-fast-fallback', status: 'done', from: 'ffmpeg-one-pass-overlay-v593', reason: String(e?.message || e), detail: String(e?.debugDetail || '').slice(0, 360), probableOom: Boolean(e?.probableOom), disk: diskSnapshot(args.workDir) });
            // One conservative retry is cheaper than releasing the whole order back to the
            // queue. Skip it only after a likely OOM/SIGKILL.
            if (!e?.probableOom) {
                try { return await pasteByFfmpegOverlayPaths(args, true); }
                catch (e2) {
                    await fs.promises.rm(args.outputPath, { force: true }).catch(() => {});
                    emit('step', { step: 'paste-fast-retry-fallback', status: 'done', from: 'ffmpeg-one-pass-overlay-v593-conservative', reason: String(e2?.message || e2), detail: String(e2?.debugDetail || '').slice(0, 360), disk: diskSnapshot(args.workDir) });
                }
            }
        }
    }
    // Disk-backed ImageMagick is the safest second path for large photographs and avoids
    // a full libvips source decode after FFmpeg failed.
    try { return await pasteMultipleByMagickDisk(args); }
    catch (e) { emit('step', { step: 'paste-disk-fallback', status: 'done', from: 'imagemagick-disk-cache-v593', reason: String(e?.message || e), detail: String(e?.debugDetail || '').slice(0, 360), disk: diskSnapshot(args.workDir) }); }
    try { return await pasteMultipleBySharpTiledDisk(args); }
    catch (e) {
        emit('step', { step: 'paste-disk-fallback', status: 'done', from: 'sharp-tiled-disk-v593', reason: String(e?.message || e), detail: String(e?.debugDetail || '').slice(0, 360), disk: diskSnapshot(args.workDir) });
        if (heavy) {
            const err = new Error('stage4_all_safe_compositors_failed');
            err.debugStep = String(e?.debugStep || 'paste-disk-tile');
            err.debugDetail = `All safe Stage 4 compositors failed; the saved AI output is intact: ${String(e?.debugDetail || e?.message || e).slice(0, 260)}`;
            throw err;
        }
    }
    emit('step', { step: 'paste-backend-select', status: 'fallback', selected: 'legacy-strip-ffmpeg-small-only', heavy: false });
    return await pasteMultipleByStreamingStrips(args);
}
async function pasteByFfmpegOverlayPaths(args, conservative = false) {
    const { imagePath, patches, sourceDims, outputPath, mimeType, ffmpegPath, setStep } = args;
    setStep('paste-encode');
    const ffArgs = ['-y', '-hide_banner', '-loglevel', 'error', '-threads', '1', '-filter_threads', conservative ? '1' : '2', '-filter_complex_threads', conservative ? '1' : '2', '-i', imagePath];
    for (const p of patches) {
        ffArgs.push('-i', String(p.texturePath), '-i', String(p.maskPath));
    }
    const filters = ['[0:v]format=rgba[base0]'];
    let prev = 'base0';
    patches.forEach((p, i) => { const tex = 1 + i * 2, mask = tex + 1, c = p.crop || {}, w = Math.max(1, Math.round(Number(c.width) || 1)), h = Math.max(1, Math.round(Number(c.height) || 1)), x = Math.max(0, Math.round(Number(c.left) || 0)), y = Math.max(0, Math.round(Number(c.top) || 0)); filters.push(`[${tex}:v]scale=${w}:${h}:flags=bicubic,format=rgba[tex${i}]`); filters.push(`[${mask}:v]scale=${w}:${h}:flags=bicubic,format=gray[mask${i}]`); filters.push(`[tex${i}][mask${i}]alphamerge[patch${i}]`); filters.push(`[${prev}][patch${i}]overlay=x=${x}:y=${y}:format=auto:eof_action=pass[out${i}]`); prev = `out${i}`; });
    filters.push(`[${prev}]format=rgba[final]`);
    ffArgs.push('-filter_complex', filters.join(';'), '-map', '[final]', '-frames:v', '1', ...ffmpegImageEncoderArgs(mimeType, sourceDims.width, sourceDims.height), '-threads', '2', outputPath);
    emit('step', { step: 'paste-encode', status: 'start', mode: conservative ? 'ffmpeg-one-pass-overlay-v593-conservative' : 'ffmpeg-one-pass-overlay-v593', patchCount: patches.length, sourceDimensions: sourceDims, disk: diskSnapshot(path.dirname(outputPath)) });
    const child = spawn(ffmpegPath, ffArgs, { env: { ...process.env, OMP_NUM_THREADS: '1', OPENBLAS_NUM_THREADS: '1', MKL_NUM_THREADS: '1' }, stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr?.on('data', (d) => { stderr = (stderr + String(d)).slice(-9000); });
    const beat = setInterval(() => emit('step', { step: 'paste-encode', status: 'running', mode: conservative ? 'ffmpeg-one-pass-overlay-v593-conservative' : 'ffmpeg-one-pass-overlay-v593', encoderPid: child.pid || null, encoderRssMb: processRssMb(Number(child.pid || 0)), patchCount: patches.length, disk: diskSnapshot(path.dirname(outputPath)) }), 2000);
    beat.unref?.();
    const closePromise = new Promise((resolve, reject) => { child.once('error', reject); child.once('close', (code, signal) => resolve({ pid: child.pid || null, code: code == null ? null : Number(code), signal: signal || null, stderr: stderr.slice(-1800), encoder: 'ffmpeg-overlay' })); });
    // v0.17.592: a stuck FFmpeg child used to keep the order in "compositing"
    // indefinitely. Bound the local encode; healthy encodes still emit heartbeats.
    const exit = await waitEncoderCloseWithTimeout(closePromise, child, stage4EncoderWaitMs(sourceDims.width, sourceDims.height)).finally(() => clearInterval(beat));
    const valid = await validateEncodedOutput(outputPath, sourceDims.width, sourceDims.height);
    if (exit.code !== 0 || !valid) {
        const killed = String(exit.signal || '').toUpperCase() === 'SIGKILL';
        const e = new Error(killed ? 'stage4_encoder_sigkill' : `stage4_overlay_failed_${exit.code ?? 'null'}`);
        e.encoderExit = exit;
        e.probableOom = killed;
        e.debugStep = 'paste-encode';
        e.debugDetail = killed ? 'Stage 4 path-only FFmpeg overlay received SIGKILL. AI/checkpoints remain saved.' : `FFmpeg path-only overlay failed code=${exit.code ?? 'null'} signal=${exit.signal || 'none'} · ${stderr.slice(-900)}`;
        throw e;
    }
    const bytes = (await fs.promises.stat(outputPath)).size;
    emit('step', { step: 'paste-encode', status: 'done', mode: conservative ? 'ffmpeg-one-pass-overlay-v593-conservative' : 'ffmpeg-one-pass-overlay-v593', patchCount: patches.length, bytes, encoderExit: exit, disk: diskSnapshot(path.dirname(outputPath)) });
    return { bytes, streamedBytes: 0, channels: 4, pixelFormat: 'ffmpeg-overlay', width: sourceDims.width, height: sourceDims.height, stripHeight: 0, stripCount: 1, encoderExit: exit, patchCount: patches.length, mode: conservative ? 'ffmpeg-one-pass-overlay-v593-conservative' : 'ffmpeg-one-pass-overlay-v593' };
}
function stage4EncoderWaitMs(width, height) { return Math.max(45_000, Math.min(120_000, Math.round((Math.max(1, width * height) / 1_000_000) * 2500))); }
async function waitEncoderCloseWithTimeout(closePromise, encoder, timeoutMs) {
    let timer;
    try {
        return await Promise.race([closePromise, new Promise((_, reject) => { timer = setTimeout(() => { try {
                encoder.kill('SIGKILL');
            }
            catch { } const e = new Error('stage4_encoder_close_timeout'); e.debugStep = 'paste-encode'; e.debugDetail = `Stage 4 encoder did not finish within ${Math.round(timeoutMs / 1000)} seconds after the final strip.`; reject(e); }, timeoutMs); timer.unref?.(); })]);
    }
    finally {
        if (timer)
            clearTimeout(timer);
    }
}
function waitDrain(stream, encoder, timeoutMs = 30_000) {
    return new Promise((resolve, reject) => {
        let done = false, timer = null;
        const finish = (err) => { if (done)
            return; done = true; if (timer)
            clearTimeout(timer); stream.off('drain', onDrain); stream.off('error', onError); encoder.off('close', onClose); err ? reject(err) : resolve(); };
        const onDrain = () => finish(), onError = (e) => finish(e), onClose = (code, signal) => finish(Object.assign(new Error(`encoder_closed_during_backpressure_${code ?? 'null'}_${signal || 'none'}`), { encoderCode: code, encoderSignal: signal }));
        stream.once('drain', onDrain);
        stream.once('error', onError);
        encoder.once('close', onClose);
        timer = setTimeout(() => { const e = new Error('stage4_encoder_backpressure_timeout'); e.debugStep = 'paste-encode'; e.debugDetail = `Stage 4 encoder accepted no more image data for ${Math.round(timeoutMs / 1000)} seconds.`; finish(e); }, timeoutMs);
        timer.unref?.();
    });
}
async function pasteByStreamingStrips(args) {
    const { imagePath, textureBuffer, maskBuffer, crop, sourceDims, outputPath, mimeType, ffmpegPath, setStep } = args;
    const mode = args.lowDiskMode ? 'strip-pipe-ffmpeg-low-disk' : 'strip-pipe-ffmpeg-memory-patch';
    const stripHeight = stage4StripHeight(sourceDims.width), count = Math.ceil(sourceDims.height / stripHeight), channels = 4, pixelFormat = 'rgba', rawFrameBytes = sourceDims.width * sourceDims.height * channels;
    if (!Number.isSafeInteger(rawFrameBytes) || rawFrameBytes > 3_700_000_000)
        throw new Error(`stage4_frame_too_large_${rawFrameBytes}`);
    const enc = encoderArgs(mimeType, sourceDims.width, sourceDims.height, pixelFormat, outputPath);
    emit('step', { step: 'paste-plan', status: 'done', mode, stripHeight, stripCount: count, channels, pixelFormat, rawFrameBytes, rawSpoolBytes: 0, sourceDimensions: sourceDims, disk: diskSnapshot(path.dirname(outputPath)), outputPixelFormat: mimeType === 'image/jpeg' ? enc.jpegPixelFormat : null });
    setStep('paste-encode');
    const encoder = spawn(ffmpegPath, enc.args, { env: { ...process.env, OMP_NUM_THREADS: '1', OPENBLAS_NUM_THREADS: '1', MKL_NUM_THREADS: '1' }, stdio: ['pipe', 'ignore', 'pipe'] });
    let encoderStderr = '', encoderSpawnError = null, encoderClosed = null;
    const encoderClose = new Promise((resolve) => {
        encoder.on('error', (err) => { encoderSpawnError = err; });
        encoder.on('close', (code, signal) => { encoderClosed = { pid: encoder.pid || null, code: code == null ? null : Number(code), signal: signal || null, stderr: encoderStderr.slice(-1400), encoder: 'ffmpeg' }; resolve(encoderClosed); });
    });
    encoder.stderr?.on('data', (d) => { encoderStderr = (encoderStderr + String(d)).slice(-7000); });
    emit('step', { step: 'paste-encode', status: 'start', encoderPid: encoder.pid || null, encoderBinary: path.basename(ffmpegPath), outputPixelFormat: mimeType === 'image/jpeg' ? enc.jpegPixelFormat : null, disk: diskSnapshot(path.dirname(outputPath)) });
    const encBeat = setInterval(() => emit('step', { step: 'paste-encode', status: 'running', encoderPid: encoder.pid || null, encoderRssMb: processRssMb(Number(encoder.pid || 0)), disk: diskSnapshot(path.dirname(outputPath)) }), 2000);
    encBeat.unref?.();
    let streamedBytes = 0;
    try {
        if (!encoder.stdin)
            throw new Error('stage4_encoder_stdin_missing');
        for (let index = 0; index < count; index++) {
            if (encoderClosed)
                throw Object.assign(new Error('stage4_encoder_closed_early'), { encoderExit: encoderClosed });
            const y = index * stripHeight, h = Math.min(stripHeight, sourceDims.height - y), overlapTop = Math.max(y, crop.top), overlapBottom = Math.min(y + h, crop.top + crop.height), hasPatch = overlapBottom > overlapTop;
            setStep('paste-strip');
            emit('step', { step: 'paste-strip', status: 'start', index: index + 1, count, y, height: h, hasPatch, streamedBytes, encoderPid: encoder.pid || null });
            let pipeline = sharp(imagePath, { sequentialRead: true, limitInputPixels: false }).rotate();
            if (args.normalizeSourceColor)
                pipeline = pipeline.toColourspace('srgb');
            pipeline = pipeline.extract({ left: 0, top: y, width: sourceDims.width, height: h }).ensureAlpha();
            if (hasPatch) {
                const patchTop = overlapTop - crop.top, patchHeight = overlapBottom - overlapTop;
                const maskSlice = await sharp(maskBuffer, { sequentialRead: true, limitInputPixels: false }).resize(crop.width, crop.height, { fit: 'fill', kernel: 'cubic' }).extract({ left: 0, top: patchTop, width: crop.width, height: patchHeight }).png({ compressionLevel: 1, adaptiveFiltering: false }).toBuffer();
                const patchSlice = await sharp(textureBuffer, { sequentialRead: true, limitInputPixels: false }).extract({ left: 0, top: patchTop, width: crop.width, height: patchHeight }).ensureAlpha().composite([{ input: maskSlice, left: 0, top: 0, blend: 'dest-in' }]).png({ compressionLevel: 1, adaptiveFiltering: false }).toBuffer();
                pipeline = pipeline.composite([{ input: patchSlice, left: crop.left, top: overlapTop - y, blend: 'over' }]);
            }
            const raw = await pipeline.raw().toBuffer({ resolveWithObject: true });
            if (Number(raw.info?.width) !== sourceDims.width || Number(raw.info?.height) !== h || Number(raw.info?.channels) !== channels)
                throw new Error(`strip-raw=${raw.info?.width}x${raw.info?.height}x${raw.info?.channels}`);
            const ok = encoder.stdin.write(raw.data);
            streamedBytes += raw.data.length;
            // Drop the current raw Buffer before waiting for more encoder capacity. Node's
            // writable highWaterMark plus this await bounds queued raw data to a tiny amount.
            if (!ok)
                await waitDrain(encoder.stdin, encoder);
            emit('step', { step: 'paste-strip', status: 'done', index: index + 1, count, y, height: h, hasPatch, rawBytes: raw.data.length, streamedBytes, encoderPid: encoder.pid || null, encoderRssMb: processRssMb(Number(encoder.pid || 0)), disk: diskSnapshot(path.dirname(outputPath)) });
        }
        setStep('paste-encode');
        encoder.stdin.end();
        const exit = await waitEncoderCloseWithTimeout(encoderClose, encoder, stage4EncoderWaitMs(sourceDims.width, sourceDims.height));
        if (encoderSpawnError)
            throw Object.assign(new Error(`stage4_encoder_spawn_failed: ${encoderSpawnError?.message || encoderSpawnError}`), { encoderExit: exit });
        const validOutput = await validateEncodedOutput(outputPath, sourceDims.width, sourceDims.height);
        if (exit?.code !== 0 || !validOutput) {
            if (validOutput) {
                emit('step', { step: 'paste-encode', status: 'recovered-valid-output', encoderPid: encoder.pid || null, encoderExit: exit, bytes: (await fs.promises.stat(outputPath)).size });
            }
            else {
                const killed = String(exit?.signal || '').toUpperCase() === 'SIGKILL';
                throw Object.assign(new Error(killed ? 'stage4_encoder_sigkill' : `stage4_encoder_failed_${exit?.code ?? 'null'}`), { encoderExit: exit, probableOom: killed, debugDetail: killed ? 'Stage 4 streaming encoder received SIGKILL; probable container memory kill. Saved Stage 3 AI output is intact.' : `Stage 4 streaming encoder exited code=${exit?.code ?? 'null'} signal=${exit?.signal || 'none'}${exit?.stderr ? ` · ${String(exit.stderr).slice(-700)}` : ''}` });
            }
        }
        const bytes = (await fs.promises.stat(outputPath)).size;
        emit('step', { step: 'paste-encode', status: 'done', encoderPid: encoder.pid || null, encoderExit: exit, bytes, streamedBytes, disk: diskSnapshot(path.dirname(outputPath)) });
        return { bytes, streamedBytes, channels, pixelFormat, width: sourceDims.width, height: sourceDims.height, stripHeight, stripCount: count, encoderExit: exit };
    }
    catch (e) {
        try {
            encoder.stdin?.destroy();
        }
        catch { }
        try {
            if (!encoderClosed)
                encoder.kill('SIGKILL');
        }
        catch { }
        const exit = encoderClosed || await Promise.race([encoderClose, new Promise(r => setTimeout(() => r(null), 1200))]);
        if (exit && !e.encoderExit)
            e.encoderExit = exit;
        throw e;
    }
    finally {
        clearInterval(encBeat);
    }
}
async function pasteMultipleByStreamingStrips(args) {
    const { imagePath, patches, sourceDims, outputPath, mimeType, ffmpegPath, setStep } = args, mode = args.lowDiskMode ? 'multiface-strip-pipe-ffmpeg-low-disk' : 'multiface-strip-pipe-ffmpeg', stripHeight = stage4StripHeight(sourceDims.width), count = Math.ceil(sourceDims.height / stripHeight), channels = 4, pixelFormat = 'rgba', rawFrameBytes = sourceDims.width * sourceDims.height * channels;
    if (!Number.isSafeInteger(rawFrameBytes) || rawFrameBytes > 3_700_000_000)
        throw new Error(`stage4_frame_too_large_${rawFrameBytes}`);
    const enc = encoderArgs(mimeType, sourceDims.width, sourceDims.height, pixelFormat, outputPath);
    emit('step', { step: 'paste-plan', status: 'done', mode, patchCount: patches.length, stripHeight, stripCount: count, channels, pixelFormat, rawFrameBytes, rawSpoolBytes: 0, sourceDimensions: sourceDims, disk: diskSnapshot(path.dirname(outputPath)), outputPixelFormat: mimeType === 'image/jpeg' ? enc.jpegPixelFormat : null });
    setStep('paste-encode');
    const encoder = spawn(ffmpegPath, enc.args, { env: { ...process.env, OMP_NUM_THREADS: '1', OPENBLAS_NUM_THREADS: '1', MKL_NUM_THREADS: '1' }, stdio: ['pipe', 'ignore', 'pipe'] });
    let encoderStderr = '', encoderSpawnError = null, encoderClosed = null;
    const encoderClose = new Promise((resolve) => { encoder.on('error', (err) => { encoderSpawnError = err; }); encoder.on('close', (code, signal) => { encoderClosed = { pid: encoder.pid || null, code: code == null ? null : Number(code), signal: signal || null, stderr: encoderStderr.slice(-1400), encoder: 'ffmpeg' }; resolve(encoderClosed); }); });
    encoder.stderr?.on('data', (d) => { encoderStderr = (encoderStderr + String(d)).slice(-7000); });
    emit('step', { step: 'paste-encode', status: 'start', encoderPid: encoder.pid || null, encoderBinary: path.basename(ffmpegPath), patchCount: patches.length, disk: diskSnapshot(path.dirname(outputPath)) });
    const encBeat = setInterval(() => emit('step', { step: 'paste-encode', status: 'running', encoderPid: encoder.pid || null, encoderRssMb: processRssMb(Number(encoder.pid || 0)), patchCount: patches.length, disk: diskSnapshot(path.dirname(outputPath)) }), 2000);
    encBeat.unref?.();
    let streamedBytes = 0;
    try {
        for (let index = 0; index < count; index++) {
            if (encoderClosed)
                throw Object.assign(new Error('stage4_encoder_closed_early'), { encoderExit: encoderClosed });
            const y = index * stripHeight, h = Math.min(stripHeight, sourceDims.height - y), active = patches.filter((p) => Math.min(y + h, p.crop.top + p.crop.height) > Math.max(y, p.crop.top));
            setStep('paste-strip');
            emit('step', { step: 'paste-strip', status: 'start', index: index + 1, count, y, height: h, patches: active.map((p) => p.regionIndex), streamedBytes, encoderPid: encoder.pid || null });
            let pipeline = sharp(imagePath, { sequentialRead: true, limitInputPixels: false }).rotate();
            if (args.normalizeSourceColor)
                pipeline = pipeline.toColourspace('srgb');
            pipeline = pipeline.extract({ left: 0, top: y, width: sourceDims.width, height: h }).ensureAlpha();
            const overlays = [];
            for (const p of active) {
                const crop = p.crop, overlapTop = Math.max(y, crop.top), overlapBottom = Math.min(y + h, crop.top + crop.height), patchTop = overlapTop - crop.top, patchHeight = overlapBottom - overlapTop;
                if (patchHeight <= 0)
                    continue;
                const maskInput = p.maskPath || p.maskBuffer, textureInput = p.texturePath || p.textureBuffer;
                if (!maskInput || !textureInput)
                    throw new Error(`stage4_region_asset_missing_${p.regionIndex}`);
                const maskSlice = await sharp(maskInput, { sequentialRead: true, limitInputPixels: false }).resize(crop.width, crop.height, { fit: 'fill', kernel: 'cubic' }).extract({ left: 0, top: patchTop, width: crop.width, height: patchHeight }).png({ compressionLevel: 1, adaptiveFiltering: false }).toBuffer(), patchSlice = await sharp(textureInput, { sequentialRead: true, limitInputPixels: false }).extract({ left: 0, top: patchTop, width: crop.width, height: patchHeight }).ensureAlpha().composite([{ input: maskSlice, left: 0, top: 0, blend: 'dest-in' }]).png({ compressionLevel: 1, adaptiveFiltering: false }).toBuffer();
                overlays.push({ input: patchSlice, left: crop.left, top: overlapTop - y, blend: 'over' });
            }
            if (overlays.length)
                pipeline = pipeline.composite(overlays);
            const raw = await pipeline.raw().toBuffer({ resolveWithObject: true });
            if (Number(raw.info?.width) !== sourceDims.width || Number(raw.info?.height) !== h || Number(raw.info?.channels) !== channels)
                throw new Error(`strip-raw=${raw.info?.width}x${raw.info?.height}x${raw.info?.channels}`);
            const ok = encoder.stdin.write(raw.data);
            streamedBytes += raw.data.length;
            if (!ok)
                await waitDrain(encoder.stdin, encoder);
            emit('step', { step: 'paste-strip', status: 'done', index: index + 1, count, y, height: h, patches: active.map((p) => p.regionIndex), rawBytes: raw.data.length, streamedBytes, encoderPid: encoder.pid || null, encoderRssMb: processRssMb(Number(encoder.pid || 0)), disk: diskSnapshot(path.dirname(outputPath)) });
        }
        setStep('paste-encode');
        encoder.stdin.end();
        const exit = await waitEncoderCloseWithTimeout(encoderClose, encoder, stage4EncoderWaitMs(sourceDims.width, sourceDims.height));
        if (encoderSpawnError)
            throw Object.assign(new Error(`stage4_encoder_spawn_failed: ${encoderSpawnError?.message || encoderSpawnError}`), { encoderExit: exit });
        const validOutput = await validateEncodedOutput(outputPath, sourceDims.width, sourceDims.height);
        if (exit?.code !== 0 || !validOutput) {
            if (validOutput) {
                emit('step', { step: 'paste-encode', status: 'recovered-valid-output', encoderPid: encoder.pid || null, encoderExit: exit, bytes: (await fs.promises.stat(outputPath)).size, patchCount: patches.length });
            }
            else {
                const killed = String(exit?.signal || '').toUpperCase() === 'SIGKILL';
                throw Object.assign(new Error(killed ? 'stage4_encoder_sigkill' : `stage4_encoder_failed_${exit?.code ?? 'null'}`), { encoderExit: exit, probableOom: killed, debugDetail: killed ? 'Multi-face Stage 4 streaming encoder received SIGKILL; saved AI region outputs are intact.' : `Multi-face Stage 4 encoder exited code=${exit?.code ?? 'null'} signal=${exit?.signal || 'none'}${exit?.stderr ? ` · ${String(exit.stderr).slice(-700)}` : ''}` });
            }
        }
        const bytes = (await fs.promises.stat(outputPath)).size;
        emit('step', { step: 'paste-encode', status: 'done', encoderPid: encoder.pid || null, encoderExit: exit, bytes, streamedBytes, patchCount: patches.length, disk: diskSnapshot(path.dirname(outputPath)) });
        return { bytes, streamedBytes, channels, pixelFormat, width: sourceDims.width, height: sourceDims.height, stripHeight, stripCount: count, encoderExit: exit, patchCount: patches.length };
    }
    catch (e) {
        try {
            encoder.stdin?.destroy();
        }
        catch { }
        try {
            if (!encoderClosed)
                encoder.kill('SIGKILL');
        }
        catch { }
        const exit = encoderClosed || await Promise.race([encoderClose, new Promise(r => setTimeout(() => r(null), 1200))]);
        if (exit && !e.encoderExit)
            e.encoderExit = exit;
        throw e;
    }
    finally {
        clearInterval(encBeat);
    }
}
async function waitForDurableCheckpointAck(ackPath, timeoutMs = 45_000) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
        try {
            if ((await fs.promises.stat(ackPath)).isFile())
                return true;
        }
        catch { }
        await new Promise(resolve => setTimeout(resolve, 150));
    }
    return false;
}
async function runStage4CompositeCore(input, resultPath) {
    if (!input || !resultPath)
        throw new Error('stage4_worker_arguments_missing');
    const imagePath = String(input.imagePath || ''), aiPath = String(input.aiPath || ''), outputPath = String(input.outputPath || ''), ffmpegPath = String(input.ffmpegPath || 'ffmpeg'), inputPatches = Array.isArray(input.patches) ? input.patches : [];
    const checkpointTexturePath = String(input.checkpointTexturePath || ''), checkpointMaskPath = String(input.checkpointMaskPath || '');
    const mimeType = String(input.mimeType || 'image/jpeg'), crop = { ...(input.crop || {}) }, lowDiskMode = Boolean(input.lowDiskMode), retouchLevel = String(input.retouchLevel || 'standard'), preferSharp = Boolean(input.preferSharp);
    if (!imagePath || !outputPath || (!aiPath && !inputPatches.length))
        throw new Error('stage4_worker_asset_path_missing');
    const monoInfo = await sourceIsEffectivelyMonochrome(imagePath).catch(() => ({ monochrome: false, avgSpread: null, coloredRatio: null })), sourceMonochrome = Boolean(monoInfo.monochrome);
    emit('step', { step: 'source-color-profile', status: 'done', sourceMonochrome, ...monoInfo });
    const workDir = path.dirname(outputPath);
    let lastStep = 'validate', lastEncoderExit = null;
    const setStep = (step) => { lastStep = step; };
    const heartbeat = setInterval(() => emit('heartbeat', { step: lastStep, status: 'running', disk: diskSnapshot(workDir) }), 2000);
    heartbeat.unref?.();
    try {
        if (inputPatches.length) {
            emit('step', { step: 'validate', status: 'start', mode: 'multiface', patchCount: inputPatches.length, disk: diskSnapshot(workDir) });
            const sourceMeta = await sharp(imagePath).metadata(), sourceDims = orientedImageDimensions(sourceMeta), prepared = [];
            for (let i = 0; i < inputPatches.length; i++) {
                const p = { ...inputPatches[i] }, c = { ...(p.crop || {}) }, regionIndex = Number(p.regionIndex || i + 1), regionAiPath = String(p.aiPath || '');
                c.left = Math.round(Number(c.left));
                c.top = Math.round(Number(c.top));
                c.width = Math.round(Number(c.width));
                c.height = Math.round(Number(c.height));
                if (!regionAiPath || !Number.isFinite(c.left) || !Number.isFinite(c.top) || !Number.isFinite(c.width) || !Number.isFinite(c.height) || c.left < 0 || c.top < 0 || c.width < 1 || c.height < 1 || c.left + c.width > sourceDims.width || c.top + c.height > sourceDims.height)
                    throw new Error(`region-${regionIndex}-crop-invalid=${c.left},${c.top},${c.width}x${c.height}`);
                const faces = Array.isArray(c.faces) && c.faces.length ? c.faces : [c.face].filter(Boolean), skinRects = Array.isArray(c.skinRects) ? c.skinRects.filter((r) => [r.x, r.y, r.w, r.h].every((v) => Number.isFinite(Number(v))) && Number(r.w) > 0 && Number(r.h) > 0) : [];
                if (!skinRects.length && (!faces.length || faces.some((f) => ![f.x, f.y, f.w, f.h].every((v) => Number.isFinite(Number(v))))))
                    throw new Error(`region-${regionIndex}-mask-anchor-metadata-missing`);
                const aiMeta = await sharp(regionAiPath).metadata(), aiDimensions = orientedImageDimensions(aiMeta);
                prepared.push({ regionIndex, aiPath: regionAiPath, crop: { ...c, faces, face: c.face || faces[0] || null, skinRects }, aiDimensions, patchSizeExact: aiDimensions.width === c.width && aiDimensions.height === c.height, mode: String(p.mode || 'independent'), faceIndexes: Array.isArray(p.faceIndexes) ? p.faceIndexes : [], checkpointTexturePath: String(p.checkpointTexturePath || ''), checkpointMaskPath: String(p.checkpointMaskPath || '') });
            }
            emit('step', { step: 'validate', status: 'done', mode: 'multiface', sourceDimensions: sourceDims, patchCount: prepared.length, regions: prepared.map((p) => ({ regionIndex: p.regionIndex, mode: p.mode, faceIndexes: p.faceIndexes, crop: { left: p.crop.left, top: p.crop.top, width: p.crop.width, height: p.crop.height }, aiDimensions: p.aiDimensions, patchSizeExact: p.patchSizeExact })), sourceOrientation: Number(sourceMeta?.orientation || 1), disk: diskSnapshot(workDir) });
            // v0.17.266 low-memory multi-face pipeline:
            // prepare exactly one region at a time, persist it, then drop its Buffers.
            // The final strip compositor re-opens checkpoint PNGs on demand instead of
            // retaining every AI texture/mask in memory simultaneously.
            const rendered = [];
            for (const p of prepared) {
                let renderTexturePath = '', renderMaskPath = '';
                const canRestore = Boolean(p.checkpointTexturePath && p.checkpointMaskPath && fs.existsSync(p.checkpointTexturePath) && fs.existsSync(p.checkpointMaskPath));
                if (canRestore) {
                    setStep(`checkpoint-restore-region-${p.regionIndex}`);
                    emit('step', { step: 'checkpoint-restore', status: 'done', regionIndex: p.regionIndex, storage: 'durable-file', memoryMode: 'path-only-v267' });
                    renderTexturePath = p.checkpointTexturePath;
                    renderMaskPath = p.checkpointMaskPath;
                    if (sourceMonochrome) {
                        const monoPath = path.join(workDir, `stage4-region-${String(p.regionIndex).padStart(2, '0')}-monochrome.png`);
                        await sharp(renderTexturePath, { sequentialRead: true, limitInputPixels: false }).greyscale().toColourspace('srgb').png({ compressionLevel: 1, adaptiveFiltering: false }).toFile(monoPath);
                        renderTexturePath = monoPath;
                    }
                }
                else {
                    const cpTexture = path.join(workDir, `stage4-checkpoint-region-${String(p.regionIndex).padStart(2, '0')}-texture.png`), cpMask = path.join(workDir, `stage4-checkpoint-region-${String(p.regionIndex).padStart(2, '0')}-mask.png`), cpAck = path.join(workDir, `stage4-checkpoint-region-${String(p.regionIndex).padStart(2, '0')}.durable-ack`), workTexture = path.join(workDir, `stage4-region-${String(p.regionIndex).padStart(2, '0')}-normalized.png`);
                    setStep(`texture-region-${p.regionIndex}`);
                    emit('step', { step: 'texture', status: 'start', regionIndex: p.regionIndex, mode: p.mode, memoryMode: 'path-only-v267' });
                    const textureBase = sharp(p.aiPath, { sequentialRead: true, limitInputPixels: false }).rotate();
                    // v0.17.565 natural Stage 4: never sharpen AI output after retouch. The AI
                    // result may already carry its own local contrast; sharpening again after an
                    // upscale made pores, eyelashes and edges look harsher than the same prompt
                    // run manually. Cubic resampling is intentionally neutral and avoids Lanczos
                    // ringing when the AI output is slightly smaller than the original crop.
                    let texturePipeline = (p.patchSizeExact ? textureBase : textureBase.resize(p.crop.width, p.crop.height, { fit: 'fill', kernel: 'cubic' })).toColourspace('srgb').removeAlpha();
                    if (sourceMonochrome)
                        texturePipeline = texturePipeline.greyscale().toColourspace('srgb');
                    await texturePipeline.png({ compressionLevel: 1, adaptiveFiltering: false }).toFile(workTexture);
                    const workTextureStat = await fs.promises.stat(workTexture);
                    emit('step', { step: 'texture', status: 'done', regionIndex: p.regionIndex, bytes: workTextureStat.size, storage: 'disk-path', memoryMode: 'path-only-v267', resampleKernel: 'cubic', postSharpen: false, naturalStage4: 'v565', disk: diskSnapshot(workDir) });
                    setStep(`geometry-lock-region-${p.regionIndex}`);
                    const geometry = await geometryLockPathDecision({ imagePath, texturePath: workTexture, crop: p.crop });
                    if (geometry.fallbackOriginal) {
                        await fs.promises.rm(workTexture, { force: true }).catch(() => { });
                        await sharp(imagePath, { sequentialRead: true, limitInputPixels: false }).rotate().extract({ left: p.crop.left, top: p.crop.top, width: p.crop.width, height: p.crop.height }).removeAlpha().png({ compressionLevel: 1, adaptiveFiltering: false }).toFile(cpTexture);
                    }
                    else {
                        await fs.promises.rename(workTexture, cpTexture);
                    }
                    emit('step', { step: 'geometry-lock', status: 'done', regionIndex: p.regionIndex, applied: false, fallbackOriginal: Boolean(geometry.fallbackOriginal), reason: geometry.reason, tx: geometry.tx || 0, ty: geometry.ty || 0, improvement: Number((geometry.improvement || 0).toFixed?.(4) || 0), memoryMode: 'path-only-v267' });
                    setStep(`color-lock-region-${p.regionIndex}`);
                    const colorLock = await lockPatchColorToSourceFace({ imagePath, texturePath: cpTexture, crop: p.crop, sourceMonochrome });
                    emit('step', { step: 'color-lock', status: colorLock.applied ? 'done' : 'skipped', regionIndex: p.regionIndex, ...colorLock });
                    setStep(`mask-build-region-${p.regionIndex}`);
                    const maskScale = Math.min(1, 640 / Math.max(p.crop.width, p.crop.height));
                    emit('step', { step: 'mask-build', status: 'start', regionIndex: p.regionIndex, faceCount: p.crop.faces.length, bodySkinRectCount: Array.isArray(p.crop.skinRects) ? p.crop.skinRects.length : 0, scale: Number(maskScale.toFixed(4)), memoryMode: 'path-only-v267' });
                    const maskWrite = await writeStage4MaskFile(multiMaskSvg(p.crop, maskScale), p.crop, maskScale, cpMask);
                    const [textureStat, maskStat] = await Promise.all([fs.promises.stat(cpTexture), fs.promises.stat(cpMask)]);
                    emit('step', { step: 'mask-build', status: 'done', regionIndex: p.regionIndex, faceCount: p.crop.faces.length, bodySkinRectCount: Array.isArray(p.crop.skinRects) ? p.crop.skinRects.length : 0, bytes: maskStat.size, storage: 'disk-path', scale: Number(maskScale.toFixed(4)), maskFallback: Boolean(maskWrite.fallback), maskFallbackReason: maskWrite.reason || null, disk: diskSnapshot(workDir) });
                    setStep(`boundary-tone-region-${p.regionIndex}`);
                    const boundaryTone = await lockPatchBoundaryToneToSource({ imagePath, texturePath: cpTexture, maskPath: cpMask, crop: p.crop, sourceMonochrome });
                    emit('step', { step: 'boundary-tone', status: boundaryTone.applied ? 'done' : 'skipped', regionIndex: p.regionIndex, ...boundaryTone });
                    if (retouchLevel === 'gentle')
                        emit('step', { step: 'color-match', status: 'skipped', regionIndex: p.regionIndex, reason: 'body-harmonization-disabled-face-neck-organic-v549-safe' });
                    if (input.requirePreparedCheckpoint === true || String(process.env.STAGE4_REQUIRE_PREPARED_CHECKPOINTS || '') === '1') {
                        emit('step', { step: 'checkpoint-prepared', status: 'done', regionIndex: p.regionIndex, checkpointTexturePath: cpTexture, checkpointMaskPath: cpMask, checkpointAckPath: cpAck, textureBytes: textureStat.size, maskBytes: maskStat.size, storage: 'local-ready-for-durable', memoryMode: 'path-only-v593' });
                        setStep(`checkpoint-durable-region-${p.regionIndex}`);
                        if (!await waitForDurableCheckpointAck(cpAck)) throw new Error(`stage4_checkpoint_persist_timeout_region_${p.regionIndex}`);
                        emit('step', { step: 'checkpoint-durable', status: 'done', regionIndex: p.regionIndex, storage: 'durable' });
                    } else {
                        emit('step', { step: 'checkpoint-local', status: 'done', regionIndex: p.regionIndex, textureBytes: textureStat.size, maskBytes: maskStat.size, storage: 'ephemeral-stage4', recoverySource: 'durable-stage3-ai-output', memoryMode: 'path-only-v593' });
                    }
                    renderTexturePath = cpTexture;
                    renderMaskPath = cpMask;
                }
                rendered.push({ ...p, texturePath: renderTexturePath, maskPath: renderMaskPath });
                emit('step', { step: 'region-memory-release', status: 'done', regionIndex: p.regionIndex, memoryMode: 'path-only-v267', memory: memorySnapshot() });
            }
            // v0.17.270: final composite is fully external-process/path-only. Node/libvips
            // never decodes the full source frame, which removes the dominant cgroup RAM
            // spike seen on some large photographs.
            let compositeMode = 'disk-backed-auto-v274';
            setStep('paste-plan');
            emit('step', { step: 'paste', status: 'start', mode: compositeMode, lowDiskMode: true, patchCount: rendered.length, sharpAllowed: true, memoryMode: 'disk-tiled-path-assets' });
            const tonePatches = await buildBodySkinTonePatches({ imagePath, patches: rendered, sourceDims, workDir, sourceMonochrome });
            // Body-tone patches go first; accepted AI face regions go last and therefore win
            // on any overlap. Every asset is reopened from disk only for the active strip.
            const streamed = await pasteMultipleSafest({ imagePath, patches: [...tonePatches, ...rendered], sourceDims, outputPath, mimeType, ffmpegPath, workDir, setStep, lowDiskMode: true, normalizeSourceColor: false });
            lastEncoderExit = streamed.encoderExit;
            compositeMode = String(streamed.mode || compositeMode);
            emit('step', { step: 'paste', status: 'done', mode: compositeMode, lowDiskMode, patchCount: rendered.length, skinTonePatchCount: tonePatches.length, streamedBytes: streamed.streamedBytes, outputBytes: streamed.bytes, disk: diskSnapshot(workDir) });
            const result = { ok: true, phase: 'final_ready', outputPath, contentType: outputFormat(mimeType).contentType, outputDimensions: sourceDims, compositeMode, lowDiskMode, patchCount: rendered.length, rawSpoolBytes: 0, patchTempBytes: 0, streamedBytes: streamed.streamedBytes, pixelFormat: streamed.pixelFormat, channels: streamed.channels, width: streamed.width, height: streamed.height, stripHeight: streamed.stripHeight, stripCount: streamed.stripCount, encoderExit: streamed.encoderExit, pid: process.pid, memory: memorySnapshot(), disk: diskSnapshot(workDir) };
            await fs.promises.writeFile(resultPath, JSON.stringify(result), 'utf8');
            emit('result', result);
            return;
        }
        emit('step', { step: 'validate', status: 'start', disk: diskSnapshot(workDir) });
        const [sourceMeta, aiMeta] = await Promise.all([sharp(imagePath).metadata(), sharp(aiPath).metadata()]);
        const sourceDims = orientedImageDimensions(sourceMeta), aiDims = orientedImageDimensions(aiMeta), cropDims = { width: Math.max(1, Number(crop.width) || 1), height: Math.max(1, Number(crop.height) || 1) };
        crop.left = Math.round(Number(crop.left));
        crop.top = Math.round(Number(crop.top));
        crop.width = Math.round(Number(crop.width));
        crop.height = Math.round(Number(crop.height));
        if (!Number.isFinite(crop.left) || !Number.isFinite(crop.top) || !Number.isFinite(crop.width) || !Number.isFinite(crop.height) || crop.left < 0 || crop.top < 0 || crop.width < 1 || crop.height < 1 || crop.left + crop.width > sourceDims.width || crop.top + crop.height > sourceDims.height)
            throw new Error(`crop=${crop.left},${crop.top},${crop.width}x${crop.height}; source=${sourceDims.width}x${sourceDims.height}`);
        if (!crop.face || ![crop.face.x, crop.face.y, crop.face.w, crop.face.h].every((v) => Number.isFinite(Number(v))))
            throw new Error('face-anchor-metadata-missing');
        emit('step', { step: 'validate', status: 'done', sourceDimensions: sourceDims, cropDimensions: cropDims, aiDimensions: aiDims, patchSizeExact: aiDims.width === crop.width && aiDims.height === crop.height, sourceOrientation: Number(sourceMeta?.orientation || 1), disk: diskSnapshot(workDir) });
        let texturePath = '', maskPath = '';
        const canRestoreCheckpoint = Boolean(checkpointTexturePath && checkpointMaskPath && fs.existsSync(checkpointTexturePath) && fs.existsSync(checkpointMaskPath));
        if (canRestoreCheckpoint) {
            setStep('checkpoint-restore');
            emit('step', { step: 'checkpoint-restore', status: 'start' });
            texturePath = checkpointTexturePath;
            maskPath = checkpointMaskPath;
            if (sourceMonochrome) {
                const monoPath = path.join(workDir, 'stage4-single-monochrome.png');
                await sharp(texturePath, { sequentialRead: true, limitInputPixels: false }).greyscale().toColourspace('srgb').png({ compressionLevel: 1, adaptiveFiltering: false }).toFile(monoPath);
                texturePath = monoPath;
            }
            const [ts, ms] = await Promise.all([fs.promises.stat(texturePath), fs.promises.stat(maskPath)]);
            emit('step', { step: 'checkpoint-restore', status: 'done', textureBytes: ts.size, maskBytes: ms.size, storage: 'durable-path', memoryMode: 'path-only-v270' });
        }
        else {
            const workTexture = path.join(workDir, 'stage4-single-normalized.png'), cpTexture = path.join(workDir, 'stage4-checkpoint-single-texture.png'), cpMask = path.join(workDir, 'stage4-checkpoint-single-mask.png'), cpAck = path.join(workDir, 'stage4-checkpoint-single.durable-ack');
            setStep('texture');
            emit('step', { step: 'texture', status: 'start', memoryMode: 'path-only-v270' });
            const patchSizeExact = aiDims.width === crop.width && aiDims.height === crop.height, textureBase = sharp(aiPath, { sequentialRead: true, limitInputPixels: false }).rotate();
            // v0.17.565: preserve the AI retouch texture exactly; no post-AI sharpening.
            // If dimensions differ, use cubic interpolation rather than an edge-enhancing
            // Lanczos resize so the automatic path stays as gentle as the direct/manual result.
            let texturePipeline = (patchSizeExact ? textureBase : textureBase.resize(crop.width, crop.height, { fit: 'fill', kernel: 'cubic' })).toColourspace('srgb').removeAlpha();
            if (sourceMonochrome)
                texturePipeline = texturePipeline.greyscale().toColourspace('srgb');
            await texturePipeline.png({ compressionLevel: 1, adaptiveFiltering: false }).toFile(workTexture);
            emit('step', { step: 'texture', status: 'done', bytes: (await fs.promises.stat(workTexture)).size, storage: 'disk-path', memoryMode: 'path-only-v270', resampleKernel: 'cubic', postSharpen: false, naturalStage4: 'v565', disk: diskSnapshot(workDir) });
            setStep('geometry-lock');
            const geometry = await geometryLockPathDecision({ imagePath, texturePath: workTexture, crop });
            if (geometry.fallbackOriginal) {
                await fs.promises.rm(workTexture, { force: true }).catch(() => { });
                await sharp(imagePath, { sequentialRead: true, limitInputPixels: false }).rotate().extract({ left: crop.left, top: crop.top, width: crop.width, height: crop.height }).removeAlpha().png({ compressionLevel: 1, adaptiveFiltering: false }).toFile(cpTexture);
            }
            else
                await fs.promises.rename(workTexture, cpTexture);
            emit('step', { step: 'geometry-lock', status: 'done', applied: false, fallbackOriginal: Boolean(geometry.fallbackOriginal), reason: geometry.reason, tx: geometry.tx || 0, ty: geometry.ty || 0, improvement: Number((geometry.improvement || 0).toFixed?.(4) || 0), memoryMode: 'path-only-v270' });
            setStep('color-lock');
            const colorLock = await lockPatchColorToSourceFace({ imagePath, texturePath: cpTexture, crop, sourceMonochrome });
            emit('step', { step: 'color-lock', status: colorLock.applied ? 'done' : 'skipped', ...colorLock });
            setStep('mask-build');
            const maskScale = Math.min(1, 640 / Math.max(crop.width, crop.height));
            emit('step', { step: 'mask-build', status: 'start', scale: Number(maskScale.toFixed(4)), memoryMode: 'path-only-v270' });
            const maskWrite = await writeStage4MaskFile(maskSvg(crop, maskScale), crop, maskScale, cpMask);
            emit('step', { step: 'mask-build', status: 'done', bytes: (await fs.promises.stat(cpMask)).size, storage: 'disk-path', scale: Number(maskScale.toFixed(4)), maskFallback: Boolean(maskWrite.fallback), maskFallbackReason: maskWrite.reason || null, disk: diskSnapshot(workDir) });
            setStep('boundary-tone');
            const boundaryTone = await lockPatchBoundaryToneToSource({ imagePath, texturePath: cpTexture, maskPath: cpMask, crop, sourceMonochrome });
            emit('step', { step: 'boundary-tone', status: boundaryTone.applied ? 'done' : 'skipped', ...boundaryTone });
            // v0.17.540: the edited face was already color-locked to the original face.
            // Never recolor surrounding skin, clothing, or background to match the AI patch.
            emit('step', { step: 'color-match', status: 'skipped', reason: 'body-harmonization-disabled-face-neck-organic-v549-safe' });
            const [textureStat, maskStat] = await Promise.all([fs.promises.stat(cpTexture), fs.promises.stat(cpMask)]);
            if (input.requirePreparedCheckpoint === true || String(process.env.STAGE4_REQUIRE_PREPARED_CHECKPOINTS || '') === '1') {
                emit('step', { step: 'checkpoint-prepared', status: 'done', regionIndex: 0, checkpointTexturePath: cpTexture, checkpointMaskPath: cpMask, checkpointAckPath: cpAck, textureBytes: textureStat.size, maskBytes: maskStat.size, storage: 'local-ready-for-durable', memoryMode: 'path-only-v593' });
                setStep('checkpoint-durable');
                if (!await waitForDurableCheckpointAck(cpAck)) throw new Error('stage4_checkpoint_persist_timeout_single');
                emit('step', { step: 'checkpoint-durable', status: 'done', regionIndex: 0, storage: 'durable' });
            } else {
                emit('step', { step: 'checkpoint-local', status: 'done', regionIndex: 0, textureBytes: textureStat.size, maskBytes: maskStat.size, storage: 'ephemeral-stage4', recoverySource: 'durable-stage3-ai-output', memoryMode: 'path-only-v593' });
            }
            texturePath = cpTexture;
            maskPath = cpMask;
        }
        let compositeMode = 'disk-backed-auto-v274';
        setStep('paste-plan');
        emit('step', { step: 'paste', status: 'start', mode: compositeMode, lowDiskMode: true, preferSharp: false, sharpAllowed: true, memoryMode: 'disk-tiled-path-assets' });
        const tonePatches = await buildBodySkinTonePatches({ imagePath, patches: [{ texturePath, maskPath, crop, regionIndex: 1 }], sourceDims, workDir, sourceMonochrome });
        const streamed = await pasteMultipleSafest({ imagePath, patches: [...tonePatches, { texturePath, maskPath, crop, regionIndex: 1 }], sourceDims, outputPath, mimeType, ffmpegPath, workDir, setStep, lowDiskMode: true, normalizeSourceColor: false });
        lastEncoderExit = streamed.encoderExit;
        compositeMode = String(streamed.mode || compositeMode);
        emit('step', { step: 'paste', status: 'done', mode: compositeMode, lowDiskMode, skinTonePatchCount: tonePatches.length, streamedBytes: streamed.streamedBytes, outputBytes: streamed.bytes, disk: diskSnapshot(workDir) });
        const result = { ok: true, phase: 'final_ready', outputPath, contentType: outputFormat(mimeType).contentType, outputDimensions: sourceDims, compositeMode, lowDiskMode, rawSpoolBytes: 0, patchTempBytes: 0, streamedBytes: streamed.streamedBytes, pixelFormat: streamed.pixelFormat, channels: streamed.channels, width: streamed.width, height: streamed.height, stripHeight: streamed.stripHeight, stripCount: streamed.stripCount, encoderExit: streamed.encoderExit, pid: process.pid, memory: memorySnapshot(), disk: diskSnapshot(workDir) };
        await fs.promises.writeFile(resultPath, JSON.stringify(result), 'utf8');
        emit('result', result);
    }
    catch (e) {
        const errStep = String(e?.debugStep || lastStep || 'worker'), detail = String(e?.debugDetail || e?.message || e?.code || e || 'unknown').slice(0, 500), encoderExit = e?.encoderExit || lastEncoderExit || null;
        const result = { ok: false, error: String(e?.message || e?.code || 'stage4_worker_failed'), step: errStep, detail, pid: process.pid, memory: memorySnapshot(), disk: diskSnapshot(workDir), encoderExit, probableOom: Boolean(e?.probableOom || encoderExit?.signal === 'SIGKILL'), diskFull: Boolean(e?.code === 'ENOSPC' || String(e?.message || '').includes('ENOSPC')) };
        await fs.promises.rm(outputPath, { force: true }).catch(() => { });
        await fs.promises.writeFile(resultPath, JSON.stringify(result), 'utf8').catch(() => { });
        emit('error', result);
        if (!inProcessEmitHook)
            process.exitCode = 1;
    }
    finally {
        clearInterval(heartbeat);
    }
}
export async function runStage4CompositeInProcess(input, onEvent) {
    const resultPath = path.join(path.dirname(String(input?.outputPath || process.cwd())), `stage4-inprocess-result-${process.pid}-${Date.now()}.json`);
    const previousHook = inProcessEmitHook;
    inProcessEmitHook = onEvent || null;
    try {
        await runStage4CompositeCore(input, resultPath);
        let result = null;
        try {
            result = JSON.parse(await fs.promises.readFile(resultPath, 'utf8'));
        }
        catch { }
        if (!result?.ok) {
            const e = new Error(String(result?.error || 'stage4_inprocess_failed'));
            e.debugStep = String(result?.step || 'stage4-inprocess');
            e.debugDetail = String(result?.detail || result?.error || 'Stage 4 in-process failed').slice(0, 500);
            e.debugWorkerExit = { pid: process.pid, code: null, signal: null, timedOut: false, inProcess: true, lastStep: e.debugStep, memory: result?.memory || memorySnapshot(), disk: result?.disk || null };
            e.debugProbableOom = Boolean(result?.probableOom);
            e.debugDiskFull = Boolean(result?.diskFull);
            e.debugDisk = result?.disk || null;
            throw e;
        }
        return { ...result, path: String(result.outputPath || input.outputPath), contentType: result.contentType || outputFormat(String(input.mimeType || 'image/jpeg')).contentType, workerExit: { pid: process.pid, code: 0, signal: null, timedOut: false, inProcess: true, lastStep: 'done', memory: result?.memory || memorySnapshot(), disk: result?.disk || null } };
    }
    finally {
        inProcessEmitHook = previousHook;
        await fs.promises.rm(resultPath, { force: true }).catch(() => { });
        sharp.cache(false);
    }
}
async function workerEntry() {
    const inputPath = process.argv[2], resultPath = process.argv[3];
    if (!inputPath || !resultPath)
        throw new Error('stage4_worker_arguments_missing');
    const input = JSON.parse(await fs.promises.readFile(inputPath, 'utf8'));
    await runStage4CompositeCore(input, resultPath);
}
if (process.env.PHOTOBRIDGE_STAGE4_WORKER === '1')
    void workerEntry().catch(async (e) => {
        const resultPath = process.argv[3], result = { ok: false, error: String(e?.message || e?.code || 'stage4_worker_boot_failed'), step: 'worker-boot', detail: String(e?.stack || e?.message || e).slice(0, 800), pid: process.pid, memory: memorySnapshot() };
        if (resultPath)
            await fs.promises.writeFile(resultPath, JSON.stringify(result), 'utf8').catch(() => { });
        emit('error', result);
        process.exitCode = 1;
    });
