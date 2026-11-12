import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const path = 'dist/api/server.js';
let source = fs.readFileSync(path, 'utf8');
// R1539 wraps the original catalog in albumCatalogForLab; the priced covers
// still come from the *original* catalog query, not the wrapper's return object.
const original = 'async function albumCatalogForLabOriginal(';
const direct = 'async function albumCatalogForLab(';
const marker = source.includes(original) ? original : direct;
if (source.split(marker).length !== 2) throw Error('[R1803] catalog function anchor mismatch');
const start = source.indexOf(marker);
const stop = source.indexOf('\nasync function ', start + marker.length);
if (stop < 0) throw Error('[R1803] catalog function boundary mismatch');
let catalogBody = source.slice(start, stop);
const mapping = /(covers: cq\.rows\.map\(\(r\) => \(\{[\s\S]*?\}\)\)), coverCatalog, extras:/g;
if ([...catalogBody.matchAll(mapping)].length !== 1) throw Error('[R1803] derived covers mapping anchor mismatch');
catalogBody = catalogBody.replace(mapping, (_, legacy) => 'covers: pb1803RecoverPricedCovers('+legacy.slice('covers: '.length)+', coverCatalog, sq.rows), coverCatalog, extras:');
source = source.slice(0, start) + fs.readFileSync('scripts/r1803-album-cover-helper.js.txt','utf8') + '\n' + catalogBody + source.slice(stop);
fs.writeFileSync(path, source);
execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
console.log('[R1803] read-only priced album cover catalog fallback installed');
