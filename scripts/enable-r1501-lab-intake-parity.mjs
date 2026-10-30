import fs from 'node:fs';

const cssFile = 'dist/web/photobridge-r1137-lab-local-intake.css';
const jsFile = 'dist/web/photobridge-r1137-lab-local-intake.js';
const indexFile = 'dist/web/index.html';
const marker = '/* PB1501 manual-order parity: photo action, paper and quantity */';

let css = fs.readFileSync(cssFile, 'utf8');
if (!css.includes(marker)) {
  css += `\n${marker}
.pb1137Intake .pb1139GroupPhotos{max-height:min(280px,40dvh)!important;overflow-x:auto!important;overflow-y:auto!important;align-items:flex-start!important;scrollbar-width:thin!important}
.pb1137Intake .pb1139GroupPhotos figure{display:flex!important;flex:0 0 148px!important;width:148px!important;min-width:148px!important;flex-direction:column!important;align-items:stretch!important;gap:3px!important;overflow:visible!important}
.pb1137Intake .pb1139GroupPhotos .pb1181IntakeFrame{position:relative!important;display:grid!important;place-items:center!important;width:100%!important;height:94px!important;min-height:94px!important;overflow:hidden!important;border-radius:9px!important;background:#f2f4f7!important}
.pb1137Intake .pb1139GroupPhotos .pb1181IntakeFrame>img{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:contain!important}
.pb1137Intake .pb1139GroupPhotos figcaption{display:block!important;width:100%!important;min-height:18px!important;margin:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;text-align:center!important;font-size:10px!important;line-height:1.5!important}
.pb1137Intake .pb1139GroupPhotos .pb1501ActionBadge{display:inline-flex!important;align-items:center!important;justify-content:center!important;align-self:center!important;min-height:21px!important;padding:1px 9px!important;border-radius:999px!important;font:800 10px/1.4 Vazirmatn,Tahoma,sans-serif!important;white-space:nowrap!important}
.pb1137Intake .pb1139GroupPhotos .pb1501ActionBadge[data-action="copy"]{color:#1458a5!important;background:#eaf2ff!important;border:1px solid #c7dcff!important}
.pb1137Intake .pb1139GroupPhotos .pb1501ActionBadge[data-action="move"]{color:#087443!important;background:#e9f8ef!important;border:1px solid #b8e7c9!important}
.pb1137Intake .pb1139GroupPhotos .pb1501ActionBadge[data-action="both"]{color:#76500a!important;background:#fff6df!important;border:1px solid #f0d78f!important}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions{display:flex!important;flex-direction:column!important;align-items:stretch!important;gap:3px!important;width:100%!important;min-height:0!important;height:auto!important;overflow:visible!important}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1180IntakePaper{display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;min-height:30px!important;height:30px!important;padding:3px 5px!important;font:700 10px/1.4 Vazirmatn,Tahoma,sans-serif!important;white-space:nowrap!important;text-overflow:clip!important}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1181ChassisToggle{display:flex!important;align-items:center!important;justify-content:flex-start!important;gap:4px!important;min-height:20px!important;margin:0!important;font:600 10px/1.4 Vazirmatn,Tahoma,sans-serif!important}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1181ChassisToggle input{width:15px!important;height:15px!important;min-height:15px!important;margin:0!important}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity{display:flex!important;visibility:visible!important;opacity:1!important;position:static!important;align-items:center!important;justify-content:center!important;gap:4px!important;width:100%!important;min-height:30px!important;height:30px!important;margin:0!important;overflow:visible!important}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity>span{display:inline!important;font:700 10px/1.4 Vazirmatn,Tahoma,sans-serif!important;white-space:nowrap!important}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity input{width:40px!important;min-width:40px!important;height:28px!important;min-height:28px!important;padding:2px!important;text-align:center!important;font-size:12px!important}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity button{width:25px!important;min-width:25px!important;height:28px!important;min-height:28px!important;flex:0 0 25px!important;padding:0!important;font-size:14px!important}
`;
  fs.writeFileSync(cssFile, css);
}

