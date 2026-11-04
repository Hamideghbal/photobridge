const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, 'r1593-lab-card-flight.js'), 'utf8');

test('R1594: unmounted Lab order still flies into its destination and shrinks away', () => {
  const listeners = {}, animations = [];
  function element(className, rect = {left:0,top:0,width:0,height:0}) {
    const node = {
      className, rect, children: [], textContent: '', parentElement: null, isConnected: true,
      style: {setProperty(k,v){this[k]=v},removeProperty(k){delete this[k]}},
      classList: {contains(name){return node.className.split(/\s+/).includes(name)}},
      getBoundingClientRect(){return this.rect}, getClientRects(){return [this.rect]},
      appendChild(child){this.children.push(child);child.parentElement=this;return child},
      cloneNode(){return element(this.className,this.rect)},
      setAttribute(){},removeAttribute(){},querySelectorAll(){return []},
      closest(){return null},getAttribute(){return null},
      remove(){this.isConnected=false},
      animate(frames, options){animations.push({frames,options});return {addEventListener(){}}}
    };
    return node;
  }
  const workspace=element('labRoleWorkspace');
  const scroll=element('labOrderScrollArea');
  const card=element('labOrderCard',{left:50,top:270,width:600,height:120});
  const tab=element('labStatusTab',{left:240,top:80,width:140,height:32});
  const button=element('button');
  tab.textContent='آماده تحویل (۳)';
  button.getAttribute=name=>name==='data-pb1578-stage'?'ready':null;
  button.closest=selector=>selector==='.labOrderCard'?card:selector==='button'?button:null;
  button.disabled=false;tab.closest=()=>null;
  card.parentElement=scroll;scroll.parentElement=workspace;
  workspace.querySelectorAll=()=>[tab];
  const doc={querySelector:()=>workspace,createElement:()=>element(''),
    addEventListener:(name,callback)=>{listeners['doc:'+name]=callback}};
  const win={addEventListener:(name,callback)=>{listeners['win:'+name]=callback},
    matchMedia:()=>({matches:false})};
  new Function('window','document','location','setTimeout',source)(
    win,doc,{pathname:'/lab/orders'},()=>0
  );
  listeners['doc:click']({target:{closest:()=>button}});
  // Simulate React removing the live card while PATCH /api/lab/orders resolves.
  card.isConnected=false; card.parentElement=null;
  listeners['win:photobridge-lab-card-flight']({detail:{to:'ready'}});
  assert.equal(win.PB1594LabFlightDiagnostic,'flying:ready');
  assert.equal(animations.length,1);
  const {frames,options}=animations[0];
  assert.match(frames.at(-1).transform,/scale\(0\.(?:0[8-9]|1[0-8])\)/);
  assert.equal(frames.at(-1).opacity,0);
  assert.match(frames.at(-1).transform,/translate3d\(/);
  assert.equal(options.duration,880);
  assert.equal(workspace.children[0].children[0].className,'labOrderScrollArea');
});

test('R1594: build patches both site and Windows Lab, not photographer pages', () => {
  const enable=fs.readFileSync(path.join(__dirname,'enable-r1593-lab-card-flight.mjs'),'utf8');
  assert.match(enable,/dist\/web\/lab-desktop-ui/);
  assert.match(enable,/dist\/web'/);
  assert.match(enable,/photobridge-lab-card-flight/);
  assert.match(enable,/\?v=r1594/);
  assert.doesNotMatch(source,/PB1592FlyOrder/);
});
