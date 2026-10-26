import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const file='dist/web/photobridge-r1137-lab-local-intake.js';
let src=fs.readFileSync(file,'utf8');
if(!src.includes('/* PB1469 intake native errors */')){
 const anchor="const close=node('button','بستن');close.type='button';";
 if(src.split(anchor).length!==2)throw Error('R1469 close anchor changed');
 src=src.replace(anchor,"const close=node('button','×','pb1469IntakeClose');close.type='button';close.setAttribute('aria-label','بستن پنجره');close.title='بستن پنجره';");
 fs.writeFileSync(file,src+'\n/* PB1469 intake native errors */\n');
}
fs.copyFileSync('scripts/r1466-intake-move.js','dist/web/photobridge-r1466-intake-move.js');
const css=`<style>/* PB1469 intake controls */
@media(min-width:900px){.pb1137Intake .pb1137Settings.pb1139EntryRow{grid-template-columns:minmax(105px,1fr) minmax(83px,.8fr) minmax(216px,1.5fr) minmax(85px,.8fr)!important}}
.pb1137Intake .pb1468FileActions{flex-wrap:wrap!important;overflow:visible!important;gap:8px!important}
.pb1137Intake .pb1468FileActions>button{flex:1 0 auto!important;min-width:100px!important;width:auto!important;padding:8px 12px!important;font-size:13px!important;line-height:1.5!important;min-height:38px!important;height:auto!important;overflow:visible!important;white-space:nowrap!important;text-overflow:clip!important}
.pb1137Intake>header{position:relative!important;min-height:52px!important;padding:8px 0 14px!important;display:flex!important;align-items:center!important;justify-content:space-between!important;gap:16px!important}
.pb1137Intake>header>h2{margin:0!important;padding:0!important}
.pb1137Intake>header>.pb1469IntakeClose{position:static!important;flex:0 0 36px!important;width:36px!important;min-width:36px!important;height:36px!important;min-height:36px!important;padding:0!important;font-size:25px!important;line-height:1!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;border-radius:10px!important}
</style>`;
for(const path of ['dist/web/index.html','dist/api/equipment-rental-book.html']){
 let html=fs.readFileSync(path,'utf8');html=html.replace(/<style>\/\* PB1469 intake controls \*\/[\s\S]*?<\/style>/g,'').replace('</head>',css+'</head>');
 html=html.replace(/((?:photobridge-r1137-lab-local-intake|photobridge-r1466-intake-move)\.js\?[^"'\s]*)/g,url=>url.includes('nativeIntake=r1469')?url:url+'&nativeIntake=r1469');fs.writeFileSync(path,html);
}
for(const path of [file,'dist/web/photobridge-r1466-intake-move.js'])execFileSync(process.execPath,['--check',path],{stdio:'inherit'});