let js = fs.readFileSync(jsFile, 'utf8');
if (!js.includes('PB1501 per-photo action labels')) {
  const replacements = [
    ["let entries=[],groups=[],pendingFiles=[],order=null,submitting=false,locked=false,startedAt=null;", "let entries=[],groups=[],pendingFiles=[],pendingAction='copy',order=null,submitting=false,locked=false,startedAt=null;"],
    ["const files=await window.pb1466IntakeMove.pick(mode);if(files?.length){pendingFiles=files;", "const files=await window.pb1466IntakeMove.pick(mode);if(files?.length){pendingFiles=files;pendingAction=mode;"],
    ["fileInput.onchange=()=>{pendingFiles=[...fileInput.files];choose.textContent=pendingFiles.length?", "fileInput.onchange=()=>{pendingFiles=[...fileInput.files];pendingAction='copy';choose.textContent=pendingFiles.length?"],
    ["async function appendFiles(group,files,size,paper){", "async function appendFiles(group,files,size,paper,sourceAction='copy'){"],
    ["if(item.existing){window.pb1466IntakeMove.track(item.existing,item.sourceFile);item.existing.copies++;continue;}item.id=crypto.randomUUID();", "if(item.existing){window.pb1466IntakeMove.track(item.existing,item.sourceFile);item.existing.copies++;item.existing.sourceActions ||= [];if(!item.existing.sourceActions.includes(item.sourceAction))item.existing.sourceActions.push(item.sourceAction);continue;}item.id=crypto.randomUUID();item.sourceActions ||= [sourceAction];"],
    ["const photo=node('figure');const frame=node('div',null,'pb1181IntakeFrame');const image=node('img');image.src=item.preview;image.alt=item.file.name;frame.append(image);photo.append(frame,node('figcaption',item.file.name));", "const photo=node('figure');const frame=node('div',null,'pb1181IntakeFrame');const image=node('img');image.src=item.preview;image.alt=item.file.name;frame.append(image);const modes=[...new Set(item.sourceActions||['copy'])];const modeLabel=modes.includes('copy')&&modes.includes('move')?'کپی و انتقال':modes.includes('move')?'انتقال':'کپی';const actionBadge=node('span',modeLabel,'pb1501ActionBadge');actionBadge.dataset.action=modes.length>1?'both':modes[0];photo.append(frame,node('figcaption',item.file.name),actionBadge);"],
    ["await appendFiles(group,pendingFiles,defaultSize.value,defaultPaper.value);", "await appendFiles(group,pendingFiles,defaultSize.value,defaultPaper.value,pendingAction);"],
    ["if(!files?.length)return;busy(true);await appendFiles(group,files,group.size,group.paper);", "if(!files?.length)return;busy(true);await appendFiles(group,files,group.size,group.paper,mode);"],
    ["try{await appendFiles(group,input.files,group.size,group.paper);", "try{await appendFiles(group,input.files,group.size,group.paper,'copy');"],
  ];
  const duplicateAnchors = [
    "if(item){if(albumMode)throw Error('این فایل قبلاً به لت‌های آلبوم اضافه شده است.');additions.push({existing:item,sourceFile:file});}else additions.push({file,hash,size,paper,copies:1,chassis:false});",
    "if(item){if(albumMode)throw Error('این فایل قبلاً به لت‌های آلبوم اضافه شده است.');additions.push({existing:item.existing||item,sourceFile:file});}else additions.push({file,hash,size,paper,copies:1,chassis:false});",
    "if(item){additions.push({existing:item,sourceFile:file});}else additions.push({file,hash,size,paper,copies:1,chassis:false});",
    "if(item){additions.push({existing:item.existing||item,sourceFile:file});}else additions.push({file,hash,size,paper,copies:1,chassis:false});",
  ];
  for (const [before, after] of replacements) {
    const count = js.split(before).length - 1;
    if (count !== 1) throw new Error(`R1501 expected one JS anchor, found ${count}: ${before.slice(0,90)}`);
    js = js.replace(before, after);
  }
  const duplicateMatch = duplicateAnchors.filter(before => js.split(before).length - 1 === 1);
  if (duplicateMatch.length !== 1) throw new Error(`R1501 expected one duplicate-photo anchor, found ${duplicateMatch.length}`);
  const chassis = duplicateMatch[0].includes('chassis:false') ? ',chassis:false' : '';
  js = js.replace(duplicateMatch[0], `if(item){additions.push({existing:item.existing||item,sourceFile:file,sourceAction});}else additions.push({file,hash,size,paper,copies:1${chassis},sourceActions:[sourceAction]});`);
  const quantityAnchors = [
    "quantity.append(minus,count,plus);if(!albumMode)photo.append(quantity);",
    "quantity.append(minus,count,plus);photo.append(quantity);",
  ];
  const quantityMatch = quantityAnchors.filter(before => js.split(before).length - 1 === 1);
  if (quantityMatch.length !== 1) throw new Error(`R1501 expected one quantity row anchor, found ${quantityMatch.length}`);
  js = js.replace(quantityMatch[0], quantityMatch[0].replace('quantity.append(minus,count,plus);', "quantity.append(node('span','تعداد'),minus,count,plus);"));
  js += '\n/* PB1501 per-photo action labels */\n';
  fs.writeFileSync(jsFile, js);
}

let html = fs.readFileSync(indexFile, 'utf8');
const cssRef = /href="(\/photobridge-r1137-lab-local-intake\.css)\?v=[^"]+"/g;
const jsRef = /src="(\/photobridge-r1137-lab-local-intake\.js)\?v=[^"]+"/g;
for (const [regex, target, label] of [
  [cssRef, 'r1501-manual-intake-parity', 'stylesheet'],
  [jsRef, 'r1501-manual-intake-parity', 'script'],
]) {
  if (html.includes(`${label === 'stylesheet' ? 'photobridge-r1137-lab-local-intake.css' : 'photobridge-r1137-lab-local-intake.js'}?v=${target}`)) continue;
  const matches = [...html.matchAll(regex)];
  if (matches.length !== 1) throw new Error(`R1501 expected one manual-order ${label} reference; found ${matches.length}`);
  html = html.replace(regex, `${label === 'stylesheet' ? 'href' : 'src'}="$1?v=${target}"`);
}
html = html.replace(/(<script\b[^>]*?)href="(\/photobridge-r1137-lab-local-intake\.js\?v=[^"]+)"/g, '$1src="$2"');
fs.writeFileSync(indexFile, html);
