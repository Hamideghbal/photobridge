import fs from 'node:fs';
import path from 'node:path';
// A hidden preloaded iframe may initially report a narrow viewport. Establish
// embedded ownership before the desktop-only parent-header width check.
const script='dist/web/photobridge-r1126-desktop-navigation.js';
let nav=fs.readFileSync(script,'utf8');
if(!nav.includes('/* PB1309 embedded before viewport */')){
 const gate=" if(!matchMedia('(min-width:821px)').matches)return;";
 const end="document.documentElement.classList.add('pb1126FrameStoreHost');return;}";
 if(nav.split(gate).length!==2||nav.split(end).length!==2)throw Error('R1309 embedded bootstrap anchors missing');
 nav=nav.replace(gate,'').replace(end,end+"\n /* PB1309 embedded before viewport */\n"+gate);
 fs.writeFileSync(script,nav);
}
const file='dist/web/photobridge-r1126-desktop-navigation.css';
let css=fs.readFileSync(file,'utf8');
if(!css.includes('/* PB1309 single desktop header */')){
 css+=`\n/* PB1309 single desktop header */
@media(min-width:821px){
 /* Native headers remain in the DOM as action sources for the canonical header.
    Do not depend on their wrapper, tag name, or legacy refinement classes. */
 html:is(.pb1126Desktop,.pb1126Embedded) body :is(#photographerRoleHeaderV710,#photographerStoreRoleHeader,#photographerStoreIdentityBar,#pbF37PhotographerHeader,#pbF37Subheader,#pbF37MenuBtn,#pbF37MenuPanel,#storeSectionNavV673,#pbR1123StoreDesktopNav){display:none!important;visibility:hidden!important;pointer-events:none!important}
 html body section.pb1126ContentPanel.pb1126ContentPanel[hidden],
 html body .pb1126ContentPanel .pb1126Loading[hidden]{display:none!important;visibility:hidden!important;pointer-events:none!important}
 html body #pb1126ChromeHost #pb1126DesktopHeader>.pb1126Secondary[hidden],
 html.pb1127Choosing body #pb1126ChromeHost #pb1126DesktopHeader>.pb1126Secondary{display:none!important;visibility:hidden!important;pointer-events:none!important}
}
`;
 fs.writeFileSync(file,css);
}
function refresh(dir){if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())refresh(file);else if(entry.name.endsWith('.html')){const html=fs.readFileSync(file,'utf8');const next=html.replace(/(photobridge-r1126-desktop-navigation\.(?:css|js))([^"'<>\s]*)/g,(_,name,query)=>{const clean=query.replace(/([?&])singleHeader=[^&]*/g,'$1').replace(/[?&]$/,'');return name+clean+(clean.includes('?')?'&':'?')+'singleHeader=r1309';});if(next!==html)fs.writeFileSync(file,next);}}}
refresh('dist/web');refresh('dist/api');
console.log('[PhotoBridge R1309] canonical desktop header only; hidden panel and chooser row guards.');
