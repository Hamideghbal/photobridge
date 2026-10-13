const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const css=fs.readFileSync('dist/web/photobridge-r1185-lab-desktop-statement-layout.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
const r1177=fs.readFileSync('dist/web/photobridge-r1177-lab-finance-layout.css','utf8');
const v891=fs.readFileSync('dist/web/photobridge-v891-lab-finance-selects.css','utf8');
const source=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const region=(a,b)=>{const i=css.indexOf(a),j=css.indexOf(b,i+a.length);assert.ok(i>=0&&j>i);return css.slice(i,j)};
test('desktop-only statement corrections do not touch mobile or ledger calculations',()=>{
 assert.match(css,/@media \(min-width:821px\) and \(hover:hover\) and \(pointer:fine\)/);
 assert.doesNotMatch(css,/@media\(max-width:820px\)/);
 assert.doesNotMatch(css,/UPDATE\s+|DELETE\s+|POST\s+|\/api\//);
 assert.match(css,/\.financeWorkspace \.customerStatementWorkspace/);
});
test('restore ONE photographer searchable selector; obsolete extra search hidden even though r1177 redisplays it',()=>{
 assert.match(r1177,/\.statementCustomerPicker>\.statementCustomerSearchWrap\{\s*display:block!important/);
 assert.match(v891,/\.statementCustomerPicker>\.statementCustomerSearchWrap\{\s*display:none!important/);
 assert.match(css,/\.statementCustomerPicker>\.statementCustomerSearchWrap\{\s*display:none!important/);
 assert.match(css,/\.statementCustomerPicker>\.pb891SearchableCustomerSelect/);
 assert.match(css,/\.pbSelectSearchShell/);
});
test('four-column desktop form with responsive fallback and visible search/date/select',()=>{
 assert.match(css,/grid-template-columns:minmax\(250px,1\.5fr\) minmax\(155px,\.8fr\) minmax\(155px,\.8fr\) minmax\(105px,auto\)!important/);
 assert.match(css,/min-width:821px\) and \(max-width:1230px/);
 assert.match(css,/min-width:821px\) and \(max-width:970px/);
 assert.match(css,/\.statementDateControl \.persianDateTrigger/);
 assert.match(css,/\.statementFilters>\.primary/);
 assert.match(css,/\.statementActions>button/);
});
test('document summary and seven-column ledger remain readable with horizontal scroll inside the card',()=>{
 assert.match(css,/\.statementSummary\{\s*display:grid!important;grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.match(css,/\.statementTableWrap\{\s*display:block!important;[^\}]*overflow-x:auto!important/);
 assert.match(css,/table\.statementTable\{\s*display:table!important;width:100%!important;min-width:820px/);
 assert.match(css,/\.pb1177LedgerInvoice table\{\s*min-width:580px!important/);
 for(const label of ['بدهکار','بستانکار','باقیمانده','شماره سند'])assert.ok(source.includes(label),label);
});
test('last-loaded stylesheet and cache version protect Windows refresh',()=>{
 assert.match(html,/photobridge-r1185-lab-desktop-statement-layout\.css\?v=r1185/);
 const i=html.indexOf('photobridge-r1177-lab-finance-layout.css'),j=html.indexOf('photobridge-r1185-lab-desktop-statement-layout.css');
 assert.ok(i>=0&&j>i);
 assert.match(html,/statement=r1185/);
});
