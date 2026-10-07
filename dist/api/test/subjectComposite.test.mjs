import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {validateOutline,subjectPlacement,composeProtectedSubject,PRINT_WIDTH,PRINT_HEIGHT} from '../subjectComposite.js';
const require=createRequire(import.meta.url);
let sharp;
try{sharp=require('sharp')}catch{if(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)sharp=require(`${process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES}/sharp`)}
test('outline rejects a tiny or out of bounds shape',()=>{
  assert.throws(()=>validateOutline(Array.from({length:8},()=>[2000,50])));
  assert.throws(()=>validateOutline([[1,1],[2,1],[3,1],[4,1],[4,4],[3,4],[2,4],[1,4]]));
});
test('subject placement never enlarges the original pixels',()=>{
  assert.equal(subjectPlacement({left:0,top:0,width:300,height:400},300,400).scale,1);
  assert.ok(subjectPlacement({left:0,top:0,width:5000,height:6000},5000,6000).scale<1);
});
test('print image uses source subject pixels and a generated backdrop', {skip:!sharp},async()=>{
  const source=await sharp({create:{width:300,height:400,channels:3,background:'#ec2020'}}).png().toBuffer();
  const background=await sharp({create:{width:300,height:400,channels:3,background:'#215ef1'}}).png().toBuffer();
  const outline=[[100,100],[450,100],[700,100],[900,100],[900,900],[700,900],[450,900],[100,900]];
  const result=await composeProtectedSubject({sharp,source,background,outline});
  const meta=await sharp(result.buffer).metadata();
  assert.equal(meta.width,PRINT_WIDTH);assert.equal(meta.height,PRINT_HEIGHT);
  assert.equal(meta.density,300);assert.equal(result.subjectScale,1);
  const person=await sharp(result.buffer).extract({left:result.placement.x+Math.floor(result.placement.width/2),top:result.placement.y+Math.floor(result.placement.height/2),width:1,height:1}).raw().toBuffer();
  const scene=await sharp(result.buffer).extract({left:0,top:0,width:1,height:1}).raw().toBuffer();
  assert.deepEqual([...person.subarray(0,3)],[236,32,32]);assert.deepEqual([...scene.subarray(0,3)],[33,94,241]);
});
