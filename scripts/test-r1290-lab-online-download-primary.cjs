const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const client=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const patch=fs.readFileSync('scripts/enable-r1183-lab-image-ui.mjs','utf8');
const server=fs.readFileSync('dist/api/server.js','utf8');
const page=fs.readFileSync('dist/web/index.html','utf8');
const start=client.indexOf('async function Ky('),end=client.indexOf('async function Qy(',start);
assert.ok(start>0&&end>start,'generated direct-download method must exist');
const download=client.slice(start,end);
const factory=Function('Sr','Uc','fetch',download+'\nreturn Ky;');

test('direct image download sends the same primary-browser identity as lab API calls',async()=>{
 const requests=[];
 const id='ed972f12-9a84-4818-a9dc-5aff801fea10';
 const Ky=factory(()=>'',()=>id,async(url,opts)=>{
  requests.push({url,opts});
  return {ok:true,headers:{get:()=>null}};
 });
 await Ky('photo-id');
 assert.equal(requests.length,1);
 assert.equal(requests[0].url,'/api/lab/order-files/photo-id/content?download=1');
 assert.equal(requests[0].opts.credentials,'include');
 assert.equal(requests[0].opts.headers['x-photobridge-device-id'],id);
 assert.equal(requests[0].opts.headers['x-photobridge-portal'],'lab');
 assert.equal(requests[0].opts.headers.authorization,undefined);
});

test('direct image download preserves bearer auth when available',async()=>{
 let options;
 const Ky=factory(()=>'session-test-token',()=> 'known-primary',async(url,opts)=>{
  options=opts;
  return {ok:true,headers:{get:()=>null}};
 });
 await Ky('other-photo');
 assert.equal(options.headers.authorization,'Bearer session-test-token');
 assert.equal(options.headers['x-photobridge-device-id'],'known-primary');
});

test('stream patch remains the source of generated device binding',()=>{
 assert.match(patch,/const deviceId=Uc\(\)/);
 assert.match(patch,/'x-photobridge-device-id':deviceId/);
 assert.match(download,/const deviceId=Uc\(\)/);
 assert.match(download,/'x-photobridge-device-id':deviceId/);
 assert.match(page,/labDownload=r1290/);
});

test('server still restricts online file transfer to primary lab device',()=>{
 const start=server.indexOf('PB1183 authenticated lab image stream');
 const end=server.indexOf('const labFilePreview =',start);
 assert.ok(start>=0&&end>start,'authenticated download endpoint found');
 const guard=server.slice(start,end);
 assert.match(guard,/if\(isDownload\)/);
 assert.match(guard,/requestDeviceId!==device.primary_download_device_id/);
 assert.match(guard,/not_primary_download_device/);
 assert.doesNotMatch(download,/vc\(/,'downloader must never change primary registration');
});
