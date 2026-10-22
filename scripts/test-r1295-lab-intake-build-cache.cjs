const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('last Liara build stage restores R1365 local-intake cache key without deleting site flags',()=>{
 const script=fs.readFileSync('scripts/enable-r1291-lab-manual-customer-accounts.mjs','utf8');
 const html=fs.readFileSync('dist/web/index.html','utf8');
 const before='<script defer src="/photobridge-r1137-lab-local-intake.js?v=r1186&site=r1188"></script>';
 assert(script.includes("html=html.replace(/(photobridge-r1137-lab-local-intake"));
 // Match the exact final-stage expression so this test fails if a future build
 // accidentally reintroduces the historical R1291 cache downgrade.
 const match=script.match(/html=html\.replace\((\/\(photobridge-r1137-lab-local-intake.*?\/g),\s*'\$1r1365'\)/);
 assert(match,'final-stage updater must use the R1365 asset token');
 const pattern=eval(match[1]);
 const output=before.replace(pattern,'$1r1365');
 assert(output.includes('local-intake.js?v=r1365&site=r1188'));
 assert(html.includes('local-intake.js?v=r1365'));
});
test('album intake keeps the album catalog while print orders request the lean bootstrap',()=>{
 const intake=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
 assert(intake.includes("delegated-orders/bootstrap'+(/^\\/lab\\/album"));
 const album=/^\/lab\/album(?:s|[-/]|$)/;
 assert(album.test('/lab/album'));
 assert(album.test('/lab/albums'));
 assert(!album.test('/lab/orders'));
 new Function(intake);
});

