import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {patchCrop,MARK}=require('./r1599-crop-patch.cjs');
const root='dist/web/',htmlFile=root+'index.html',uiFile=root+'assets/index-UIRefine-v655-r84.js';
const source=fs.readFileSync(uiFile,'utf8');
if(!source.includes('/* R1575 fast stages */'))throw Error('R1599 current verified upload workflow missing');
let updated=patchCrop(source);
if(!updated.includes(MARK)||updated===source)throw Error('R1599 crop patch not applied');
updated+='\n'+fs.readFileSync('scripts/r1599-crop-send-confirm.js','utf8');
fs.writeFileSync(uiFile,updated);
execFileSync(process.execPath,['--check',uiFile],{stdio:'inherit'});
const labMobile='photobridge-r1482-lab-mobile.js';
fs.copyFileSync('scripts/r1482-lab-mobile.js',root+labMobile);
execFileSync(process.execPath,['--check',root+labMobile],{stdio:'inherit'});
const jsName='photobridge-r1598-photographer-mobile-invoice-dock.js';
const cssName='photobridge-r1598-photographer-mobile-invoice-dock.css';
fs.copyFileSync('scripts/r1598-photographer-mobile-invoice-dock.js',root+jsName);
fs.copyFileSync('scripts/r1598-photographer-mobile-invoice-dock.css',root+cssName);
execFileSync(process.execPath,['--check',root+jsName],{stdio:'inherit'});
const cropCss='photobridge-r1599-crop-send-confirm.css';
fs.copyFileSync('scripts/r1599-crop-send-confirm.css',root+cropCss);
let html=fs.readFileSync(htmlFile,'utf8');
if(!html.includes('pb1493MobileSessionResume'))throw Error('R1599 PWA role boot missing');
const rolePrepaint='<style id="pb1599RoutePrepaintStyle">@media(max-width:820px){'+
 'html.pb1599PhotographerRoute body nav.labMobileUtilityRail,'+
 'html.pb1599PhotographerRoute body nav.pb1482LabPhoneDock,'+
 'html.pb1599RentalRoute body nav.labMobileUtilityRail,'+
 'html.pb1599RentalRoute body nav.pb1482LabPhoneDock,'+
 'html.pb1599LabRoute body nav.photographerMobileUtilityRail:not(.labMobileUtilityRail){display:none!important}}'+
 '</style><script id="pb1599RoutePrepaint">(function(){var h=document.documentElement,p=location.pathname;'+
 'h.classList.toggle("pb1599LabRoute",p==="/lab"||p.indexOf("/lab/")===0);'+
 'h.classList.toggle("pb1599PhotographerRoute",p==="/photographer"||p.indexOf("/photographer/")===0);'+
 'h.classList.toggle("pb1599RentalRoute",p==="/rental"||p.indexOf("/rental/")===0||p.indexOf("/equipment-rental/")===0);'+
 '})()</script>';
if(!html.includes('id="pb1599RoutePrepaint"'))
 html=html.replace('<head>','<head>\n'+rolePrepaint+'\n');
html=html.replace(/photobridge-r1598-photographer-mobile-invoice-dock\.(js|css)\?v=r1598/g,
 'photobridge-r1598-photographer-mobile-invoice-dock.$1?v=r1599');
html=html.replace(/photobridge-r1482-lab-mobile\.js\?v=r1482/g,
 'photobridge-r1482-lab-mobile.js?v=r1599');
if(!html.includes('/'+cropCss+'?'))html=html.replace('</head>',
 '<link rel="stylesheet" href="/'+cropCss+'?v=r1599">\n</head>');
html=html.replace(/(index-UIRefine-v655-r84\.js\?[^"']*)/g,
 url=>url.includes('&mobileCrop=r1599')?url:url+'&mobileCrop=r1599');
fs.writeFileSync(htmlFile,html);
console.log('[R1599] mobile route-bound docks and crop confirmation; Windows Lab remains frozen.');
