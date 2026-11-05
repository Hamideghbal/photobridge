const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync('scripts/enable-r1613-lab-invoice-ui.mjs','utf8');
const from=source.indexOf("  const componentStart=js.indexOf('function Uf(')");
const to=source.indexOf('  // R1603 pre-invoice client guard',from);
assert.ok(from>0&&to>from,'extract the production source, do not duplicate the algorithm');
const render=new Function('js','root','read','console',source.slice(from,to)+'return js');
const original="function Uf(){let Nn=async le=>{var xt,Mt,qt;const nt=Se;Fe(null),await ye()};x.useEffect(()=>{},[])}function vi(){}";
const optimized="function Uf(){let updatedPriceHandler=async le=>{const pending=Se;Fe(null);await ye()};x.useEffect(()=>{},[])}function vi(){}";
test('R1615 keeps known original price-save preview action',()=>{
 const actual=render(original,'dist/web',()=>"Nn=async le=>{await Qn(le.invoice.id)}",{warn(){}});
 assert.match(actual,/PB1613 confirmed pricing callback/);
 assert.match(actual,/await Qn\(le\.invoice\.id/);
});
test('R1615 does not fail, alter, or misreplace a rewritten price-save callback',()=>{
 const messages=[];
 const actual=render(optimized,'dist/web',()=>{throw Error('unexpected replacement')},{warn:value=>messages.push(value)});
 assert.equal(actual,optimized);
 assert.ok(messages.some(text=>text.includes('Preserving existing price-save callback')));
});
