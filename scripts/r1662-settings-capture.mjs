/* R1668: close inline Settings during window capture before the existing
 * desktop navigation captures and optionally returns before navigate().
 * Never alter the original print/album/archive button handlers.
 */
const desktopAnchor=/document\.documentElement\.classList\.add\((['"])pb1126Desktop\1\)\s*;/g;
const settingsOpenAnchor=/(\s)function open\(key\)\s*\{/g;
export function withSettingsCapture(nav) {
 const marker='/* PB1668 close settings before desktop header click */';
 if(nav.includes(marker))return nav;
 const matches=[...nav.matchAll(desktopAnchor)];
 if(matches.length!==1)throw Error('R1662 desktop class anchor count '+matches.length);
 return nav.replace(desktopAnchor,statement=>statement+`
  ${marker}
  window.addEventListener('click',event=>{
   const button=event.target?.closest?.('#pb1126DesktopHeader button');
   if(button&&!button.closest('.pb1635SettingsNav'))
    window.pb1635CloseInlineSettings?.();
  },true);`);
}
export function withSettingsCloser(settings) {
 if(settings.includes('window.pb1635CloseInlineSettings=close;'))return settings;
 if(!settings.includes('function close(){')||
    !settings.includes("panel?.remove();panel=null;selected='';")||
    !settings.includes("document.documentElement.classList.remove('pb1635SettingsOpen')"))
  throw Error('R1662 settings cleanup contract unavailable');
 const matches=[...settings.matchAll(settingsOpenAnchor)];
 if(matches.length!==1)throw Error('R1662 settings open anchor count '+matches.length);
 return settings.replace(settingsOpenAnchor,(_anchor,spacing)=>
  spacing+'/* PB1668 expose existing full settings cleanup */'+spacing+
  'window.pb1635CloseInlineSettings=close;'+spacing+'function open(key){');
}
