import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

// R1186: stabilize the *existing* registered-device lab walk-in action.
// Keep exactly one native button with its existing guarded open() handler.
function patchOnce(source,before,after,tag){
 const count=source.split(before).length-1;
 if(count!==1)throw Error('R1186 unsafe '+tag+' anchor '+count+': '+before.slice(0,125));
 return source.replace(before,after);
}
const intakePath='dist/web/photobridge-r1137-lab-local-intake.js';
let intake=fs.readFileSync(intakePath,'utf8');
if(!intake.includes('PB1186 native stable header target')){
 // The secondary header is a sibling of main, not a descendant:
 // host.querySelector always returns null and fights the header's DOM mover.
 intake=patchOnce(
  intake,
  "const header=desktopQueue?host.querySelector('.pb1148SecondaryHeader.pb1174QueueNav'):null;",
  "/* PB1186 native stable header target */const header=desktopQueue?document.querySelector('.labRoleWorkspace .pb1148SecondaryHeader.pb1174QueueNav'):null;",
  'header is sibling of main'
 );
 // r1184 unconditionally called textContent= on *every* MutationObserver pass.
 // That operation replaces button children, triggers another mutation and
 // causes an unbounded header/intake rerender loop.
 intake=patchOnce(
  intake,
  "old.textContent=text;old.onclick=()=>open(albumTab?'album':'print');return;",
  "if(old.textContent!==text)old.textContent=text;old.onclick=()=>open(albumTab?'album':'print');return;",
  'only update label when changed'
 );
 fs.writeFileSync(intakePath,intake);
}
const headerPath='dist/web/photobridge-r1147-lab-admin-header.js';
let header=fs.readFileSync(headerPath,'utf8');
if(!header.includes('PB1186 preserve intake on tab rebuild')){
 // Recreating header tabs previously called replaceChildren(), destroying
 // the real walk-in action. Preserve its DOM node/event handler across rebuild.
 header=patchOnce(
  header,
  "row._source=source;\n  row.replaceChildren();",
  "row._source=source;\n  /* PB1186 preserve intake on tab rebuild */const nativeIntake=row.querySelector(':scope>#pb1137LocalIntakeButton');\n  row.replaceChildren();\n  if(nativeIntake)row.prepend(nativeIntake);",
  'preserve live action across header redraw'
 );
 // Do not leave a print/album action attached to finance/settings headers.
 header=patchOnce(
  header,
  "if(isQueue&&intake&&intake.parentElement!==row)row.prepend(intake);\n row.querySelector(':scope>.pb1174QueueLaunch')?.remove();",
  "if(isQueue&&intake&&intake.parentElement!==row)row.prepend(intake);\n if(!isQueue&&intake&&intake.parentElement===row)intake.remove();\n row.querySelector(':scope>.pb1174QueueLaunch')?.remove();",
  'no lab walk-in action on unrelated tabs'
 );
 fs.writeFileSync(headerPath,header);
}
const indexPath='dist/web/index.html';
let html=fs.readFileSync(indexPath,'utf8');
for(const name of ['photobridge-r1137-lab-local-intake.js','photobridge-r1147-lab-admin-header.js']){
 const escaped=name.replaceAll('.','\\.');
 const rx=new RegExp('('+escaped+'\\?v=)[^"\\s]+','g');
 html=html.replace(rx,'$1r1186');
}
fs.writeFileSync(indexPath,html);
for(const file of [intakePath,headerPath])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
execFileSync(process.execPath,['--test','scripts/test-r1186-lab-walkin-button.cjs'],{stdio:'inherit'});
