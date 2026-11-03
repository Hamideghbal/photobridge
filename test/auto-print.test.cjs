'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {installAutoPrint,validateJob}=require('../auto-print.cjs');
const html='<!doctype html><html><body>Test invoice</body></html>';
function setup({success=true,printers=[{name:'Office A4',isDefault:true}]}={}){
 const values=new Map(),handlers=new Map(),store={get:k=>values.get(k),set:(k,v)=>values.set(k,v)},main={webContents:{getPrintersAsync:async()=>printers}};let printed=0;
 class Window{constructor(){this.webContents={print:(opts,cb)=>{printed++;assert.equal(opts.silent,true);cb(success,success?'':'driver failure')}}}async loadURL(url){assert.match(url,/^data:text\/html/)}destroy(){}}
 const ipcMain={handle:(n,fn)=>handlers.set(n,fn),removeHandler:n=>handlers.delete(n)};
 const stop=installAutoPrint({ipcMain,BrowserWindow:Window,store,getWindow:()=>main,getOrigin:()=>'http://127.0.0.1:43761'});
 values.set('labId','lab-a');values.set('auth',{user:{labRole:'lab_admin'}});
 const call=(jobKey='invoice:a')=>handlers.get('lab-auto-print')({sender:main.webContents,senderFrame:{url:'http://127.0.0.1:43761/lab/orders'}},{jobKey,html});
 return {call,stop,handlers,values,main,get printed(){return printed}};
}
test('bridge refuses untrusted sender',async()=>{const x=setup();assert.equal((await x.handlers.get('lab-auto-print')({sender:{},senderFrame:{url:'http://127.0.0.1:43761'}},{jobKey:'invoice:a',html})).error,'forbidden');assert.equal(x.printed,0);x.stop()});
test('default-printer invoice submits at most once',async()=>{const x=setup();assert.equal((await x.call()).ok,true);assert.equal((await x.call()).error,'already_submitted');assert.equal(x.printed,1);assert.equal(x.values.get('lab-auto-print:v1:lab-a:invoice:a').state,'submitted');x.stop()});
test('spool rejection is never automatically retried',async()=>{const x=setup({success:false});assert.equal((await x.call()).error,'spooler_rejected_needs_review');assert.equal((await x.call()).error,'already_submitted');assert.equal(x.printed,1);x.stop()});
test('missing printer does not mark a print attempted',async()=>{const x=setup({printers:[]});assert.equal((await x.call()).error,'no_default_printer');assert.equal(x.values.has('lab-auto-print:v1:lab-a:invoice:a'),false);assert.equal(x.printed,0);x.stop()});
test('reject invalid print payloads',()=>{for(const job of [{jobKey:'bad key',html},{jobKey:'invoice:1',html:'<!doctype html><script>alert(1)</script>'},{jobKey:'invoice:1',html:'<!doctype html><iframe></iframe>'},{jobKey:'invoice:1',html:'<!doctype html>'+'x'.repeat(600001)}])assert.throws(()=>validateJob(job))});

test('concurrent submissions of the same job cannot both print',async()=>{const x=setup();const both=await Promise.all([x.call('invoice:parallel'),x.call('invoice:parallel')]);assert.equal(both.filter(y=>y.ok).length,1);assert.equal(both.filter(y=>y.error==='already_submitted').length,1);assert.equal(x.printed,1);x.stop()});
