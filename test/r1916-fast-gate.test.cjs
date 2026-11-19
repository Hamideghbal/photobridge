'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const host=fs.readFileSync(path.join(__dirname,'..','host.cjs'),'utf8');
const expr="require('./lab104-candidate.cjs').pinnedOnly===true&&['1.0.104','1.0.105'].includes(require('./package.json').version)";
test('R1916: 1.0.105 candidate native bundle enables immediate download lane',()=>{
 assert.equal(host.split('JSON.stringify('+expr+')').length,2);
 assert(host.includes("if(name==='assets/index-UIRefine-v655-r84.js')"));
 for(const [version,pinned,expected] of [['1.0.104',true,true],['1.0.105',true,true],['1.0.106',true,false],['1.0.105',false,false]]){
  const actual=vm.runInNewContext(expr,{require(name){if(name==='./package.json')return {version};if(name==='./lab104-candidate.cjs')return {pinnedOnly:pinned};throw Error('unexpected_module')}});
  assert.equal(actual,expected);
 }
});
