const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),sharp=require('sharp');
test('user cream splash is the only web launch, with local typography and the supplied bridge/shutter geometry',()=>{
 const html=fs.readFileSync('dist/web/index.html','utf8');
 assert.equal((html.match(/id="pbR1361MobileSplash"/g)||[]).length,1);
 assert(html.includes('data-launch="r1838-user"'));
 assert(html.includes('id="pb1838Userdeck"'));assert(html.includes('id="pb1838Userring"'));
 for(let i=0;i<6;i++)assert(html.includes('id="pb1838Userblade'+i+'"'));
 assert(html.includes('CAPTURE MEMORIES'));assert(html.includes('PBLaunchPlayfair'));
 assert(!html.includes('pb1838Orbit'));assert(!html.includes('id="sndBtn"'));assert(!html.includes('id="controls"'));
 const splash=fs.readFileSync('scripts/r1838-unified-launch.html','utf8');assert(!/https?:|setTimeout|AudioContext|canvas/.test(splash));
 assert(!fs.readFileSync('scripts/r1838-unified-launch.css','utf8').includes('fonts.googleapis.com'));
 for(const f of ['playfair-display-latin-700-r1838.woff2','montserrat-latin-300-r1838.woff2'])assert(fs.statSync('dist/web/assets/'+f).size<30000);
 assert(html.includes('pb1838LaunchLeaving'));assert(html.includes('__PB1836RoleHandoff'));
});
test('native and web share the cream palette, unchanged app identity, and a safe icon without baked duplicate lettering',async()=>{
 const manifest=JSON.parse(fs.readFileSync('dist/web/photobridge.webmanifest'));
 assert.equal(manifest.id,'/photobridge-pwa');assert.equal(manifest.start_url,'/');assert.equal(manifest.name,'PhotoBridge');
 assert.equal(manifest.background_color,'#F7F1E7');assert.equal(manifest.theme_color,'#F7F1E7');
 assert.deepEqual(manifest.icons.map(i=>i.purpose),['any','maskable','any','maskable']);
 assert(!/<text\b/.test(fs.readFileSync('scripts/r1838-user-symbol.svg','utf8')));
 for(const size of [180,192,512]){
  const {data,info}=await sharp('dist/web/photobridge-app-'+size+'-r1838.png').removeAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(info.width,size);assert.deepEqual([...data.slice(0,3)],[247,241,231]);let visible=0;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
   const offset=(y*size+x)*3;if(Math.max(data[offset],data[offset+1],data[offset+2])<120){visible++;assert(Math.hypot(x-size/2,y-size/2)<size*.4,'logo fits Android adaptive safe area')}
  }
  assert(visible>size*size*.01,'native mark remains visible');
 }
 for(const file of ['dist/web/index.html','dist/api/equipment-rental-book.html'])assert(fs.readFileSync(file,'utf8').includes('photobridge.webmanifest?v=r1838'));
});
