const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const intake=fs.readFileSync('dist/web/photobridge-r1137-lab-local-intake.js','utf8');
const header=fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.js','utf8');
const css=fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.css','utf8');
const html=fs.readFileSync('dist/web/index.html','utf8');
test('walk-in mount finds the real secondary header (sibling rather than descendant of main)',()=>{
 assert.match(intake,/PB1186 native stable header target/);
 assert.ok(intake.includes("desktopQueue?document.querySelector('.labRoleWorkspace .pb1148SecondaryHeader.pb1174QueueNav'):null"));
 assert.ok(!intake.includes("desktopQueue?host.querySelector('.pb1148SecondaryHeader.pb1174QueueNav'):null"));
});
test('R1184 native action has a stable label and does not endlessly retrigger MutationObserver',()=>{
 assert.ok(intake.includes('if(old.textContent!==text)old.textContent=text'));
 assert.ok(!intake.includes(';old.textContent=text;old.onclick='));
 assert.ok(intake.includes("old.onclick=()=>open(albumTab?'album':'print')"));
 assert.ok(intake.includes("button.onclick=()=>open(albumTab?'album':'print')"));
 assert.ok(intake.includes('new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true})'));
});
test('header tab redraw preserves native action and never leaves the old dead proxy',()=>{
 assert.match(header,/PB1186 preserve intake on tab rebuild/);
 assert.ok(header.includes("const nativeIntake=row.querySelector(':scope>#pb1137LocalIntakeButton')"));
 assert.match(header,/row\.replaceChildren\(\);\s*if\(nativeIntake\)row\.prepend\(nativeIntake\)/);
 assert.ok(header.includes("if(isQueue&&intake&&intake.parentElement!==row)row.prepend(intake)"));
 assert.ok(header.includes("if(!isQueue&&intake&&intake.parentElement===row)intake.remove()"));
 assert.ok(header.includes("row.querySelector(':scope>.pb1174QueueLaunch')?.remove()"));
});
test('single native action stays visible on print and album queue while submission keeps primary machine restrictions',()=>{
 assert.ok(intake.includes("const albumTab=/^\\/lab\\/album(?:s|[-/]|$)/.test(location.pathname)"));
 assert.ok(intake.includes("const desktopQueue=window.matchMedia("));
 assert.ok(intake.includes('if(!primary.registered||!primary.isThisDevice)throw Error('));
 assert.ok(header.includes("const intake=document.getElementById('pb1137LocalIntakeButton')"));
 assert.match(css,/\.pb1148SecondaryHeader\.pb1174QueueNav > #pb1137LocalIntakeButton\.pb1137Launch\s*\{\s*display:inline-flex!important/);
});
test('script cache busters force both corrected owners to reload after deploy',()=>{
 assert.match(html,/photobridge-r1137-lab-local-intake\.js\?v=r1186/);
 assert.match(html,/photobridge-r1147-lab-admin-header\.js\?v=r1186/);
 assert.ok(!html.includes('photobridge-r1137-lab-local-intake.js?v=r1184'));
 assert.ok(!html.includes('photobridge-r1147-lab-admin-header.js?v=r1175'));
});
