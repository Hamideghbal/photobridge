const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const sharp=require('sharp');

test('R1360 produces one coherent blue/white icon and OS splash without a second web splash',async()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'pb1360-'));
  const web=path.join(tmp,'dist/web'),api=path.join(tmp,'dist/api');
  fs.mkdirSync(web,{recursive:true});fs.mkdirSync(api,{recursive:true});
  try {
    fs.copyFileSync('dist/web/photobridge-app-blue-r1360.svg',path.join(web,'photobridge-app-blue-r1360.svg'));
    const html='<html><head><link rel="manifest" href="/photobridge.webmanifest?v=r1286"/><link rel="apple-touch-icon" href="/photobridge-native-touch-r1286.png"/><style id="pbR1284LaunchStyle">@media(display-mode:standalone){body{background:#040e1a!important;color:#9fb5ce}}#pbAppSplashV780{display:none!important}</style></head><body><div id="root"></div></body></html>';
    for(const name of ['dist/web/index.html','dist/api/equipment-rental-book.html','dist/api/equipment-rental-portal.html']){
      const p=path.join(tmp,name);fs.writeFileSync(p,html);
    }
    const original={id:'/photobridge-pwa',name:'PhotoBridge',background_color:'#040e1a',theme_color:'#040e1a',icons:[],related_applications:[{platform:'webapp',url:'https://photobridge.ir/photobridge.webmanifest?v=r1286'}]};
    fs.writeFileSync(path.join(web,'photobridge.webmanifest'),JSON.stringify(original));
    const {buildBrand}=await import('./enable-r1360-blue-white-app-brand.mjs');
    await buildBrand(tmp);
    await buildBrand(tmp); // source step must be safe on repeat
    const manifest=JSON.parse(fs.readFileSync(path.join(web,'photobridge.webmanifest'),'utf8'));
    assert.equal(manifest.id,original.id);
    assert.equal(manifest.background_color,'#315efb');
    assert.equal(manifest.theme_color,'#315efb');
    assert.deepEqual(manifest.icons.map(x=>x.src),['/photobridge-native-192-r1360.png','/photobridge-native-512-r1360.png']);
    assert(manifest.icons.every(x=>x.purpose.includes('maskable')));
    assert.match(manifest.related_applications[0].url,/v=r1360/);
    const output=fs.readFileSync(path.join(web,'index.html'),'utf8');
    assert.match(output,/background:#315efb/);
    assert.match(output,/color:#ffffff/);
    assert.match(output,/photobridge.webmanifest\?v=r1360/);
    assert.match(output,/photobridge-native-touch-r1360.png/);
    assert(!output.includes('<div id="pbAppSplashV780"'));
    for(const size of [192,512,180]){
      const name=size===180?'photobridge-native-touch-r1360.png':`photobridge-native-${size}-r1360.png`;
      const img=sharp(path.join(web,name));const meta=await img.metadata();
      assert.equal(meta.width,size);assert.equal(meta.height,size);
      const {data,info}=await img.ensureAlpha().raw().toBuffer({resolveWithObject:true});
      const rgba=(x,y)=>[...data.subarray((y*info.width+x)*4,(y*info.width+x)*4+4)];
      assert.deepEqual(rgba(0,0),[49,94,251,255]);
      let white=0;for(let y=Math.floor(size*.25);y<Math.floor(size*.85);y++)for(let x=Math.floor(size*.18);x<Math.floor(size*.82);x++){
        const p=rgba(x,y);if(p[0]>245&&p[1]>245&&p[2]>245)white++;
      }
      assert(white>size*size*.005,'large white mark or wordmark must remain visible');
    }
  } finally {fs.rmSync(tmp,{recursive:true,force:true});}
});
