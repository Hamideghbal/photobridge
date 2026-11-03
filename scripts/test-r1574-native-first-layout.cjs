'use strict';const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('native full-width layout is selected before module scripts, excludes login and small screens',()=>{
 const html=fs.readFileSync('dist/web/lab-desktop-ui/index.html','utf8'),marker=html.indexOf('/* R1574 native first layout */');assert(marker>0);assert(marker<html.indexOf('type="module"'));
 const script=html.slice(marker,html.indexOf('</script>',marker));
 for(const [pathname,desktop,expected]of [['/lab/orders',true,true],['/lab/archive',true,true],['/lab/login',true,false],['/lab/orders',false,false]]){let applied=false;vm.runInNewContext(script,{location:{pathname},matchMedia:()=>({matches:desktop}),document:{documentElement:{classList:{add:value=>applied=value==='pb1363OrderQueue'}}}});assert.equal(applied,expected)}
 assert(!fs.readFileSync('dist/web/index.html','utf8').includes('R1574 native first layout'));
});
