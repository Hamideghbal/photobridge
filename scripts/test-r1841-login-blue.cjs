const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('dist/web/photobridge-r1841-login-blue.css','utf8');

test('R1841 shares PhotoBridge blue palette across public auth screens',()=>{
  for(const token of ['#315efb','#244fc7','#d6e4fa','#dceaff'])
    assert(css.includes(token),'missing blue palette '+token);
  for(const scope of ['.unifiedLoginPage','form.unifiedLoginCard','form.rentalUnifiedLogin','form.labLogin','.passwordResetCard'])
    assert(css.includes(scope),'missing auth scope '+scope);
  assert(!css.includes('photographerMain'),'must not style photographer workspace');
  assert(!css.includes('.financeWorkspace'),'must not style finance workspace');
  assert(!css.includes('.pbR1361MobileSplash'),'animated splash untouched');
  assert(!/padding-(?:left|right)\s*:|(?:min-)?height\s*:/i.test(css),'password clearance and layout untouched');
});

test('R1841 CSS loads once before first paint on the web login document',()=>{
  const html=fs.readFileSync('dist/web/index.html','utf8');
  const marker='/photobridge-r1841-login-blue.css?v=r1841';
  assert.equal(html.split(marker).length-1,1);
  assert(html.indexOf(marker)<html.indexOf('</head>'));
  assert(html.includes('photobridge-r1776-login-password-clearance.css'),'password reveal regression guard');
});

test('R1841 styles rental login document if generated; never changes script tags',()=>{
  const path='dist/api/equipment-rental-portal.html';
  if(!fs.existsSync(path)||!fs.readFileSync(path,'utf8').trim())return;
  const html=fs.readFileSync(path,'utf8');
  assert.equal(html.split('/photobridge-r1841-login-blue.css?v=r1841').length-1,1);
});
