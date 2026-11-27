'use strict';
const fs=require('node:fs'),path=require('node:path');
const name='photobridge-r1137-lab-local-intake.js';
function compileIntake(source){
 const patched=require('./native-performance-165.cjs').patchNativeIntake(require('./offline-ui.cjs').patchOfflineIntake(source));
 new Function(patched);
 for(const marker of ['PB168 native walk-in mount','desktopLocalFiles','/api/lab/delegated-orders','ثبت سفارش آلبوم حضوری','ثبت سفارش عکس حضوری'])if(!patched.includes(marker))throw Error('PB168 intake missing '+marker);
 return patched;
}
function compileRoot(root){return compileIntake(fs.readFileSync(path.join(root,name),'utf8'));}
module.exports={compileIntake,compileRoot,name};
