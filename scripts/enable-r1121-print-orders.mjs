import fs from 'node:fs';
const path='dist/web/assets/index-UIRefine-v655-r84.js';let js=fs.readFileSync(path,'utf8');const old='onDone:()=>{ae(1),Le("orders"),De(_e)}',updated='onDone:()=>{ae(1),Ze("flow"),De(_e)}';if(!js.includes(old)&&!js.includes(updated))throw Error('Print upload completion anchor missing');js=js.replace(old,updated);fs.writeFileSync(path,js);
