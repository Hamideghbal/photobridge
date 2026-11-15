const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
test('error/upload instrumentation leaves frozen Windows bytes untouched and still instruments live pages',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pb1852-frozen-'));
 try{
  const original='<html><head></head><body>existing UI</body></html>';
  for(const sub of ['desktop-ui','lab-desktop-ui','live']){fs.mkdirSync(path.join(dir,sub));fs.writeFileSync(path.join(dir,sub,'index.html'),original)}
  for(const file of ['scripts/enable-r1850-error-alerts.mjs','scripts/enable-r1851-upload-health.mjs']){
   const source=fs.readFileSync(file,'utf8'),start=source.indexOf('function visit(directory)'),end=source.indexOf("visit('dist/web');",start);
   assert(start>=0&&end>start,'actual production HTML visitor exists');
   vm.runInNewContext(source.slice(start,end)+';visit(directory)',{fs,revision:'r1852-test',directory:dir});
  }
  for(const frozen of ['desktop-ui','lab-desktop-ui'])assert.equal(fs.readFileSync(path.join(dir,frozen,'index.html'),'utf8'),original);
  const live=fs.readFileSync(path.join(dir,'live','index.html'),'utf8');
  assert(live.includes('photobridge-error-monitor-r1850.js?rev=r1852-test'));
  assert(live.includes('photobridge-upload-health-r1851.js?rev=r1852-test'));
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
