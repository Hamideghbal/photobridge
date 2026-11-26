// Web/PWA only: keep the real settings tab and export logic, not an external window.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {patchInlineBackup,patchInvoiceAll}=require('./r2059-inline-backup.cjs');
const root='dist/web',asset=root+'/assets/index-UIRefine-v655-r84.js',htmlPath=root+'/index.html';
let js=patchInvoiceAll(patchInlineBackup(fs.readFileSync(asset,'utf8'),false));
fs.writeFileSync(asset,js);
let html=fs.readFileSync(htmlPath,'utf8');
const rx=/index-UIRefine-v655-r84\.js\?[^"'\s>]*/g;
if([...html.matchAll(rx)].length!==1)throw Error('R2059 module reference');
html=html.replace(rx,url=>url.includes('&inlineBackup=r2059')?url:url+'&inlineBackup=r2059');
const style='<style id="pb2059InlineBackupStyle">html body #root#root .labRoleWorkspace button[data-pb162-invoice-all][aria-pressed="true"]{background:#315efb!important;background-color:#315efb!important;color:#fff!important;border-color:#315efb!important}html body #root#root .labRoleWorkspace .pb162BackupFrame{box-sizing:border-box;width:100%;max-width:100%;border:0!important}</style>';
if(!html.includes('id="pb2059InlineBackupStyle"'))html=html.replace('</head>',style+'</head>');
fs.writeFileSync(htmlPath,html);
execFileSync(process.execPath,['--check',asset],{stdio:'inherit'});
console.log('[R2059] backup stays inside Lab settings, all invoice filter has explicit selected style');
