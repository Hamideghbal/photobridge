const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname,'r1593-lab-card-flight.js'),'utf8');

test('R1595: full-size Lab card flies above all Windows scroll containers, then shrinks and fades into tab', () => {
  const listeners = {}, animations = [];
  function element(className, rect={left:0,top:0,width:0,height:0}) {
    const node = {
      className,rect,children:[],textContent:'',parentElement:null,isConnected:true,
      style:{setProperty(k,v){this[k]=v},removeProperty(k){delete this[k]}},
      classList:{contains(name){return node.className.split(/\s+/).includes(name)}},
      getBoundingClientRect(){return this.rect},getClientRects(){return [this.rect]},
      appendChild(child){this.children.push(child);child.parentElement=this;return child},
      cloneNode(){return element(this.className,this.rect)},
      setAttribute(){},removeAttribute(){},querySelectorAll(){return []},
      closest(){return null},getAttribute(){return null},remove(){this.isConnected=false},
      animate(frames,options){animations.push({frames,options});return {addEventListener(){}}}
    };
    return node;
  }
  const workspace=element('labRoleWorkspace');
  const scroll=element('labOrderScrollArea');
  const card=element('labOrderCard',{left:50,top:270,width:600,height:120});
  const tab=element('labStatusTab',{left:240,top:80,width:140,height:32});
  const button=element('button');const body=element('body');
  tab.textContent='آماده تحویل (۳)';
  button.getAttribute=name=>name==='data-pb1578-stage'?'ready':null;
  button.closest=selector=>selector==='.labOrderCard'?card:selector==='button'?button:null;
  button.disabled=false;tab.closest=()=>null;
  card.parentElement=scroll;scroll.parentElement=workspace;
  workspace.querySelectorAll=()=>[tab];
  const doc={querySelector:()=>workspace,createElement:()=>element(''),body,
    addEventListener:(name,callback)=>{listeners['doc:'+name]=callback}};
  const win={addEventListener:(name,callback)=>{listeners['win:'+name]=callback},
    matchMedia:()=>({matches:false}),
    getComputedStyle:()=>({getPropertyValue:()=>''})};
  new Function('window','document','location','setTimeout',source)(
    win,doc,{pathname:'/lab/orders'},()=>0
  );
  listeners['doc:click']({target:{closest:()=>button}});
  assert.equal(win.PB1594LabFlightDiagnostic,'captured:ready');
  // Simulate React deleting the real order before HTTP status response.
  card.isConnected=false;card.parentElement=null;
  listeners['win:photobridge-lab-card-flight']({detail:{to:'ready'}});
  assert.equal(win.PB1594LabFlightDiagnostic,'flying-visible:ready');
  assert.equal(animations.length,1);
  assert.equal(body.children.length,1,'flying card must be under body, not clipped in Lab scroll');
  assert.equal(workspace.children.length,0,'Lab content is never animated or replaced');
  const layer=body.children[0];
  assert.equal(layer.style.position,'fixed');
  assert.equal(layer.style['z-index'],'2147483647');
  assert.equal(layer.style.width,'600px');
  assert.equal(layer.style.height,'120px');
  const {frames,options}=animations[0];
  assert.equal(frames[0].opacity,1);
  assert.match(frames[0].transform,/scale\(1\)/);
  assert.match(frames[1].transform,/scale\(1\.035\)/);
  assert.ok(frames.some(f=>f.offset>.2&&f.offset<.8&&f.opacity===1&&/scale\(\.66\)/.test(f.transform)));
  assert.equal(frames.at(-1).opacity,0);
  assert.match(frames.at(-1).transform,/scale\(0\.(?:0[8-9]|1[0-8])\)/);
  assert.match(frames.at(-1).transform,/translate3d\(/);
  assert.equal(options.duration,1380);
});

test('R1595: website and Windows install updated version and Liara verifies flight',()=>{
  const enable=fs.readFileSync(path.join(__dirname,'enable-r1593-lab-card-flight.mjs'),'utf8');
  const build=fs.readFileSync(path.join(__dirname,'liara-fast-build.mjs'),'utf8');
  assert.match(enable,/dist\/web\/lab-desktop-ui/);
  assert.match(enable,/dist\/web'/);
  assert.match(enable,/\?v=r1595/);
  assert.match(build,/test-r1594-lab-card-flight\.cjs/);
  assert.doesNotMatch(source,/PB1592FlyOrder/);
});