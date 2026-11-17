'use strict';
// R1887: Windows Lab CRM must never cover the native first/second header.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const root='dist/web/lab-desktop-ui/';
const js=fs.readFileSync(root+'customer-crm-host.js','utf8');
const web=fs.readFileSync('dist/web/customer-crm-host.js','utf8');
const html=fs.readFileSync(root+'index.html','utf8');
const manifest=JSON.parse(fs.readFileSync(root+'manifest.json','utf8'));

test('R1887: native CRM host preserves both rows of the Lab navigation',()=>{
 assert.doesNotThrow(()=>new vm.Script(js));
 assert(js.includes('/* PB1887 native Lab CRM header clearance */'));
 assert(js.includes("#root .labRoleWorkspace .pb1148SecondaryHeader"));
 assert(js.includes("owner==='lab'"));
 assert(js.includes('const labNavBottom='));
 assert(js.includes('Math.max(measuredTop||lastHeaderBottom,labNavBottom)'));
 assert(js.includes('.pb1126MainNav,.pb1148SecondaryHeader,#root .labSingleHeader,'),
  'clicking Lab secondary tabs should dismiss the CRM content');
 assert(js.includes('close(true)'),'regular navigation closes CRM');
 assert(js.includes("target.matches('[data-pb1761-crm],[data-pb1126-kind=\"crm\"]')"),
  'CRM button should not close itself');
 assert(!web.includes('/* PB1887 native Lab CRM header clearance */'),
  'website UI must not inherit native-only layout');
});

function renderLayout({secondary=true,secondaryTop=72,portal='lab'}={}){
 const start=js.indexOf(' function layout(){');
 const end=js.indexOf(' function schedule(){',start);
 assert(start>=0&&end>start,'layout() boundaries must be available');
 const node=rect=>({getBoundingClientRect:()=>({...rect,height:rect.bottom-rect.top})});
 const header=node({top:0,bottom:72});
 const sub=secondary?node({top:secondaryTop,bottom:secondaryTop+48}):null;
 const document={
  querySelectorAll(selector){
   if(selector.includes('labSingleHeader')||selector.includes('pb1148SecondaryHeader')){
    return sub?[header,sub]:[header];
   }
   return [];
  }
 };
 const host={hidden:false,style:{top:'',bottom:''}};
 const sandbox={host,pending:false,owner:portal,lastHeaderBottom:0,
  document,innerHeight:900,matchMedia:()=>({matches:portal==='lab'}),
  shown:el=>el.getBoundingClientRect().height>0,
  getComputedStyle:()=>({display:'block',visibility:'visible'})
 };
 vm.runInNewContext(js.slice(start,end)+'\nlayout();',sandbox);
 return{top:host.style.top,bottom:host.style.bottom,remembered:sandbox.lastHeaderBottom};
}

test('R1887: CRM is below 72px single header and 120px two-row header',()=>{
 assert.equal(renderLayout({secondary:false}).top,'72px');
 assert.equal(renderLayout({secondary:true}).top,'120px');
 assert.equal(renderLayout({secondary:true}).remembered,120);
});

test('R1887: measured fixed secondary header wins even if it appears late in the page',()=>{
 // Previously secondary items were omitted and only the first 72px were kept.
 assert.equal(renderLayout({secondary:true,secondaryTop:400}).top,'448px');
});

test('R1887: native CSS/JS versions and hash-pinned manifest are self-consistent',()=>{
 for(const asset of ['customer-crm-host.js','index.html']){
  const row=manifest.files.find(f=>f.name===asset);
  assert(row,asset+' missing from Windows update manifest');
  assert.equal(row.url,'/lab-desktop-ui/'+asset);
  assert.equal(row.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+asset)).digest('hex'));
 }
 assert.equal(manifest.build,crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'));
 assert.match(html,/customer-crm-host[.]js[?][^"']*nativeLabCrm=r1887/);
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');
 assert(build.indexOf('enable-r1887-native-lab-crm-header.mjs')>build.indexOf('enable-r1884-native-intake-offline-responsive.mjs'));
 assert(build.includes('test-r1887-native-lab-crm-header.cjs'));
});
