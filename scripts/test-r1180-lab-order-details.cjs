const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const main=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const intake=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1180-lab-order-details.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const backend=fs.readFileSync('dist/api/server.js','utf8');

test('intake photos have a paper selector without the tall visible paper caption',()=>{
 assert.match(intake,/paper=select\(paperOptions\);paper.className='pb1180IntakePaper'/);
 assert.doesNotMatch(intake,/field\(actions,'کاغذ عکس',select\(paperOptions\)\)/);
 assert.match(intake,/quantity.append\(minus,count,plus\)/);
});
test('lab print details are grouped by size, with editable paper and copies',()=>{
 for(const marker of ['PB1180 grouped lab order photo details','pb1180GroupData','pb1180RenderGroups','pb1180Paper','pb1180Quantity','pb1180Patch(file,{printCopies:','pb1180Summary()'])
  assert.ok(main.includes(marker),marker);
 assert.match(main,/y\.files\.length\?y\.order\.mode==="print"\?pb1180RenderGroups\(\)/);
 assert.ok(main.includes('type:"number",min:1,max:99'));
});
test('count edits use the existing validated pre-print PATCH and local file rename',()=>{
 assert.match(main,/\/api\/lab\/order-files\/"\+file\.id\+"\/print-settings"/);
 assert.ok(main.includes('await original.target.dir.removeEntry'));
 assert.match(backend,/invalid_print_copies/);
 assert.match(backend,/print_copies=\$7,original_name=\$8/);
 assert.match(main,/order_print_settings_locked/);
});
test('no extra fix button or compact/cards toggle for normal print orders',()=>{
 assert.ok(!main.includes('className:"miniFixBtn"'));
 assert.ok(main.includes('y.order.mode==="album"&&e.jsxs("div",{className:"labFileViewToggle"'));
 assert.ok(main.includes('pb1180SizeStats'));
});
test('CSS and cache bust are included and photo scrolling remains available',()=>{
 assert.match(html,/photobridge-r1180-lab-order-details\.css\?v=r1180/);
 assert.match(html,/details=r1180/);
 assert.match(css,/pb1180DetailGroups/);
 assert.match(css,/overflow-x:auto/);
 assert.match(css,/pb1180IntakePaper/);
});
