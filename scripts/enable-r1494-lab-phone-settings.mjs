import fs from 'node:fs';
const uiFile='dist/web/assets/index-UIRefine-v655-r84.js',root='dist/web/';let ui=fs.readFileSync(uiFile,'utf8');
if(!ui.includes('/* PB1494 lab phone settings */')){
 const start=ui.indexOf('function Nj('),end=ui.indexOf('function ',start+20);if(start<0||end<start)throw Error('R1494 settings component anchor');
 let part=ui.slice(start,end);
 const once=(old,next)=>{if(part.split(old).length!==2)throw Error('R1494 missing/ambiguous settings picker');part=part.replace(old,next)};
 once('e.jsx(wn,{value:C,options:F,onChange:ae=>L(ae)})',`e.jsx(wn,{value:C,options:F,menuClassName:pb1487PhonePicker()?'pb1494LabSettingsMenu':'',onChange:ae=>L(ae)})`);
 once('e.jsx(wn,{value:g,options:M,onChange:ae=>B(ae)})',`e.jsx(wn,{value:g,options:M,menuClassName:pb1487PhonePicker()?'pb1494LabSettingsMenu':'',onChange:ae=>B(ae)})`);
 ui=ui.slice(0,start)+part+ui.slice(end)+'\n/* PB1494 lab phone settings */\n';fs.writeFileSync(uiFile,ui);
}
const cssFile=root+'photobridge-r1494-lab-phone-settings.css';fs.writeFileSync(cssFile,fs.readFileSync('scripts/r1494-lab-phone-settings.css','utf8'));
const index=root+'index.html';let html=fs.readFileSync(index,'utf8'),tag='<link rel="stylesheet" href="/photobridge-r1494-lab-phone-settings.css?v=r1494">';
if(!html.includes(tag)){
 if(!html.includes('pb1493MobileSessionResume'))throw Error('R1494 expected current mobile entry stage missing');
 html=html.replace('</head>',tag+'\n</head>');fs.writeFileSync(index,html);
}
console.log('[R1494] Sticky photographer subsections, tidy member cards and scrollable finance tariff menus enabled on lab phones.');
