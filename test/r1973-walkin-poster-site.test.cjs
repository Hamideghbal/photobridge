'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../dist/web/photobridge-walkin-a4-minimal-r1975.js'),'utf8');
const walkin='https://photobridge.ir/walkin/hamid';
function fixture(domains,{siteError=false}={}){
 let html='',closed=false;const alerts=[],button={disabled:false,textContent:'چاپ'},panel={querySelector:()=>({value:walkin})};
 const context={URL,encodeURIComponent,MutationObserver:class{observe(){}},document:{readyState:'loading',addEventListener(){}},window:{open:()=>({document:{open(){},write(value){html=value},close(){}},close(){closed=true}})},alert:value=>alerts.push(value),fetch:async url=>({ok:url!=='/api/lab/site'||!siteError,json:async()=>url==='/api/lab/walkin'?{lab:{name:'لاب حمید'},url:walkin}:{domains,config:{portfolioUrl:'https://portfolio.invalid/hamid'}}})};
 vm.createContext(context);vm.runInContext(source.replace('async function openPoster(', 'globalThis.posterTest={documentHtml,openPoster};\nasync function openPoster('),context);
 return {open:()=>context.posterTest.openPoster(button,panel),read:()=>html,button,alerts,get closed(){return closed}};
}
function destination(html){const src=html.match(/class="qr-image"[^>]*src="([^"]+)"/)[1].replace(/&amp;/g,'&');return new URL(src).searchParams.get('data')}
test('active connected lab site replaces fallback text while QR still opens actual photo upload',async()=>{const f=fixture([{hostname:'old.example.com',active:false},{hostname:'hamid.example.com',active:true}]);await f.open();const html=f.read();assert(html.includes('hamid.example.com'));assert(html.includes('ورود به سایت'));assert(html.includes('class="website-section"'));assert(!html.includes('https://hamid.example.com/'));assert(!html.includes('portfolio.invalid'));assert(!html.includes('لینک مستقیم ارسال عکس'));assert.equal(destination(html),walkin);assert.equal(f.button.disabled,false);assert.equal(f.closed,false);});
for(const [name,domains,options] of [['no domain',[],{}],['inactive domain',[{hostname:'hamid.example.com',active:false}],{}],['site unavailable',[],{siteError:true}]])test(name+': only QR appears with no printed portfolio/upload URL',async()=>{const f=fixture(domains,options);await f.open();const html=f.read();assert(html.includes('class="page onlyqr"'));assert(!html.includes('class="website-section"'));assert(!html.includes('class="website-address"'));assert(!html.includes('روش اول:'));assert(!html.includes(walkin));assert.equal(destination(html),walkin);assert(!html.includes('portfolio.invalid'));assert.equal(f.alerts.length,0);});
test('website and frozen Windows poster deliver the same fresh bytes, including encoded variants',()=>{
 const zlib=require('node:zlib'),web=path.resolve(__dirname,'../dist/web'),name='photobridge-walkin-a4-minimal-r1975.js',bytes=fs.readFileSync(path.join(web,name));
 assert(fs.readFileSync(path.join(web,'index.html'),'utf8').includes(name+'?v=2026-11-23-r1975'));
 assert(fs.readFileSync(path.join(web,'lab-desktop-ui',name)).equals(bytes));
 for(const folder of [web,path.join(web,'lab-desktop-ui')])for(const [suffix,decode] of [['.gz',zlib.gunzipSync],['.br',zlib.brotliDecompressSync]]){
  const file=path.join(folder,name+suffix);if(fs.existsSync(file))assert(decode(fs.readFileSync(file)).equals(bytes),file);
 }
});

test('R1974 approved minimalist A4 design keeps the QR central and has no decorative panels',async()=>{
 const f=fixture([{hostname:'hamid.example.com',active:true}]);await f.open();
 const html=f.read();
 for(const text of ['عکس‌هات رو همین‌جا','برای چاپ بفرست!','اسکن QR','ورود به سایت','اسکن / ورود','انتخاب عکس','ثبت سفارش','لاب حمید']){
  assert(html.includes(text),'missing approved design text: '+text);
 }
 assert.match(html,/@page\{size:A4 portrait;margin:0\}/);
 assert.match(html,/background:#fff/);
 assert.match(html,/class="qr-frame"/);
 assert.match(html,/class="qr-corner tr"/);
 assert.match(html,/class="website-address"/);
 assert.match(html,/@font-face/);
 assert(!html.includes('linear-gradient(175deg'));
 assert(!html.includes('class="top"'));
 assert(!html.includes('class="alternative"'));
 assert(html.includes('qr.decode?qr.decode()'));
 assert(html.includes('qr.naturalWidth'));
 assert.equal(destination(html),walkin);
});
test('R1974 print preview escapes lab names rather than treating them as HTML',()=>{
 const ctx={URL,encodeURIComponent,MutationObserver:class{observe(){}},document:{readyState:'loading',addEventListener(){}}};
 vm.createContext(ctx);
 vm.runInContext(source.replace('async function openPoster(', 'globalThis.posterTest={documentHtml};\nasync function openPoster('),ctx);
 const html=ctx.posterTest.documentHtml({labName:'استودیو <img onerror=alert(1)>',walkinUrl:walkin,siteUrl:'https://hamid.example.com/'});
 assert(html.includes('استودیو &lt;img onerror=alert(1)&gt;'));
 assert(!html.includes('استودیو <img'));
 assert(html.includes('hamid.example.com'));
});

test('R1975 unique cache-proof entrypoint and visible version marker',()=>{
 const index=fs.readFileSync(path.join(__dirname,'../dist/web/index.html'),'utf8');
 assert(index.includes('/photobridge-walkin-a4-minimal-r1975.js?v=2026-11-23-r1975'));
 assert(!index.includes('/photobridge-r1969-walkin-a4-poster.js?'));
 assert(source.includes("const POSTER_REVISION='R1975'"));
 assert(source.includes('button.dataset.posterRevision=POSTER_REVISION'));
 assert(source.includes('پوستر مینیمال A4'));
 const f=fixture([{hostname:'hamid.example.com',active:true}]);
 return f.open().then(()=>{assert(f.read().includes('data-poster-revision="R1975"'));});
});
