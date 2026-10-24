const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path='dist/web/assets/index-UIRefine-v655-r84.js';
const js=fs.readFileSync(path,'utf8');
const begin=js.indexOf('function aw('),end=js.indexOf('function iw(',begin);
const labChat=js.slice(begin,end);
const picker=js.slice(js.indexOf('function PB1405Contacts('));
const css=fs.readFileSync('dist/web/photobridge-r1406-lab-chat.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');

test('lab chat cannot open, send to or poll platform support',()=>{
 assert.ok(begin>=0&&end>begin,'chat module is present');
 assert.doesNotMatch(labChat,/\/api\/lab\/platform-chat/);
 assert.doesNotMatch(labChat,/p\(!0\),m\(null\),C\.current/);
 assert.doesNotMatch(labChat,/عکاسی‌ها و پشتیبانی/);
 assert.match(labChat,/const re=t==="customer"\|\|!!c;/);
 assert.match(labChat,/if\(t==="lab"&&g\)return;/);
 assert.doesNotMatch(picker,/children:'پشتیبانی'/);
 assert.doesNotMatch(picker,/onPlatform/);
 assert.match(picker,/children:'انتخاب عکاسی'/);
 assert.match(picker,/pb1405Unread/);
});

test('message and voice controls retain working behavior and compact style',()=>{
 assert.match(labChat,/chatComposer/);
 assert.match(labChat,/PB1402Voice/);
 assert.match(js,/function PB1404Audio/);
 assert.match(css,/height:\s*36px\s*!important/);
 assert.match(css,/max-height:\s*36px\s*!important/);
 assert.match(css,/\.chatComposer > button\.primary/);
 assert.match(css,/\.pb1404AudioBody input\[type=range\]/);
 assert.match(css,/\.chatMessages \.bubble:has\(\.pb1404Audio\)/);
 assert.match(css,/font-size:\s*16px\s*!important/);
 assert.match(css,/overflow-y:\s*auto\s*!important/);
});

test('chat uses first-header desktop space and carries a fresh cache token',()=>{
 assert.match(css,/min-width:\s*821px/);
 assert.match(css,/\.labRoleWorkspace > \.chatDock:not\(\.collapsed\)/);
 assert.match(css,/top:\s*64px\s*!important/);
 assert.match(css,/body\.pbAdminImpersonating/);
 assert.match(html,/photobridge-r1406-lab-chat\.css\?v=r1406/);
 assert.match(html,/chatLayout=r1406/);
 assert.match(js,/\/\* PB1406 compact lab chat \*\//);
});
