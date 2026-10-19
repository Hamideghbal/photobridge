const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM}=require(process.env.PB_JSDOM_PATH||'jsdom');
const code=fs.readFileSync('dist/web/photobridge-v795-runtime-fix.js','utf8');
async function scenario(route,mode=''){
 const dom=new JSDOM(`<div id="root"><main class="photographerMain photographerPrintWorkspace ${mode}"><nav class="photographerPrintModeNav"><div class="photographerPrintModeUtilityCluster"><button class="photographerPrintCommonAction finance">فاکتور</button><button class="photographerPrintCommonAction archive">آرشیو</button><button class="photographerPrintModeBack">بازگشت</button></div></nav><button class="photographerContextAction financeAction">مالی</button></main></div>`,{url:'https://photobridge.ir'+route+'?workspace=print',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.matchMedia=()=>({matches:false,addEventListener(){}});w.console.info=()=>{};
 const rafs=new Set();w.requestAnimationFrame=fn=>{let id=setTimeout(()=>{rafs.delete(id);fn(Date.now())},16);rafs.add(id);return id};w.cancelAnimationFrame=id=>{clearTimeout(id);rafs.delete(id)};
 let mutations=0;const observer=new w.MutationObserver(rs=>mutations+=rs.length);observer.observe(w.document,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
 w.eval(code);await new Promise(r=>setTimeout(r,1050));mutations=0;await new Promise(r=>setTimeout(r,200));
 assert.equal(mutations,0,route+' must stop mutating while idle');
 // Real navigation and replaced native controls still trigger normalization.
 const main=w.document.querySelector('main');const button=w.document.createElement('button');button.className='photographerContextAction financeAction';main.append(button);await new Promise(r=>setTimeout(r,60));assert(button.classList.contains('pb795LowerFinanceHidden'));
 mutations=0;await new Promise(r=>setTimeout(r,100));assert.equal(mutations,0,route+' must settle after a real update');
 if(route.includes('upload'))assert(w.document.querySelector('.finance').classList.contains('pb795InvoiceHidden'));
 if(route.includes('finance'))assert(w.document.querySelector('.finance').classList.contains('pb795FinanceBack'));
 observer.disconnect();w.requestAnimationFrame=()=>0;for(const id of rafs)w.cancelAnimationFrame(id);w.close();console.log('PASS',route);
}
(async()=>{for(const [route,mode]of [['/photographer/orders/flow',''],['/photographer/archive',''],['/photographer/upload','photographerUploadWorkspaceMode'],['/photographer/finance/invoices','']])await scenario(route,mode)})().catch(e=>{console.error(e);process.exitCode=1});
