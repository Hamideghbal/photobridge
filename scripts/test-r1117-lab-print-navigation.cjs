const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('dist/web/photobridge-v904r99-lab-chooser.js','utf8');
const begin=source.indexOf('  function isPrintPrimaryNav('),end=source.indexOf("  for(const k of ['pushState'",begin);
function click(pathname,lab){
 let handler,navigation,prevented=false;const el={textContent:'چاپ',dataset:{},getAttribute:()=>null,closest:selector=>selector.includes('.labBottom')?(lab?{}:null):{}};
 const location={pathname,origin:'https://panel.test',assign:value=>navigation=value};
 vm.runInNewContext(source.slice(begin,end),{location,URL,isPhotographerRoute:()=>pathname.startsWith('/photographer/'),isPrintRoute:()=>false,ROOT_ID:'chooser',document:{getElementById:()=>null,addEventListener:(_event,fn)=>handler=fn},routeCover:()=>{},cleanup:()=>{}});
 handler({target:{closest:()=>el},preventDefault:()=>prevented=true,stopImmediatePropagation:()=>{}});return {navigation,prevented};
}
test('lab Print remains in the lab even with an existing photographer session',()=>{assert.deepEqual(click('/lab/orders',true),{navigation:undefined,prevented:false});assert.deepEqual(click('/photographer/gallery',true),{navigation:undefined,prevented:false});});
test('photographer Print still opens the lab chooser',()=>{const result=click('/photographer/gallery',false);assert.equal(result.prevented,true);assert.match(result.navigation,/photographer\/orders\/flow.*pbLabChooser=1/);});
