// R2091: run after R2080, before R1897 refreshes compression and native hashes.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {patchServer,patchUi} from './r2091-archive-reprint-patch.mjs';
const read=p=>fs.readFileSync(p,'utf8');
const module='dist/api/archive-print-selection.js',server='dist/api/server.js';
fs.writeFileSync(module,read('scripts/r2091-archive-selection.js.txt'));
fs.writeFileSync(server,patchServer(read(server)));
const helper=read('scripts/r2091-archive-reprint-ui.js.txt'),css=read('scripts/r2091-archive-reprint.css');
for(const root of ['dist/web','dist/web/lab-desktop-ui']){
 const file=root+'/assets/index-UIRefine-v655-r84.js',index=root+'/index.html';
 fs.writeFileSync(file,patchUi(read(file),helper));
 let html=read(index);
 if(!html.includes('id="pb2091ArchiveStyle"'))html=html.replace('</head>','<style id="pb2091ArchiveStyle">'+css+'</style></head>');
 const url=/index-UIRefine-v655-r84\.js\?[^"'\s>]*/g;
 if([...html.matchAll(url)].length!==1)throw Error('R2091 archive UI URL anchor '+root);
 html=html.replace(url,u=>{const clean=u.replace(/&archiveSelection=r\d+/g,'');const anchor='&archiveReprint=';if(!clean.includes(anchor))throw Error('R2091 missing archive cache key');return clean.replace(anchor,'&archiveSelection=r2091'+anchor)});
 fs.writeFileSync(index,html);
 execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}
for(const file of [module,server])execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
console.log('[R2091] selected archive files, edited print specs and invoice outcome without reload; web + Lab Windows UI');
