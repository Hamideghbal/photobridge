/* R1668: close inline Settings during window capture before the existing
 * desktop navigation captures and optionally returns before navigate().
 * Never alter the original print/album/archive button handlers.
 */
// Anchor to the actual main-header click listener, not the desktop CSS marker.
// Earlier build steps can legitimately add the desktop marker more than once.
const headerClickAnchor="window.addEventListener('click',e=>{const b=e.target?.closest?.('[data-pb1126-kind]')";
const settingsOpenAnchor=/(\s)function open\(key\)\s*\{/g;
export function withSettingsCapture(nav) {
 const marker='/* PB1668 close settings before desktop header click */';
 if(nav.includes(marker))return nav;
 const count=nav.split(headerClickAnchor).length-1;
 if(count!==1)throw Error('R1662 header click anchor count '+count);
 // Register first at the same window-capture target, before R1126 stops the
 // navigation click. Keep R1126's original handler text unchanged.
 return nav.replace(headerClickAnchor,`${marker}
 window.addEventListener('click',event=>{
  const button=event.target?.closest?.('#pb1126DesktopHeader button');
  if(button&&!button.closest('.pb1635SettingsNav'))
   window.pb1635CloseInlineSettings?.();
 },true);
 ${headerClickAnchor}`);
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
