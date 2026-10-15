/* R1222: build light-brand, maskable PWA icons from the exact same SVG as the launch card.
   Liara runs this during the Docker build, after sharp is installed. No binary commits. */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const base=path.resolve('dist/web');
const svg=await fs.readFile(path.join(base,'photobridge-icon-brand-r1222.svg'));
for(const [size,name] of [[192,'photobridge-icon-192-r1222.png'],[512,'photobridge-icon-512-r1222.png'],[180,'photobridge-apple-touch-r1222.png'],[48,'photobridge-favicon-r1222.png']]){
 await sharp(svg,{density:192}).resize(size,size,{fit:'contain'}).png({compressionLevel:9}).toFile(path.join(base,name));
}
console.log('[PhotoBridge R1222] light blue PWA / splash icons prepared (192, 512, 180 and 48).');
