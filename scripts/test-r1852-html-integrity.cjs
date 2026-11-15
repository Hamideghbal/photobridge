const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
for(const file of ['dist/web/index.html','dist/api/equipment-rental-portal.html'])test(file+': login asset insertion preserves every inline script',()=>{
 const html=fs.readFileSync(file,'utf8'),asset='/photobridge-r1726-login-install.js?v=r1726';
 assert.equal(html.split(asset).length-1,1,'install the login asset exactly once');
 let checked=0;
 for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(!match[2].trim()||/application\/ld\+json/.test(match[1]))continue;
  assert.doesNotThrow(()=>new vm.Script(match[2]),'invalid inline script '+(match[1]||++checked));checked++;
 }
 assert(checked>0,'inspect actual inline scripts');
 const at=html.indexOf(asset),prior=html.lastIndexOf('<script',at);
 assert(html.indexOf('</script>',prior)<html.lastIndexOf('</body>'),'asset closes before the real body');
});
