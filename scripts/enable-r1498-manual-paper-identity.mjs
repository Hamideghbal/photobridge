import fs from 'node:fs';
import {execFileSync} from 'node:child_process';

const file='dist/web/photobridge-r1137-lab-local-intake.js';
let source=fs.readFileSync(file,'utf8');
if(!source.includes('function sameIntakeCopyTarget(')){
 const anchor=' async function appendFiles(group,files,size,paper){';
 const old='const item=group.items.find(x=>x.hash===hash)||additions.find(x=>x.hash===hash);';
 if(source.split(anchor).length!==2)throw Error('R1498 appendFiles anchor changed');
 if(source.split(old).length!==2)throw Error('R1498 duplicate photo anchor changed');
 source=source.replace(anchor," function sameIntakeCopyTarget(a,b,isAlbum,fallbackPaper=''){return Boolean(a&&b&&a.hash===b.hash&&(isAlbum||String(a.paper||fallbackPaper)===String(b.paper||fallbackPaper)));}\n"+anchor);
 source=source.replace(old,'const item=group.items.find(x=>sameIntakeCopyTarget(x,{hash,paper},albumMode,group.paper))||additions.find(x=>sameIntakeCopyTarget(x.existing||x,{hash,paper},albumMode,group.paper));');
 source+='\n/* PB1498 paper identity */\n';
 fs.writeFileSync(file,source);
}
execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
const htmlFile='dist/web/index.html';
let html=fs.readFileSync(htmlFile,'utf8');
html=html.replace(/(photobridge-r1137-lab-local-intake\.js\?[^"'\s]*)/g,url=>url.includes('paperIdentity=r1498')?url:url+'&paperIdentity=r1498');
fs.writeFileSync(htmlFile,html);
