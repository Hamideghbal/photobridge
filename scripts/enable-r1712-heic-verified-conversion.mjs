// R1712: HEIC print conversion and upload-completion diagnosis.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const one=(s,a,b,label)=>{
 const n=s.split(a).length-1;
 if(n!==1)throw Error('R1712 '+label+' anchor count '+n);
 return s.replace(a,b);
};
const file='dist/api/server.js';
let api=fs.readFileSync(file,'utf8');
if(!api.includes('async function pb1666HeicFallback('))throw Error('R1712 requires the earlier R1666 conversion step');
if(api.includes('async function pb1712LooksHeic('))throw Error('R1712 unexpected duplicate installation');
const start=api.indexOf('async function ensurePrintReadyJpeg(row) {');
const stop=api.indexOf('\nfunction clampDiscount(',start);
if(start<0||stop<start)throw Error('R1712 print conversion boundary unavailable');
let body=api.slice(start,stop);
body=one(body,
 "    try {\n        const src = await materializeAiObjectForComposite",
 "    let pb1712Phase='read';\n    try {\n        const src = await materializeAiObjectForComposite",
 'track read phase');
body=one(body,
 "        };\n        try {\n            await writeSharp(src, true);",
 fs.readFileSync('scripts/r1712-heic-first-decoder.js.txt','utf8'),
 'HEIC-first decoder');
body=one(body,
 "if(pb1666IsHeic(row)){",
 "if(pb1666IsHeic(row)&&!pb1712WorkerAttempted){",
 'avoid duplicate HEIC worker');
body=one(body,
 "        const st = await fs.promises.stat(output);",
 "        }\n        pb1712Phase='verify';\n        if(!(await pb1712ValidJpeg(output)))throw new Error('invalid_jpeg_output');\n        const st = await fs.promises.stat(output);",
 'validate JPEG');
body=one(body,
 "        const stored = await storePrintReadyJpeg(row, output, name);",
 "        pb1712Phase='storage';\n        const stored = await pb1712StoreRetry(row, output, name);",
 'storage retry');
body=one(body,
 "        const convertedMeta=await sharp(output).metadata().catch(()=>({}));",
 "        pb1712Phase='database';\n        const convertedMeta=await sharp(output).metadata().catch(()=>({}));",
 'database phase');
body=one(body,
 "const message = String(e?.message || e || 'print_jpeg_conversion_failed').slice(0, 500), reason = printJpegFailureReason(message);",
 "const message = String(e?.message || e || 'print_jpeg_conversion_failed').slice(0, 500), reason = pb1712FailureReason(pb1712Phase,message);",
 'truthful error');
body=one(body,
 "contentType: row.content_type, message });\n        const err = new Error('print_jpeg_conversion_failed');",
 "contentType: row.content_type, phase:pb1712Phase, message });\n        const err = new Error('print_jpeg_conversion_failed');",
 'log phase');
body=one(body,
 "        err.reason = reason;\n        throw err;",
 "        err.reason = reason;\n        err.phase = pb1712Phase;\n        throw err;",
 'phase response');
api=api.slice(0,start)+fs.readFileSync('scripts/r1712-heic-conversion-helpers.js.txt','utf8')+body+api.slice(stop);
api=one(api,
 "reason: e?.reason || 'تبدیل تصویر به JPEG کامل نشد' });",
 "reason: e?.reason || 'تبدیل تصویر به JPEG کامل نشد', phase:e?.phase||'decode', retryable:e?.phase==='storage'||e?.phase==='database' });",
 'upload completion response');
fs.writeFileSync(file,api);
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('[R1712] HEIC-first decode, verified JPEG, Object Storage retry and diagnostic upload-completion phases installed.');
