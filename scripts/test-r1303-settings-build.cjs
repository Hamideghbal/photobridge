const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const bundle='dist/web/assets/index-UIRefine-v655-r84.js';
const page='dist/web/index.html';
const general='items:[["general","عمومی و اعلان‌ها"],["hours","ساعت کاری"]]';
const withSite=general.slice(0,-1)+',["site","سایت اختصاصی"]]';
const raw=fs.readFileSync(bundle,'utf8');
function run(name,files){
 const code=fs.readFileSync('scripts/'+name,'utf8').replace(/^import .*;\r?\n/gm,'');
 const io={readFileSync:p=>{assert(files.has(p),'unexpected read '+p);return files.get(p)},writeFileSync:(p,s)=>files.set(p,s)};
 vm.runInNewContext(code,{fs:io,execFileSync:()=>{},process:{execPath:process.execPath}},{filename:name});
}
for(const variant of ['legacy','site'])test('actual R1176 → R1177 → R1301 build supports '+variant+' General group',()=>{
 const input=variant==='legacy'?raw.replace(withSite,general):raw;
 assert(input.includes(variant==='legacy'?general:withSite));
 const files=new Map([[bundle,input],[page,fs.readFileSync(page,'utf8')]]);
 run('enable-r1176-lab-finance.mjs',files);
 run('enable-r1177-lab-settings-finance.mjs',files);
 assert(files.get(bundle).includes('pb1177LedgerDetails'));
 assert(files.get(bundle).includes('["sms","پیامک مشتریان"],["windowsAlert","هشدار ویندوز"],["snappbox","اسنپ و ارسال"]]'));
 run('enable-r1301-lab-site-general.mjs',files);
 const result=files.get(bundle);
 assert(result.includes('["snappbox","اسنپ و ارسال"],["site","سایت اختصاصی"]]'));
 assert.equal(result.split('["site","سایت اختصاصی"]').length-1,1);
 assert(!result.includes('{key:"notifications",label:"اعلان و ارتباط"'));
 assert(!result.includes('{key:"system",label:"سیستم و ارسال"'));
 const copy=new Map(files);run('enable-r1177-lab-settings-finance.mjs',files);run('enable-r1301-lab-site-general.mjs',files);
 assert.equal(files.get(bundle),copy.get(bundle));
 fs.writeFileSync('/tmp/photobridge-r1303-built.mjs',files.get(bundle));
});
test('R1301 still rejects an unknown General group',()=>{
 const files=new Map([[bundle,'items:[["unexpected","unknown"]]'],[page,'<head></head>']]);
 assert.throws(()=>run('enable-r1301-lab-site-general.mjs',files),/anchor changed/);
});
