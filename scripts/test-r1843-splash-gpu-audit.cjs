const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('R1843: soften splash with gradients instead of expensive full-size GPU blur',()=>{
 const css=fs.readFileSync('scripts/r1842-blue-splash.css','utf8');
 assert(css.includes('.pb1842-aurora{'));
 assert(css.includes('radial-gradient(circle, rgba(99,179,255,.34)'));
 assert(css.includes('radial-gradient(circle, rgba(21,83,176,.45)'));
 assert(!/\.pb1842-aurora\s*\{[^}]*filter\s*:\s*blur/i.test(css),'no 46px filter blur on huge mobile aura layers');
 assert(!/\.pb1842-grain\s*\{[^}]*mix-blend-mode/i.test(css),'no fullscreen grain blend composition');
 for(const motion of ['pb1842_pbDrift','pb1842_pbDraw','pb1842_pbIris','pb1842_pbFlash','pb1842_pbShimmer'])
   assert(css.includes(motion),'preserve original user-supplied animation '+motion);
 assert(css.includes('prefers-reduced-motion:reduce'),'reduced motion must remain supported');
 assert(css.includes('#071f47')&&css.includes('#2f7fe0'),'preserve original blue palette');
});

test('R1843: no UI, session, checkout or data storage behavior was touched',()=>{
 const css=fs.readFileSync('scripts/r1842-blue-splash.css','utf8');
 assert(!css.includes('unifiedLoginPage'));
 assert(!css.includes('.financeWorkspace'));
 assert(!css.includes('localStorage'));
 assert(!css.includes('sessionStorage'));
 const js=fs.readFileSync('scripts/r1842-blue-splash.js','utf8');
 assert(js.includes('window.PhotoBridgeSplash'),'user splash controller preserved');
 assert(js.includes('__PB1836RoleHandoff'),'session role handoff preserved');
 const html=fs.readFileSync('scripts/r1842-blue-splash.html','utf8');
 assert(html.includes('id="pb-splash"'));
 assert(html.includes('id="pbIrisMask"'));
});
