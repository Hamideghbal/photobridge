const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const helper=fs.readFileSync('scripts/r2082-equipment-reader.js.txt','utf8'),ctx={window:{}};vm.runInNewContext(helper,ctx);const {returnMatch,queue}=ctx.window.pb2082QrReader;
test('physical reader matches only assigned owned equipment; duplicate, unknown and ambiguous serial rejected',()=>{
 const slots=[{code:'CAM-1',serial:'S1',checked:false},{code:'CAM-2',serial:'S1',checked:false},{code:'EXT',serial:'S2',isExternal:true}];
 assert.equal(returnMatch(slots,'PB|CAM-1|S1').slot,slots[0]);
 assert.equal(returnMatch(slots,'S1').error,'ambiguous');assert.equal(returnMatch(slots,'PB|unknown|S1').error,'not_order');
 assert.equal(returnMatch(slots,'S2').error,'not_order');assert.equal(returnMatch(slots,'OTHER').error,'not_order');
 slots[0].checked=true;assert.equal(returnMatch(slots,'CAM-1').error,'duplicate');assert.equal(returnMatch(slots,'CAM-2').slot,slots[1]);
});
test('rapid physical scans serialize, pending state drains, closed dialog ignores scans',async()=>{
 const events=[],pending=[],q=queue(async code=>{events.push('start:'+code);await Promise.resolve();events.push('end:'+code);return true},n=>pending.push(n),()=>{});
 await Promise.all([q.push('A'),q.push('B'),q.push('C')]);assert.deepEqual(events,['start:A','end:A','start:B','end:B','start:C','end:C']);assert.equal(q.pending,0);assert.equal(pending.at(-1),0);
 q.close();assert.equal(await q.push('D'),false);
});
test('both Store portals have isolated reader mode, cleanup, explicit return and matching snapshot hashes',()=>{
 const root='dist/web/desktop-ui/',name='photobridge-r100f73-staff-desktop-return.js',portal='equipment-rental-portal.html';
 for(const f of ['dist/api/'+portal,root+portal]){const s=fs.readFileSync(f,'utf8');assert.match(s,/pb2082QrReader\.mount/);assert.match(s,/staff-desktop-return\.js\?v=r2082/);assert.match(s,/reader\?\.close\(\);stopCamera\(\)/);assert.match(s,/token!==cameraEpoch/);const i=s.indexOf('<script id="pb2082ReaderRuntime">'),j=s.indexOf('</script>',i);new vm.Script(s.slice(s.indexOf('>',i)+1,j));}
 for(const f of ['dist/web/'+name,root+name]){const s=fs.readFileSync(f,'utf8');assert.match(s,/returnMatch\(slots,raw\)/);assert.match(s,/match\.slot\.checked=true/);assert.match(s,/missingConfirmed/);assert.match(s,/window\.confirm\(prompt\)/);}
 const m=JSON.parse(fs.readFileSync(root+'manifest.json','utf8'));for(const n of [name,portal])assert.equal(m.files.find(x=>x.name===n).sha256,crypto.createHash('sha256').update(fs.readFileSync(root+n)).digest('hex'));
});
test('physical input uses only the dedicated field and does not submit the order during test mode',()=>{
 assert.match(helper,/input\.addEventListener\('keydown'/);
 assert.match(helper,/\['Enter','Tab'\]\.includes\(e\.key\)/);
 assert.match(helper,/if\(testing\)\{testing=false/);
 assert.match(helper,/هیچ تجهیزی ثبت نشد/);
 assert.match(helper,/if\(work\.pending\)return;testing=!testing/);
 assert.match(helper,/navigator\.serial\.requestPort\(\)/);
 const s=fs.readFileSync('dist/api/equipment-rental-portal.html','utf8');
 assert.match(s,/await add\(raw,null,true\)/);assert.match(s,/if\(!hardware\)window\.storeNotice/);
});
