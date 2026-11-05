const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 test('R1610 '+root+' archive, discount and stage feedback',()=>{
  const asset=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  const header=fs.readFileSync(root+'/photobridge-r1147-lab-admin-header.js','utf8');
  const css=fs.readFileSync(root+'/photobridge-r1610-lab-ux.css','utf8');
  const runtime=fs.readFileSync(root+'/photobridge-r1610-lab-ux.js','utf8');
  const html=fs.readFileSync(root+'/index.html','utf8');
  assert.match(header,/R1610 no archive second header/);
  assert.match(header,/pb1148HasSecondary/);
  assert.match(asset,/R1610 inline finance discount/);
  assert.match(asset,/PB1585Discount,\{customer,onSaved\}/);
  assert.match(asset,/\/api\/lab\/finance\/customer-settings/);
  assert.match(asset,/discountEveryInvoices:info.every/);
  assert.match(asset,/e\.jsx\("button",\{type:"button",className:"pb1585DiscountEdit"/);
  assert.match(css,/\.timelineDot::after/);
  assert.match(css,/aria-busy="true"/);
  assert.match(css,/pb1610NotQueue/);
  assert.match(runtime,/pb1610StageClicked/);
  assert.match(html,/photobridge-r1610-lab-ux\.css\?v=r1610/);
  assert.match(html,/photobridge-r1610-lab-ux\.js\?v=r1610/);
 });
}
test('R1610 Windows manifest includes verified new files',()=>{
 const root='dist/web/lab-desktop-ui',m=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 for(const name of ['index.html','photobridge-r1147-lab-admin-header.js','assets/index-UIRefine-v655-r84.js','photobridge-r1610-lab-ux.js','photobridge-r1610-lab-ux.css']){
  const item=m.files.find(v=>v.name===name);assert.ok(item,'missing '+name);
  assert.equal(item.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
 assert.equal(m.build,crypto.createHash('sha256').update(JSON.stringify(m.files)).digest('hex'));
});