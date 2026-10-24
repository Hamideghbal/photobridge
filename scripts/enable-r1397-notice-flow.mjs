import fs from 'node:fs';
const file='dist/web/assets/index-UIRefine-v655-r84.js';let s=fs.readFileSync(file,'utf8');
if(!s.includes('/* PB1397 notice in content flow */')){
 const a=s.indexOf('B&&e.jsxs("div",{className:"collaborationGlobalAlert labCollaborationAlert '),b=s.indexOf('e.jsxs("section",{ref:r,className:"workspaceBar labSingleHeader',a);
 if(a<0||b<a)throw Error('R1397 changed collaboration notice anchor');
 const notice=s.slice(a,b);if(!notice.endsWith(','))throw Error('R1397 invalid notice boundary');
 s=s.slice(0,a)+s.slice(b);
 const anchor='className:"rolePageScrollArea labRolePageScrollArea",children:[';
 const pos=s.indexOf(anchor,a);if(pos<0||pos>a+30000)throw Error('R1397 missing lab content viewport');
 s=s.slice(0,pos+anchor.length)+notice+s.slice(pos+anchor.length);
 const start=s.indexOf('y=async(I,T)=>',s.indexOf('function Jj(')),end=s.indexOf(';return e.jsxs',start);
 if(start<0||end<start||!s.slice(start,end).includes('let refreshFailed=false'))throw Error('R1397 missing reviewed response handler');
 let handler=s.slice(start,end);if(handler.split('alert(').length!==3)throw Error('R1397 changed review feedback');
 handler=handler.replace('alert(messages[C]','await pb1397ReviewDialog(messages[C]').replace('alert(result+','await pb1397ReviewDialog(result+');
 s=s.slice(0,start)+handler+s.slice(end);
 s+='\n/* PB1397 notice in content flow */\n'+fs.readFileSync('scripts/r1397-review-dialog.js','utf8');
 fs.writeFileSync(file,s);
}
const htmlFile='dist/web/index.html';let html=fs.readFileSync(htmlFile,'utf8');
html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&noticeFlow=')?url:url+'&noticeFlow=r1397');
html=html.replace(/(photobridge-r1363-lab-queue\.(?:js|css)\?[^"']*)/g,url=>url.includes('&noticeFlow=')?url:url+'&noticeFlow=r1397');
if(!html.includes('/photobridge-r1397-review-dialog.css'))html=html.replace('</head>','<link rel="stylesheet" href="/photobridge-r1397-review-dialog.css?v=r1397">\n</head>');
fs.writeFileSync(htmlFile,html);
