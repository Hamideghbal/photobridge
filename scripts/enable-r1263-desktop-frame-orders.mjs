import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('apps/store-desktop'),hostFile=path.join(root,'host.cjs');
if(!fs.existsSync(hostFile))throw Error('Restore native Windows source archive first');
let source=fs.readFileSync(hostFile,'utf8');
const anchor="const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');";
const boot="const {Store}=require('./store.cjs');require('./offline-frame-orders.cjs').install(Store);";
if(!source.includes(boot)){if(!source.includes(anchor))throw Error('Unsupported archived Windows host source');source=source.replace(anchor,anchor+'\n'+boot)}
const block="if(url.pathname==='/desktop/status'){";
const extra="if(url.pathname==='/desktop/frame-manual-status'&&req.method==='GET'){const snap=store.snapshot(),shop=snap?.entities?.shop?.[0]||snap?.meta?.shop,frame=['frame','chassis','frame_chassis'].includes(String(shop?.business_category||''));return json(res,200,{supported:true,signedIn:!!store.get('auth'),shopId:store.get('shopId'),enabled:frame&&shop?.sale_enabled!==false});}\n  ";
if(!source.includes("url.pathname==='/desktop/frame-manual-status'")){if(!source.includes(block))throw Error('Native status route not found');source=source.replace(block,extra+block)}
fs.writeFileSync(hostFile,source);
console.log('Native store: offline frame order support enabled in restored sources');
