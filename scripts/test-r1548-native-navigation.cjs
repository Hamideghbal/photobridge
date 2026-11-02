'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const read=p=>fs.readFileSync(p,'utf8');
const native='dist/web/lab-desktop-ui/';
const web=read('dist/web/assets/index-UIRefine-v655-r84.js');
const ui=read(native+'assets/index-UIRefine-v655-r84.js');
test('Windows Snapp opens synchronously from the click and copies GPS, not address',()=>{
 assert(ui.includes('M=()=>{if(!w())return;void p(y,"GPS مبدأ");F()}'));
 assert(ui.includes('Ke=window.open(Ge,"_blank","noopener,noreferrer");return!0'));
 assert(!ui.includes('M=async()=>{w()&&(await p(T,"مبدأ"),F())}'));
 assert(!ui.includes('مرورگر باز شدن اسنپ را مسدود کرده است'));
 assert(ui.includes('onClick:()=>p(y,"GPS مبدأ")'));
 assert(ui.includes('onClick:()=>p(I,"GPS مقصد")'));
 assert(!ui.includes('کپی آدرس'));
 assert(!ui.includes('کپی کل مسیر'));
 assert(ui.includes('کپی GPS مبدأ + باز کردن اسنپ'));
});
test('Windows site editor is opened by the Electron external HTTPS handler',()=>{
 assert(ui.includes('href:"https://photobridge.ir/lab/site-editor",target:"_blank",rel:"noopener noreferrer",title:"ویرایش سایت در مرورگر"'));
 assert(!ui.includes('href:"/lab/site-editor",children:"ویرایش دیداری سایت"'));
});
test('Lab login footer is Lab-only in the Windows UI, other roles remain on website',()=>{
 assert(!ui.includes('!k&&E&&e.jsx("a",{href:"/photographer",children:"ورود عکاس / آتلیه"})'));
 assert(!ui.includes('!k&&E&&e.jsx("a",{href:"/rental",children:"ورود فروشگاه"})'));
 assert(ui.includes('E?"ورود لابراتوار":"ورود عکاس / آتلیه"'));
 assert(web.includes('!k&&E&&e.jsx("a",{href:"/photographer",children:"ورود عکاس / آتلیه"})'));
 assert(web.includes('!k&&E&&e.jsx("a",{href:"/rental",children:"ورود فروشگاه"})'));
 assert(web.includes('href:"/lab/site-editor",children:"ویرایش دیداری سایت"'));
 assert(web.includes('M=async()=>{w()&&(await p(T,"مبدأ"),F())}'));
});
test('immutable native hot update manifest matches exact bytes',()=>{
 const manifest=JSON.parse(read(native+'manifest.json'));
 const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
 assert.equal(manifest.channel,'lab');assert.equal(manifest.protocol,1);
 assert.equal(manifest.build,hash(JSON.stringify(manifest.files)));
 for(const name of ['index.html','assets/index-UIRefine-v655-r84.js']){
  const entry=manifest.files.find(x=>x.name===name);
  assert(entry&&entry.url==='/lab-desktop-ui/'+name);
  assert.equal(entry.sha256,hash(fs.readFileSync(native+name)));
 }
 assert(read(native+'index.html').includes('&nativeNavigation=r1548'));
 assert(!read('dist/web/index.html').includes('&nativeNavigation=r1548'));
});
