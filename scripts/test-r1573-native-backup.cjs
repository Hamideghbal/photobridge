'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('only native menu drops website backup; real native backup remains accessible on automation route',()=>{
 const web=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),native=fs.readFileSync('dist/web/lab-desktop-ui/assets/index-UIRefine-v655-r84.js','utf8');
 assert(web.includes('["backup","پشتیبان اطلاعات برنامه"]'));
 assert(!native.includes('["backup","پشتیبان اطلاعات برنامه"]'));
 const script=native.split('/* R1573 native backup */')[1];assert(script);
 let button=null,callback;const location={pathname:'/lab/settings/automation'},host={append(n){button=n}};
 const document={body:{},getElementById:id=>id==='pb1573NativeBackup'?button:null,querySelector:()=>host,createElement:()=>({style:{},remove(){button=null}})};
 const context={document,location,MutationObserver:class{constructor(fn){callback=fn}observe(){}},addEventListener(){},requestAnimationFrame:fn=>fn()};
 vm.runInNewContext(script,context);assert.equal(button.href,'/desktop/backups');const first=button;callback();assert.equal(button,first);
 location.pathname='/lab/settings';callback();assert.equal(button,null);
 location.pathname='/lab/settings/automation';callback();assert.equal(button.href,'/desktop/backups');
});
