
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const file='photobridge-r1804-album-order-layout.css',css=fs.readFileSync('dist/web/'+file,'utf8');
const scope='html body #root .photographerMain .albumOrderGrid.pb1802CompactAlbum';
const block=(selector,from=css)=>{
  const start=from.indexOf(selector+'{');
  assert(start>=0,'missing CSS selector: '+selector);
  const end=from.indexOf('}',start);
  assert(end>start,'unterminated CSS selector: '+selector);
  return from.slice(start+selector.length+1,end);
};
test('R1806 album keeps configurator on the RIGHT and the original quote on the LEFT',()=>{
  const outer=block(scope);
  assert.match(outer,/direction:rtl!important/);
  assert.match(outer,/grid-template-columns:minmax\(0,1fr\) minmax\(280px,330px\)!important/);
  const b=block(scope+'>.albumConfigurator');
  assert.match(b,/grid-column:1!important/);
  assert.match(b,/grid-row:1!important/);
  assert.match(b,/direction:rtl!important/);
  assert.match(b,/grid-template-columns:minmax\(0,1\.15fr\) minmax\(0,1fr\)!important/);
  const quote=block(scope+'>.albumQuoteCard');
  assert.match(quote,/grid-column:2!important/);
  assert.match(quote,/grid-row:1!important/);
  assert.doesNotMatch(quote,/position:static/);
});
test('R1804 right section 1, left sections 2 and 3 and full-width design files',()=>{
  const prefix=scope+'>.albumConfigurator>';
  assert.match(block(prefix+'.albumConfigBlockCompactV409'),/grid-column:1!important/);
  assert.match(block(prefix+'.albumConfigBlockCompactV409'),/grid-row:2 \/ span 2!important/);
  assert.match(block(prefix+'.albumCoverConfigBlock'),/grid-column:2!important/);
  assert.match(block(prefix+'.albumCoverConfigBlock'),/grid-row:2!important/);
  assert.match(block(prefix+'.albumLabInstructions'),/grid-column:2!important/);
  assert.match(block(prefix+'.albumLabInstructions'),/grid-row:3!important/);
  assert.match(block(prefix+'.albumFilesQcBlock'),/grid-column:1\/-1!important/);
  assert.match(block(prefix+'.albumFilesQcBlock'),/grid-row:4!important/);
});
test('R1804 optional extras use left column and push notes/files below',()=>{
  assert.match(block(scope+'>.albumConfigurator>.albumConfigBlock:has(.albumExtrasChoose)'),/grid-row:3!important/);
  assert.match(block(scope+'>.albumConfigurator:has(.albumExtrasChoose)>.albumLabInstructions'),/grid-row:4!important/);
  assert.match(block(scope+'>.albumConfigurator:has(.albumExtrasChoose)>.albumFilesQcBlock'),/grid-row:5!important/);
});
test('R1804 phones and tablets retain a single-column accessible reading order',()=>{
  const mobile=css.slice(css.indexOf('@media(max-width:900px)'));
  assert(mobile.includes('grid-template-columns:minmax(0,1fr)!important'));
  assert.match(block(scope+'>.albumQuoteCard',mobile),/grid-column:1!important;grid-row:2!important/);
  assert.match(block(scope+'>.albumConfigurator',mobile),/grid-column:1!important;grid-row:1!important/);
  for(const name of ['albumConfigBlockCompactV409','albumCoverConfigBlock','albumLabInstructions','albumFilesQcBlock'])assert(mobile.includes(name),name);
  assert(mobile.includes('grid-row:auto!important'));
});
test('R1804 final site and Windows HTML and manifest include the shipped CSS',()=>{
  for(const root of ['dist/web','dist/web/lab-desktop-ui']){
    const html=fs.readFileSync(root+'/index.html','utf8');
    assert.equal(html.split(file+'?v=r1804a').length,2);
    assert(html.indexOf('photobridge-r1802-album-compact.css')<html.indexOf(file));
    assert.equal(fs.readFileSync(root+'/'+file,'utf8'),css);
  }
  const root='dist/web/lab-desktop-ui',m=JSON.parse(fs.readFileSync(root+'/manifest.json','utf8'));
  for(const name of [file,'index.html']){
    const entry=m.files.find(x=>x.name===name);assert(entry,name);
    assert.equal(entry.sha256,crypto.createHash('sha256').update(fs.readFileSync(root+'/'+name)).digest('hex'));
  }
  assert.equal(m.build,crypto.createHash('sha256').update(JSON.stringify(m.files)).digest('hex'));
});
test('R1804 original album functionality and quote selectors remain in shipped web/native JS',()=>{
  for(const root of ['dist/web','dist/web/lab-desktop-ui']){
    const content=fs.readFileSync(root+'/assets/index-UIRefine-v655-r84.js','utf8');
    for(const token of ['albumOrderGrid pb1802CompactAlbum','albumConfigBlockCompactV409','albumCoverConfigBlock','albumLabInstructions','albumFilesQcBlock','albumExtrasChoose','albumQuoteCard'])assert(content.includes(token),'missing original UI token '+token);
  }
});
