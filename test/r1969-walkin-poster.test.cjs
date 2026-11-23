const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const poster=fs.readFileSync(path.join(root,'dist/web/photobridge-walkin-a4-minimal-r1975.js'),'utf8');
const index=fs.readFileSync(path.join(root,'dist/web/index.html'),'utf8');
test('R1969 poster script parses and is mounted once',()=>{
 assert.doesNotThrow(()=>new vm.Script(poster,{filename:'walkin-poster.js'}));
 assert.equal((index.match(/photobridge-walkin-a4-minimal-r1975.js/g)||[]).length,1);
});
test('R1969 poster uses the actual authenticated walk-in QR destination',()=>{
 assert.match(poster,/api\/lab\/walkin/);
 assert.match(poster,/state\.url/);
 assert.match(poster,/walkinLinkInfo input\[readonly\]/);
 assert.match(poster,/encodeURIComponent\(walkinUrl\)/);
 assert.match(poster,/invalid_walkin_state/);
});
test('R1969 prints personalized A4 and only active custom domain',()=>{
 assert.match(poster,/@page\{size:A4 portrait/);
 assert.match(poster,/lab\?\.name/);
 assert.match(poster,/api\/lab\/site/);
 assert.match(poster,/d\.active===true/);
 assert.match(poster,/siteUrl\?/);
 assert.match(poster,/window\.print\(\)/);
});
test('R1969 avoids cross-lab placeholders and does not alter order upload flow',()=>{
 assert.doesNotMatch(poster,/photobridge\.ir\/walkin\/example/);
 assert.doesNotMatch(poster,/api\/public\/walkin\/.*POST/);
 assert.match(poster,/location\.pathname\.startsWith\('\/lab\/'\)/);
});
