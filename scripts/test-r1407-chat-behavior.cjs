const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const code=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
const i=code.indexOf('function aw('),j=code.indexOf('function iw(',i);
const chat=code.slice(i,j);
const css=fs.readFileSync('dist/web/photobridge-r1407-chat-behavior.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');

test('outside pointerdown collapses an open chat, not clicks inside or an open picker',()=>{
 const match=chat.match(/const onOutside=event=>\{([\s\S]*?)\};document\.addEventListener\("pointerdown",onOutside,!0\)/);
 assert.ok(match,'outside click handler is registered');
 let collapsed=0,picker=false;
 const document={querySelector:s=>s==='dialog.pb1405Picker[open]'&&picker?{}:null};
 const onOutside=new Function('document','r','const onOutside=event=>{'+match[1]+'};return onOutside')(document,v=>{if(v===true)collapsed++});
 const event=(inside,button=0)=>({button,target:{closest:()=>inside?{}:null}});
 onOutside(event(true));
 assert.equal(collapsed,0,'controls inside chat must remain interactive');
 picker=true;
 onOutside(event(false));
 assert.equal(collapsed,0,'outside click must not dismiss the active selection dialog');
 picker=false;
 onOutside(event(false,2));
 assert.equal(collapsed,0,'context menu must not collapse');
 onOutside(event(false));
 assert.equal(collapsed,1,'outside click collapses chat');
 assert.match(chat,/removeEventListener\("pointerdown",onOutside,!0\)/,'listener is cleaned up');
 assert.match(chat,/if\(s\)return;const onOutside/,'listener disabled when collapsed');
});

test('clear left-pointing chevron replaces text glyph without breaking collapse button',()=>{
 assert.match(chat,/className:"chatCloseButton",onClick:\(\)=>r\(!0\)/);
 assert.match(chat,/aria-label:"جمع کردن گفتگو"/);
 assert.match(chat,/strokeWidth:2\.8/);
 assert.match(chat,/d:"m15 18-6-6 6-6"/);
 assert.match(css,/color: #1c4e79 !important/);
 assert.match(css,/background: #e3f0fb !important/);
});

test('header measurement is adaptive and shared composer rules reach lab and photographer',()=>{
 assert.match(chat,/document\.querySelectorAll\("\.labRoleWorkspace \.unifiedRoleHeader"\)/);
 assert.match(chat,/getBoundingClientRect\(\)\.bottom/);
 assert.match(chat,/Math\.ceil\(bottom\)\+10/);
 assert.match(css,/top: var\(--pb1407-lab-chat-top, 82px\) !important/);
 assert.match(css,/html body #root \.roleWorkspace > \.chatDock:not\(\.collapsed\) > \.chatComposer > textarea/);
 assert.match(css,/html body #root \.roleWorkspace > \.chatDock:not\(\.collapsed\) > \.chatComposer > button\.primary/);
 assert.match(css,/height: 36px !important/);
 assert.match(css,/height: 40px !important/);
 assert.match(css,/padding-inline-end: 43px !important/);
 assert.match(css,/\.pb1402Voice\[data-phase=idle\] \.pb1404Mic/);
 assert.match(code,/function PB1404Audio\(/);
 assert.match(code,/function PB1405Contacts\(/);
 assert.match(html,/photobridge-r1407-chat-behavior\.css\?v=r1407/);
 assert.match(html,/chatBehavior=r1407/);
});
