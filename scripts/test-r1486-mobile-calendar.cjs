const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const root='dist/web/',source=fs.readFileSync(root+'photobridge-r1486-calendar.js','utf8');
function helpers(ua='Android Mobile Chrome'){
 const fields=[],ctx={navigator:{userAgent:ua},window:{},document:{readyState:'loading',addEventListener(){},documentElement:{classList:{contains:()=>true}},querySelectorAll:()=>fields}};
 vm.runInNewContext(source.replace('function start(){','window.helpers={calendarRect,closeOutside};function start(){'),ctx);return {ctx,fields,...ctx.window.helpers};
}
test('calendar stays narrower than screen and always opens beneath its field, including scrolled coordinates',()=>{
 const {calendarRect}=helpers();for(const width of [280,320,360,412])for(const bottom of [100,240,430]){
  const rect=calendarRect({top:bottom-36,bottom},{left:0,top:0,width,height:800},730);
  assert.equal(rect.top,bottom+6);assert(rect.width<=300);assert(rect.left>=24);assert(rect.left+rect.width<=width-24);assert.equal(rect.maxHeight,730-8-rect.top);
 }
 const rect=calendarRect({top:160,bottom:200},{left:12,top:70,width:360,height:500},530);assert.equal(rect.left,42);assert.equal(rect.top,206);
});
test('tapping blank space closes open calendars through React triggers, inside taps and desktop remain untouched',()=>{
 const h=helpers();let closed=0;const inside={},outside={};const field={contains:target=>target===inside,querySelector:selector=>selector.includes('Popover')?{}:{click(){closed++}}};h.fields.push(field);
 h.closeOutside({target:inside});assert.equal(closed,0);h.closeOutside({target:outside});assert.equal(closed,1);
 assert.equal(helpers('Windows NT 10').calendarRect,undefined);
});
test('phone CSS gives accounting mark enough specificity to override legacy fixed dimensions and compacts statement',()=>{
 const css=fs.readFileSync(root+'photobridge-r1486-mobile-calendar.css','utf8');
 assert(css.includes('button.externalAccountingBtn.pb1435AccountingMark{width:100%!important;min-width:0!important;max-width:none!important;height:44px'));
 assert(css.includes('.statementDateControl>.dateClearBtn{display:none'));
 assert(css.includes('grid-template-columns:1.15fr 1fr 1fr'));
 assert(css.includes('.statementActions{display:grid'));assert(css.includes('font-size:15px'));
 assert(css.includes('min-width:58px'));assert(css.includes('font-size:11px'));
 for(const line of css.split('\n').filter(l=>l.startsWith('html.')))assert(line.startsWith('html.pb1482LabPhoneMode body #root .labRoleWorkspace '));
});
test('one calendar positioner is loaded, and every frozen Windows asset retains verified bytes',()=>{
 const html=fs.readFileSync(root+'index.html','utf8');assert(!html.includes('src="/photobridge-r1485-calendar.js'));assert.equal((html.match(/src="\/photobridge-r1486-calendar.js/g)||[]).length,1);
 const dir=root+'lab-desktop-ui/',manifest=JSON.parse(fs.readFileSync(dir+'manifest.json','utf8'));for(const f of manifest.files)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(dir+f.name)).digest('hex'),f.sha256,f.name);
 const build=fs.readFileSync('scripts/liara-fast-build.mjs','utf8');assert(build.indexOf('enable-r1486-mobile-calendar.mjs')>build.indexOf('enable-r1485-mobile-finance.mjs'));new vm.Script(source);
});

test('opening low on screen scrolls field into room once; later scrolls reposition without moving the page',()=>{
 let y=560,scrollMoves=0;const props={};
 const trigger={getBoundingClientRect:()=>({top:y,bottom:y+36})};
 const scroller={getBoundingClientRect:()=>({top:140}),querySelector:()=>({getBoundingClientRect:()=>({height:45})}),set scrollTop(v){scrollMoves++;y-=v},get scrollTop(){return 0}};
 const popup={style:{getPropertyValue:k=>props[k],setProperty:(k,v)=>props[k]=v}};
 const field={querySelector:s=>s.includes('Popover')?popup:trigger,closest:()=>scroller};
 const ctx={navigator:{userAgent:'Android Mobile'},window:{innerWidth:360,innerHeight:800},document:{readyState:'loading',addEventListener(){},documentElement:{classList:{contains:()=>true}},querySelector:()=>({getBoundingClientRect:()=>({top:720})}),querySelectorAll:()=>[field]}};
 vm.runInNewContext(source.replace('function start(){','window.paint=paint;function start(){'),ctx);ctx.window.paint();assert.equal(scrollMoves,1);assert.equal(props['--pb1485-top'],(y+42)+'px');
 y-=20;ctx.window.paint();assert.equal(scrollMoves,1);assert.equal(props['--pb1485-top'],(y+42)+'px');
});
