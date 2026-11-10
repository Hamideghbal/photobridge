const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
test('mobile-only layout preserves Android two-button row and prevents overlapping duplicate',()=>{
 const css=fs.readFileSync('dist/web/photobridge-r1763-mobile-print-rows.css','utf8');
 assert(css.includes('@media screen and (max-width:820px)'));
 assert(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'));
 assert(css.includes('grid-template-areas:"add send"!important'));
 assert(css.includes('.simplePrintPilotMobileInlineActions'));
 assert(css.includes('position:static!important'));
 assert(!css.includes('@media(min-width:821px)'));
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert.equal(html.split('photobridge-r1763-mobile-print-rows.css?v=r1763').length-1,1);
});
test('layout installer is idempotent and edits only web CSS and HTML',()=>{
 const files=['dist/web/index.html','dist/web/photobridge-r1763-mobile-print-rows.css'];
 const before=files.map(f=>fs.readFileSync(f,'utf8'));
 execFileSync(process.execPath,['scripts/enable-r1763-mobile-print-rows.mjs']);
 files.forEach((p,i)=>assert.equal(fs.readFileSync(p,'utf8'),before[i],p));
});
