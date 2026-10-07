// @ts-nocheck
import sharp from 'sharp';
sharp.cache(false);
sharp.concurrency(1);
async function main() {
    const inputPath = String(process.argv[2] || ''), patchPath = String(process.argv[3] || ''), outputPath = String(process.argv[4] || ''), x = Math.max(0, Math.round(Number(process.argv[5]) || 0)), y = Math.max(0, Math.round(Number(process.argv[6]) || 0)), rotate = String(process.argv[7] || '0') === '1';
    if (!inputPath || !patchPath || !outputPath)
        throw new Error('stage4_tile_apply_args_missing');
    let pipe = sharp(inputPath, { sequentialRead: true, limitInputPixels: false });
    if (rotate)
        pipe = pipe.rotate();
    await pipe.composite([{ input: patchPath, left: x, top: y, blend: 'over' }]).tiff({ compression: 'deflate', quality: 90, tile: true, tileWidth: 256, tileHeight: 256, pyramid: false }).toFile(outputPath);
}
main().catch((e) => { console.error(String(e?.stack || e?.message || e)); process.exitCode = 1; });
