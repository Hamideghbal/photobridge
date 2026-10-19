const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process');
const {JSDOM}=require(process.env.PB_JSDOM_PATH||'jsdom');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pb1311-'));fs.mkdirSync(path.join(tmp,'dist/web'),{recursive:true});
const file='photobridge-r1126-desktop-navigation.js';fs.copyFileSync('dist/web/'+file,path.join(tmp,'dist/web',file));fs.writeFileSync(path.join(tmp,'dist/web/index.html'),'<script src="./'+file+'?v=1"></script>');
function build(){execFileSync(process.execPath,[path.resolve('scripts/enable-r1311-panel-session-refresh.mjs')],{cwd:tmp});}build();const source=fs.readFileSync(path.join(tmp,'dist/web',file),'utf8'),html=fs.readFileSync(path.join(tmp,'dist/web/index.html'),'utf8');build();assert.equal(source,fs.readFileSync(path.join(tmp,'dist/web',file),'utf8'));assert.equal(html,fs.readFileSync(path.join(tmp,'dist/web/index.html'),'utf8'));assert(html.includes('panelSession=r1311'));execFileSync(process.execPath,['--check',path.join(tmp,'dist/web',file)]);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{for(const panel of ['print','store']){
 const d=new JSDOM('<div id="root"><header id="photographerRoleHeaderV710"><div class="photographerHeaderIdentity"><h1>عکاسی</h1></div></header></div>',{url:'https://photobridge.ir/photographer/gallery?logged_out=1&pbDesktopPanel='+panel,runScripts:'outside-only',pretendToBeVisual:true});const w=d.window;w.matchMedia=()=>({matches:true});w.fetch=async()=>({ok:false});const idle=[];w.requestIdleCallback=fn=>idle.push(fn);w.eval(source);await sleep(50);
 assert.equal(w.document.querySelectorAll('iframe').length,0,'do not cache login documents before session is ready');
 w.dispatchEvent(new w.CustomEvent('photobridge-navigation-tabs',{detail:{tabs:{ai:false,album:false,instagram:false}}}));assert.equal(idle.length,0,'early settings cannot warm pre-login documents');
 const auth=role=>{w.document.body.classList.toggle('pbAuthenticatedPhotographerPortal',role==='customer');w.dispatchEvent(new w.CustomEvent('photobridge-auth-session-changed',{detail:{labRole:role}}));};auth('customer');await sleep(30);
 const frame=w.document.querySelector('[data-panel="'+panel+'"] iframe');assert(frame,'requested tab resumes after login');assert(!frame.parentElement.hidden);assert(frame.src.includes('pbDesktopContent=1'));assert(!frame.src.includes('logged_out'));
 auth('customer');assert.equal(w.document.querySelector('[data-panel="'+panel+'"] iframe'),frame,'repeated same-session events retain document');
 auth('');assert.equal(w.document.querySelectorAll('.pb1126ContentPanel').length,0,'logout removes all panel documents');for(const task of idle.splice(0))task();assert.equal(w.document.querySelectorAll('.pb1126ContentPanel').length,0,'cancelled warmup cannot recreate stale documents');
 auth('customer');const fresh=w.document.querySelector('[data-panel="'+panel+'"] iframe');assert(fresh&&fresh!==frame,'next login gets fresh document without page refresh');
 w.close();console.log('PASS '+panel+': pre-login deferral, immediate login resume, same-session reuse, logout and re-login');
}console.log('PASS finalizer idempotence, cache refresh and JavaScript syntax');})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>fs.rmSync(tmp,{recursive:true,force:true}));
