'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../dist/web/photobridge-r1969-walkin-a4-poster.js'),'utf8');
const walkin='https://photobridge.ir/walkin/hamid';
function fixture(domains,{siteError=false}={}){
 let html='',closed=false;const alerts=[],button={disabled:false,textContent:'چاپ'},panel={querySelector:()=>({value:walkin})};
 const context={URL,encodeURIComponent,MutationObserver:class{observe(){}},document:{readyState:'loading',addEventListener(){}},window:{open:()=>({document:{open(){},write(value){html=value},close(){}},close(){closed=true}})},alert:value=>alerts.push(value),fetch:async url=>({ok:url!=='/api/lab/site'||!siteError,json:async()=>url==='/api/lab/walkin'?{lab:{name:'لاب حمید'},url:walkin}:{domains,config:{portfolioUrl:'https://portfolio.invalid/hamid'}}})};
 vm.createContext(context);vm.runInContext(source.replace('async function openPoster(', 'globalThis.posterTest={documentHtml,openPoster};\nasync function openPoster('),context);
 return {open:()=>context.posterTest.openPoster(button,panel),read:()=>html,button,alerts,get closed(){return closed}};
}
function destination(html){const src=html.match(/<img src="([^"]+)"/)[1].replace(/&amp;/g,'&');return new URL(src).searchParams.get('data')}
test('active connected lab site replaces fallback text while QR still opens actual photo upload',async()=>{const f=fixture([{hostname:'old.example.com',active:false},{hostname:'hamid.example.com',active:true}]);await f.open();const html=f.read();assert(html.includes('https://hamid.example.com/'));assert(html.includes('روش دوم: از طریق سایت لابراتوار'));assert(!html.includes('portfolio.invalid'));assert(!html.includes('لینک مستقیم ارسال عکس'));assert.equal(destination(html),walkin);assert.equal(f.button.disabled,false);assert.equal(f.closed,false);});
for(const [name,domains,options] of [['no domain',[],{}],['inactive domain',[{hostname:'hamid.example.com',active:false}],{}],['site unavailable',[],{siteError:true}]])test(name+': only QR appears with no printed portfolio/upload URL',async()=>{const f=fixture(domains,options);await f.open();const html=f.read();assert(html.includes('class="page onlyqr"'));assert(!html.includes('<section class="alternative">'));assert(!html.includes('<div class="site"'));assert(!html.includes('روش اول:'));assert(!html.includes(walkin));assert.equal(destination(html),walkin);assert(!html.includes('portfolio.invalid'));assert.equal(f.alerts.length,0);});
test('website and frozen Windows poster deliver the same fresh bytes, including encoded variants',()=>{
 const zlib=require('node:zlib'),web=path.resolve(__dirname,'../dist/web'),name='photobridge-r1969-walkin-a4-poster.js',bytes=fs.readFileSync(path.join(web,name));
 assert(fs.readFileSync(path.join(web,'index.html'),'utf8').includes(name+'?v=r1973'));
 assert(fs.readFileSync(path.join(web,'lab-desktop-ui',name)).equals(bytes));
 for(const folder of [web,path.join(web,'lab-desktop-ui')])for(const [suffix,decode] of [['.gz',zlib.gunzipSync],['.br',zlib.brotliDecompressSync]]){
  const file=path.join(folder,name+suffix);if(fs.existsSync(file))assert(decode(fs.readFileSync(file)).equals(bytes),file);
 }
});
