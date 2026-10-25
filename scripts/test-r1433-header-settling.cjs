const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
test('content boundary follows the actual toolbar bottom and settled header positions',()=>{
 let edge=148,showToolbar=true;const props=new Map(),style={getPropertyValue:k=>props.get(k)||'',setProperty:(k,v)=>props.set(k,v)};
 const toolbar={getBoundingClientRect:()=>({bottom:parseFloat(props.get('--pb1431-toolbar-top')||'0')+57,height:52})};
 const header={getClientRects:()=>[{}],getBoundingClientRect:()=>({bottom:edge})},root={querySelectorAll:()=>[header]},main={style,querySelector:sel=>sel.startsWith(':scope')?{}:showToolbar?toolbar:null,closest:()=>root};
 let observedOptions;class Observer{constructor(){}observe(_,opts){observedOptions=opts||observedOptions}disconnect(){}}
 const context={window:{},innerHeight:900,document:{querySelector:()=>main,documentElement:{classList:{toggle(){}}},getElementById:()=>({}),readyState:'loading',addEventListener(){}},matchMedia:()=>({matches:true,addEventListener(){}}),getComputedStyle:()=>({visibility:'visible'}),ResizeObserver:Observer,MutationObserver:Observer,requestAnimationFrame(){},addEventListener(){}};
 let queue=fs.readFileSync('dist/web/photobridge-r1363-lab-queue.js','utf8').replace("if(document.readyState==='loading')","window.measureForTest=measure;window.startForTest=start;if(document.readyState==='loading')");
 vm.runInNewContext(queue,context);context.window.measureForTest();assert.equal(props.get('--pb1433-content-top'),'205px');assert.equal(props.get('--pb1431-toolbar-top'),'148px');
 edge=170;context.window.measureForTest();assert.equal(props.get('--pb1433-content-top'),'227px');showToolbar=false;edge=214;context.window.measureForTest();assert.equal(props.get('--pb1433-content-top'),'214px');context.window.startForTest();assert(Array.from(observedOptions.attributeFilter).includes('style'));
});
test('header settling build is repeatable, valid and updates standalone asset cache versions',()=>{
 const paths=['dist/web/photobridge-r1372-third-header.js','dist/web/photobridge-r1363-lab-queue.js','dist/web/photobridge-r1423-finance-bars.css','dist/web/index.html'],before=paths.map(p=>fs.readFileSync(p,'utf8'));
 execFileSync(process.execPath,['scripts/enable-r1433-header-settling.mjs']);paths.forEach((p,i)=>assert.equal(fs.readFileSync(p,'utf8'),before[i]));paths.slice(0,2).forEach(p=>execFileSync(process.execPath,['--check',p]));assert(before[3].includes('photobridge-r1372-third-header.js?v=r1433'));assert(before[3].includes('photobridge-r1363-lab-queue.js?v=r1433'));assert(before[3].includes('photobridge-r1423-finance-bars.css?v=r1433'));
});
