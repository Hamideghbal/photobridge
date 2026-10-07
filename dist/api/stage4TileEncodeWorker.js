// @ts-nocheck
import sharp from 'sharp';
sharp.cache(false);
sharp.concurrency(1);
async function main() {
    const inputPath = String(process.argv[2] || ''), outputPath = String(process.argv[3] || ''), mimeType = String(process.argv[4] || 'image/jpeg');
    if (!inputPath || !outputPath)
        throw new Error('stage4_tile_encode_args_missing');
    let pipe = sharp(inputPath, { sequentialRead: true, limitInputPixels: false }).toColourspace('srgb');
    if (mimeType === 'image/png')
        pipe = pipe.png({ compressionLevel: 6, adaptiveFiltering: false });
    else if (mimeType === 'image/webp')
        pipe = pipe.webp({ quality: 98, lossless: true, effort: 3 });
    else
        pipe = pipe.jpeg({ quality: 97, chromaSubsampling: '4:2:0', mozjpeg: false, progressive: false, optimizeCoding: false, trellisQuantisation: false, overshootDeringing: false, optimizeScans: false });
    await pipe.toFile(outputPath);
}
main().catch((e) => { console.error(String(e?.stack || e?.message || e)); process.exitCode = 1; });
