'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const roots=['dist/web','dist/web/lab-desktop-ui'];
test('finance refresh only shows full-page busy on initial load, never on later event updates',()=>{
 for(const root of roots){
  const source=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  assert(source.includes('R1572 finance stable background refresh'));
  assert(source.includes('const pb1572FinanceFirstLoad=x.useRef(true)'));
  assert(source.includes('if(pb1572FinanceFirstLoad.current)g(!0);try{'));
  assert(source.includes('finally{pb1572FinanceFirstLoad.current=false;g(!1)}'));
  assert(source.includes('pb1569CoalescedLoad'));
  assert(!source.includes('pb1472Load=async()=>{var Je;g(!0);try{'));
 }
});
test('automation and backup appear under General settings, not System or Print orders',()=>{
 for(const root of roots){
  const source=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  // Locate the exact General menu that the build patch modifies. Other
  // minification layers may rename component functions or category labels.
  const general=source.indexOf('key:"general",label:"عمومی"');
  assert(general>=0);
  const generalSection=source.slice(general,general+650);
  assert(generalSection.includes('["automation","دانلود و چاپ خودکار"]'));
  assert(generalSection.includes('["backup","پشتیبان اطلاعات برنامه"]'));
  const settingsMenu=source.slice(general,general+2200);
  assert.equal((settingsMenu.match(/\["backup","[^"]*"\]/g)||[]).length,1,
    'backup should appear exactly once in the Lab settings menu');
  assert(source.includes('g==="automation"&&e.jsx(PB1568AutomationSettings'));
  assert(source.includes('g==="backup"&&e.jsxs("section"'));
  const html=fs.readFileSync(root+'/index.html','utf8');
  assert(!html.includes('/photobridge-r1570-automation-entry.js?'));
  assert(html.includes('stableFinance=r1572'));
 }
});
test('native UI manifest matches new code and HTML hashes',()=>{
 const root='dist/web/lab-desktop-ui';
 const manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 for(const name of ['assets/index-UIRefine-v655-r84.js','index.html']){
  const record=manifest.files.find(x=>x.name===name);assert(record);
  assert.equal(record.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
});
