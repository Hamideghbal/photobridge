'use strict';
const fs=require('node:fs'),path=require('node:path');
const once=(s,a,b)=>{if(s.split(a).length!==2)throw Error('R1628 native anchor: '+a.slice(0,90));return s.replace(a,b)};
function integrate(root,source=path.resolve(__dirname,'../apps/lab-desktop')){
 for(const name of ['unified-updates.cjs','ui-update-dialog.cjs'])fs.copyFileSync(path.join(source,name),path.join(root,name));
 let file=path.join(root,'main.cjs'),main=fs.readFileSync(file,'utf8');if(!main.includes('/* R1628 unified updates */')){
 main=once(main,"{label:'به‌روزرسانی برنامه',click:()=>void programUpdates?.check(true)}","{label:'به‌روزرسانی برنامه',click:()=>void manualUpdates.check()}");
 const a=main.indexOf("{label:'بررسی و اعمال به‌روزرسانی ظاهر',click:"),b=main.indexOf("},{type:'separator'}",a);if(a<0||b<a)throw Error('R1628 old UI menu action missing');main=main.slice(0,a)+main.slice(b+2);main=main.replace("showSettings()},,{type:","showSettings()},{type:");
 const marker='await win.loadURL(\'data:text/html;charset=utf-8,\'';const start=main.indexOf(marker);if(start<0)throw Error('R1628 startup anchor');
 const init=`/* R1628 unified updates */const updateDialog=new (require('./ui-update-dialog.cjs').UiUpdateDialog)({BrowserWindow,getWindow:()=>win,dialog});const manualUpdates=require('./unified-updates.cjs').createUnifiedUpdates({checkProgram:()=>programUpdates?programUpdates.check(true,true):Promise.resolve({state:'busy'}),checkUi:()=>updateUi(true),uiBusy:()=>uiChecking,pending:()=>Boolean(store.get('uiRoot')&&store.get('uiRoot')!==activeUiRoot),uiError:()=>store.get('updateError'),canApply:async()=>{if(nativeStorage.writers.size||nativeStorage.selection||sync.flight)return false;return await win.webContents.executeJavaScript('!document.querySelector(\'dialog[open],form[data-busy="1"]\')');},apply:()=>applyUi(false),show:async()=>{win.show();win.restore();win.focus()},prompt:state=>updateDialog.ask(state)});app.on('before-quit',()=>updateDialog.destroy());\n `;
 // JSON quoting keeps the renderer selector literal and avoids JavaScript nested-quote errors.
 const safeInit=init.replace("executeJavaScript('!document.querySelector('dialog[open],form[data-busy=\"1\"]')')",'executeJavaScript('+JSON.stringify('!document.querySelector(\'dialog[open],form[data-busy="1"]\')')+')');
 main=main.slice(0,start)+safeInit+main.slice(start);fs.writeFileSync(file,main);
 }
 file=path.join(root,'app-update-main.cjs');let updater=fs.readFileSync(file,'utf8');if(!updater.includes('quietCurrent')){
 updater=once(updater,'async function check(manual=false){','async function check(manual=false,quietCurrent=false){');
 updater=once(updater,"if(!app.isPackaged||platform!=='win32'||checking)return;checking=true;","if(!app.isPackaged||platform!=='win32')return{state:'unsupported'};if(checking)return{state:'busy'};checking=true;");
 updater=updater.replaceAll('}else if(manual){','}else if(manual&&!quietCurrent){');
 updater=once(updater,'  }catch(error){\n   getWindow()', '   return result;\n  }catch(error){\n   getWindow()');
 updater=once(updater,"progress.close();store.set('nativeUpdateError',null);return;","progress.close();store.set('nativeUpdateError',null);return{state:'cancelled'};");
 updater=once(updater,'  }finally{checking=false;}','   return{state:\'error\'};\n  }finally{checking=false;}');fs.writeFileSync(file,updater);
 }
}
module.exports={integrate};if(require.main===module)integrate(path.resolve(process.argv[2]));
