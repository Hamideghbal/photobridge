const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const vm=require('node:vm');
const source=fs.readFileSync('scripts/r1612-discount-dialog.js.txt','utf8');
const realm={console:{warn(){}}};
vm.runInNewContext(source,realm,{filename:'r1612-discount-dialog.js'});
test('R1612 discount values accept Persian and Latin numerals, preserving decimal precision',()=>{
 const parse=realm.pb1612DiscountInputs;
 assert.equal(parse('۵٫۵','۱۰').percent,5.5);
 assert.equal(parse('۵٫۵','۱۰').every,10);
 assert.equal(parse('100','1000').every,1000);
 assert.equal(parse('0','1').percent,0);
 for(const value of ['-1','101','2.555','abc',''])assert.ok(parse(value,'10').error,'invalid percentage '+value);
 for(const value of ['0','1001','2.5','abc',''])assert.ok(parse('10',value).error,'invalid interval '+value);
});
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 test('R1612 '+root+' renders fixed badge spinner and modal trigger',()=>{
  const app=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
  const css=fs.readFileSync(root+'/photobridge-r1612-discount-spinner.css','utf8');
  const html=fs.readFileSync(root+'/index.html','utf8');
  assert.match(app,/PB1612 independent discount modal and fixed spinner/);
  assert.match(app,/function pb1612OpenDiscountDialog\(/);
  assert.match(app,/e\.jsx\(PB1585Discount,\{customer,onSaved\}\)/);
  assert.match(app,/dialog\.showModal\(\)/);
  assert.match(app,/discountEveryInvoices:values\.every/);
  assert.match(app,/e\.jsxs\('button',\{type:'button',className:'pb1585DiscountEdit pb1612DiscountTrigger'/);
  assert.match(app,/\['24%','14%','18%','15%','9%','20%'\]/);
  assert.match(css,/position:absolute!important/);
  assert.match(css,/animation:pb1612CircleSpin \.72s linear infinite!important/);
  const badgeRule=css.slice(css.indexOf('> .timelineDot {'),css.indexOf('> .timelineDot::after {'));
  assert.doesNotMatch(badgeRule,/position:relative!important/);
  assert.doesNotMatch(badgeRule,/transform:translateX/);
  assert.match(css,/body > dialog\.pb1612DiscountModal/);
  assert.ok(html.includes('photobridge-r1612-discount-spinner.css?v=r1612'));
  assert.ok(html.includes('&labDiscountModal=r1612'));
  assert.ok(html.indexOf('photobridge-r1612-discount-spinner.css')>html.indexOf('photobridge-r1610-lab-ux.css'));
 });
}
test('R1612 generated Windows update manifest hashes match all modified assets',()=>{
 const root='dist/web/lab-desktop-ui',manifest=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
 for(const name of ['index.html','assets/index-UIRefine-v655-r84.js','photobridge-r1612-discount-spinner.css']){
  const row=manifest.files.find(x=>x.name===name);
  assert.ok(row,name);
  assert.equal(row.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
 }
 assert.equal(manifest.build,crypto.createHash('sha256').update(JSON.stringify(manifest.files)).digest('hex'));
});
