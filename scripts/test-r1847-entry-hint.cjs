const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('a recent hint is usable only for the selected lab; quota-failed or stale metadata cannot select another lab',()=>{
 const source=fs.readFileSync('scripts/r1847-lab-entry.js','utf8'),prefix=source.slice(0,source.indexOf(' const entry='));
 for(const [stored,selected,age,expected] of [['current','current',100,'current'],['old','current',100,null],['old','',100,null],['current','current',13000,null]]){
  const context={window:{},location:{pathname:'/photographer/orders/flow',search:'?workspace=print&pbEntryDone=lab'},URLSearchParams,Date,sessionStorage:{getItem:key=>key==='photobridge:r1847:entry-lab'?JSON.stringify({id:stored,name:'Lab',at:Date.now()-age}):key==='photobridge:r99:selected-lab'?selected:null}};
  vm.runInNewContext(prefix+'window.result=hint;})();',context);assert.equal(context.window.result?.id||null,expected);
 }
});
