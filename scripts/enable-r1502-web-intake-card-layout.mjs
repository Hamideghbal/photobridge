import fs from 'node:fs';

const cssFile = 'dist/web/photobridge-r1137-lab-local-intake.css';
const indexFile = 'dist/web/index.html';
const marker = '/* PB1502 browser-only manual intake card layout */';
let css = fs.readFileSync(cssFile, 'utf8');
if (!css.includes(marker)) {
  css += `\n${marker}
.pb1137Intake .pb1139GroupPhotos{
 display:grid!important;grid-template-columns:repeat(auto-fill,minmax(168px,1fr))!important;
 align-content:start!important;align-items:start!important;justify-items:stretch!important;
 gap:10px!important;max-height:min(330px,46dvh)!important;overflow-x:hidden!important;overflow-y:auto!important;
 padding:8px!important;scrollbar-width:thin!important;overscroll-behavior:contain!important
}
.pb1137Intake .pb1139GroupPhotos figure{
 box-sizing:border-box!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;
 grid-auto-rows:auto!important;align-content:start!important;align-items:stretch!important;justify-items:stretch!important;
 width:100%!important;min-width:0!important;max-width:240px!important;min-height:0!important;flex:none!important;
 gap:6px!important;margin:0!important;padding:8px!important;overflow:visible!important;
 border:1px solid #dce5f1!important;border-radius:13px!important;background:#fff!important;
 box-shadow:0 2px 8px #163b7210!important
}
.pb1137Intake .pb1139GroupPhotos .pb1181IntakeFrame{
 box-sizing:border-box!important;position:relative!important;display:grid!important;place-items:center!important;
 width:100%!important;height:118px!important;min-height:118px!important;max-height:118px!important;
 margin:0!important;overflow:hidden!important;border-radius:9px!important;background:#f2f4f7!important
}
.pb1137Intake .pb1139GroupPhotos .pb1181IntakeFrame>img{
 display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;
 object-fit:contain!important;object-position:center!important
}
.pb1137Intake .pb1139GroupPhotos figcaption{
 box-sizing:border-box!important;display:-webkit-box!important;width:100%!important;min-width:0!important;
 min-height:30px!important;margin:0!important;overflow:hidden!important;overflow-wrap:anywhere!important;
 white-space:normal!important;text-overflow:ellipsis!important;text-align:center!important;
 -webkit-box-orient:vertical!important;-webkit-line-clamp:2!important;line-height:1.45!important;font-size:11px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1501ActionBadge{
 justify-self:center!important;max-width:100%!important;min-height:23px!important;margin:0!important;
 padding:2px 10px!important;line-height:1.45!important;font-size:11px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions{
 box-sizing:border-box!important;display:grid!important;grid-template-columns:minmax(0,1fr)!important;
 align-items:stretch!important;justify-items:stretch!important;gap:5px!important;width:100%!important;
 min-width:0!important;min-height:0!important;height:auto!important;margin:0!important;overflow:visible!important
}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1180IntakePaper{
 box-sizing:border-box!important;display:block!important;width:100%!important;min-width:0!important;max-width:100%!important;
 height:36px!important;min-height:36px!important;margin:0!important;padding:5px 8px!important;
 font:700 11px/1.4 Vazirmatn,Tahoma,sans-serif!important;white-space:normal!important;overflow:visible!important;text-overflow:clip!important
}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1181ChassisToggle{
 box-sizing:border-box!important;display:flex!important;align-items:center!important;justify-content:flex-start!important;
 gap:6px!important;width:100%!important;min-width:0!important;min-height:24px!important;height:auto!important;
 margin:0!important;padding:0!important;white-space:nowrap!important;font:600 11px/1.4 Vazirmatn,Tahoma,sans-serif!important
}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1181ChassisToggle input{
 box-sizing:border-box!important;flex:0 0 16px!important;width:16px!important;height:16px!important;min-width:16px!important;min-height:16px!important;margin:0!important
}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity{
 box-sizing:border-box!important;display:grid!important;grid-template-columns:minmax(0,1fr) 30px 44px 30px!important;
 align-items:center!important;justify-items:stretch!important;gap:4px!important;width:100%!important;min-width:0!important;
 min-height:34px!important;height:auto!important;margin:0!important;padding:0!important;overflow:visible!important
}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity>*{box-sizing:border-box!important;position:static!important;float:none!important;transform:none!important;margin:0!important}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity>span{
 display:block!important;min-width:0!important;white-space:nowrap!important;text-align:right!important;
 font:700 11px/1.4 Vazirmatn,Tahoma,sans-serif!important
}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity input{
 display:block!important;width:44px!important;min-width:44px!important;max-width:44px!important;
 height:32px!important;min-height:32px!important;margin:0!important;padding:2px!important;text-align:center!important;font-size:13px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity button{
 display:inline-flex!important;align-items:center!important;justify-content:center!important;
 width:30px!important;min-width:30px!important;max-width:30px!important;height:32px!important;min-height:32px!important;
 flex:none!important;margin:0!important;padding:0!important;font-size:15px!important
}
@media(max-width:520px){
 .pb1137Intake .pb1139GroupPhotos{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:7px!important;padding:5px!important}
 .pb1137Intake .pb1139GroupPhotos figure{max-width:none!important;padding:6px!important;gap:5px!important}
 .pb1137Intake .pb1139GroupPhotos .pb1181IntakeFrame{height:clamp(86px,28vw,118px)!important;min-height:clamp(86px,28vw,118px)!important;max-height:clamp(86px,28vw,118px)!important}
 .pb1137Intake .pb1139GroupPhotos .pb1142Quantity{grid-template-columns:minmax(0,1fr) 28px 40px 28px!important;gap:3px!important}
 .pb1137Intake .pb1139GroupPhotos .pb1142Quantity input{width:40px!important;min-width:40px!important;max-width:40px!important}
 .pb1137Intake .pb1139GroupPhotos .pb1142Quantity button{width:28px!important;min-width:28px!important;max-width:28px!important}
}
`;
  fs.writeFileSync(cssFile, css);
}

const sharedMarker = '/* PB1505 shared web and Windows manual-order card layout */';
if (!css.includes(sharedMarker)) {
  css += `\n${sharedMarker}
.pb1137Intake .pb1139GroupPhotos{
 grid-template-columns:repeat(auto-fill,minmax(190px,1fr))!important;gap:12px!important
}
.pb1137Intake .pb1139GroupPhotos figure{
 max-width:260px!important;min-width:0!important;gap:7px!important;padding:9px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1181IntakeFrame{
 height:150px!important;min-height:150px!important;max-height:150px!important
}
.pb1137Intake .pb1139GroupPhotos figcaption{
 min-height:32px!important;overflow-wrap:anywhere!important;white-space:normal!important;line-height:1.5!important;font-size:12px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions{
 grid-template-columns:minmax(0,1fr)!important;gap:7px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1180IntakePaper{
 width:100%!important;height:40px!important;min-height:40px!important;padding:6px 10px!important;font-size:12px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1181ChassisToggle{
 min-height:28px!important;gap:8px!important;font-size:12px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1181ChassisToggle input{
 flex-basis:18px!important;width:18px!important;height:18px!important;min-width:18px!important;min-height:18px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity{
 grid-template-columns:minmax(38px,1fr) 28px 42px 28px!important;gap:4px!important;min-height:38px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity>span{
 min-width:38px!important;font-size:12px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity input{
 width:42px!important;min-width:42px!important;max-width:42px!important;height:34px!important;min-height:34px!important;font-size:14px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity button{
 width:28px!important;min-width:28px!important;max-width:28px!important;height:34px!important;min-height:34px!important
}
@media(max-width:520px){
 .pb1137Intake .pb1139GroupPhotos{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}
 .pb1137Intake .pb1139GroupPhotos figure{max-width:none!important;padding:7px!important;gap:6px!important}
 .pb1137Intake .pb1139GroupPhotos .pb1181IntakeFrame{height:clamp(110px,34vw,145px)!important;min-height:clamp(110px,34vw,145px)!important;max-height:clamp(110px,34vw,145px)!important}
 .pb1137Intake .pb1139GroupPhotos .pb1142Quantity{grid-template-columns:minmax(36px,1fr) 24px 40px 24px!important;gap:3px!important}
 .pb1137Intake .pb1139GroupPhotos .pb1142Quantity>span{min-width:36px!important;font-size:11px!important}
 .pb1137Intake .pb1139GroupPhotos .pb1142Quantity input{width:40px!important;min-width:40px!important;max-width:40px!important}
 .pb1137Intake .pb1139GroupPhotos .pb1142Quantity button{width:24px!important;min-width:24px!important;max-width:24px!important}
}
`;
  fs.writeFileSync(cssFile, css);
}

const orderlyMarker = '/* PB1510 orderly manual-order photo rows */';
if (!css.includes(orderlyMarker)) {
  css += `\n${orderlyMarker}
.pb1137Intake .pb1139GroupPhotos{
 grid-template-columns:repeat(auto-fill,minmax(188px,200px))!important;justify-content:start!important;
 gap:8px!important;max-height:none!important;overflow:visible!important;padding:7px!important
}
.pb1137Intake .pb1139GroupPhotos figure{
 display:grid!important;grid-template-columns:minmax(0,1fr)!important;grid-template-rows:auto auto auto auto!important;
 align-content:start!important;align-items:stretch!important;width:100%!important;min-width:0!important;max-width:none!important;
 box-sizing:border-box!important;height:auto!important;min-height:0!important;max-height:none!important;
 gap:4px!important;margin:0!important;padding:7px!important;overflow:hidden!important;border-radius:9px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1181IntakeFrame{
 grid-column:1!important;grid-row:1!important;width:100%!important;
 height:104px!important;min-height:104px!important;max-height:104px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1181DeleteOverlay,
.pb1137Intake .pb1139GroupPhotos .pb1504ActionToggle{
 top:7px!important;height:28px!important;min-height:28px!important;margin:0!important
}
.pb1137Intake .pb1139GroupPhotos .pb1181DeleteOverlay{
 left:7px!important;right:auto!important;width:28px!important;min-width:28px!important;max-width:28px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1504ActionToggle{
 left:41px!important;right:auto!important;min-width:68px!important;max-width:88px!important;padding:3px 10px!important
}
.pb1137Intake .pb1139GroupPhotos figcaption{
 grid-column:1!important;grid-row:2!important;width:100%!important;min-height:19px!important;max-height:19px!important;
 text-align:center!important;-webkit-line-clamp:1!important;font-size:10px!important;line-height:19px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions{
 grid-column:1!important;grid-row:3!important;display:grid!important;
 grid-template-columns:minmax(0,1fr) 68px!important;width:100%!important;gap:5px!important;align-items:center!important;
 height:31px!important;min-height:31px!important;max-height:31px!important;margin:0!important;overflow:visible!important
}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1180IntakePaper{
 width:100%!important;height:31px!important;min-height:31px!important;max-height:31px!important;padding:3px 6px!important;font-size:10px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1181ChassisToggle{
 box-sizing:border-box!important;justify-self:stretch!important;min-width:0!important;width:68px!important;
 min-height:31px!important;height:31px!important;max-height:31px!important;padding:0 4px!important;font-size:10px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity{
 grid-column:1!important;grid-row:4!important;display:grid!important;
 grid-template-columns:36px 26px 38px 26px!important;justify-content:center!important;align-items:center!important;
 box-sizing:border-box!important;width:100%!important;height:31px!important;min-height:31px!important;max-height:31px!important;
 gap:3px!important;margin:0!important;padding:0!important;overflow:visible!important
}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity>span{min-width:0!important;font-size:10px!important;text-align:center!important}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity input{
 width:38px!important;min-width:38px!important;max-width:38px!important;height:28px!important;min-height:28px!important;max-height:28px!important;font-size:11px!important
}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity button{
 width:26px!important;min-width:26px!important;max-width:26px!important;height:28px!important;min-height:28px!important;max-height:28px!important;font-size:12px!important
}
@media(max-width:760px){
 .pb1137Intake .pb1139GroupPhotos{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;padding:6px!important}
 .pb1137Intake .pb1139GroupPhotos .pb1181IntakeFrame{height:clamp(88px,25vw,104px)!important;min-height:clamp(88px,25vw,104px)!important;max-height:clamp(88px,25vw,104px)!important}
}
@media(max-width:390px){
 .pb1137Intake .pb1139GroupPhotos{grid-template-columns:minmax(0,1fr)!important}
}
`;
  fs.writeFileSync(cssFile, css);
}

const controlPolishMarker = '/* PB1520 compact intake header and readable card controls */';
if (!css.includes(controlPolishMarker)) {
  css += `\n${controlPolishMarker}
@media (min-width:761px){
 .pb1137Intake>header{box-sizing:border-box!important;min-height:42px!important;height:42px!important;padding:3px 0 7px!important;gap:12px!important}
 .pb1137Intake>header>h2{margin:0!important;padding:0!important;font-size:16px!important;line-height:1.4!important}
 .pb1137Intake>header>.pb1469IntakeClose{flex:0 0 32px!important;width:32px!important;min-width:32px!important;height:32px!important;min-height:32px!important;padding:0!important;font-size:21px!important;border-radius:8px!important}
}
.pb1137Intake .pb1139GroupPhotos .pb1181IntakeFrame>.pb1501ActionBadge:not(.pb1504ActionToggle){display:none!important}
.pb1137Intake .pb1139GroupPhotos .pb1504ActionToggle{left:41px!important;right:auto!important;width:58px!important;min-width:58px!important;max-width:58px!important;padding:2px 5px!important;font-size:10px!important;white-space:nowrap!important;overflow:hidden!important}
.pb1137Intake .pb1139GroupPhotos .pb1504ActionToggle::before,
.pb1137Intake .pb1139GroupPhotos .pb1504ActionToggle::after{display:none!important;content:none!important}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions{grid-template-columns:minmax(0,1fr) 54px!important;gap:4px!important}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1180IntakePaper{padding:3px 5px!important;font-size:10px!important;text-overflow:ellipsis!important;white-space:nowrap!important;overflow:hidden!important}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1181ChassisToggle{width:54px!important;padding:0 3px!important;gap:3px!important;font-size:9px!important;white-space:nowrap!important;overflow:hidden!important}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1181ChassisToggle input{flex:0 0 14px!important;width:14px!important;min-width:14px!important;height:14px!important;min-height:14px!important}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity{grid-template-columns:46px 24px 38px 24px!important;gap:3px!important}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity>span{width:46px!important;min-width:46px!important;font-size:10px!important;white-space:nowrap!important;overflow:visible!important}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity button{width:24px!important;min-width:24px!important;max-width:24px!important}
`;
  fs.writeFileSync(cssFile, css);
}

const finalReadabilityMarker = '/* PB1521 edge-to-edge intake header and native label reset */';
if (!css.includes(finalReadabilityMarker)) {
  css += `\n${finalReadabilityMarker}
@media (min-width:761px){
 .pb1137Intake>header{position:relative!important;display:grid!important;place-items:center!important;width:calc(100% + 24px)!important;min-height:46px!important;height:46px!important;margin:-9px -12px 0!important;padding:7px 12px!important;gap:0!important}
 .pb1137Intake>header>h2{width:100%!important;margin:0!important;padding:0 42px!important;text-align:center!important;font:800 14px/1.4 Vazirmatn,Tahoma,sans-serif!important}
 .pb1137Intake>header>.pb1469IntakeClose{position:absolute!important;left:12px!important;top:7px!important;right:auto!important;bottom:auto!important;margin:0!important}
}
.pb1137Intake .pb1139GroupPhotos .pb1501ActionBadge:not(.pb1504ActionToggle){display:none!important}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1180IntakePaper{font:700 9px/1.25 Vazirmatn,Tahoma,sans-serif!important;letter-spacing:0!important}
.pb1137Intake .pb1139GroupPhotos .pb1141PhotoActions>.pb1181ChassisToggle{font:600 9px/1.25 Vazirmatn,Tahoma,sans-serif!important;letter-spacing:0!important}
.pb1137Intake .pb1139GroupPhotos .pb1142Quantity>span{font:700 9px/1.25 Vazirmatn,Tahoma,sans-serif!important;letter-spacing:0!important}
`;
  fs.writeFileSync(cssFile, css);
}

let html = fs.readFileSync(indexFile, 'utf8');
for (const [name, kind] of [
  ['photobridge-r1137-lab-local-intake.css', 'stylesheet'],
  ['photobridge-r1137-lab-local-intake.js', 'script'],
]) {
  const re = new RegExp(`(${kind === 'stylesheet' ? 'href' : 'src'}="/${name.replaceAll('.', '\\.')})\\?v=[^"]+"`, 'g');
  const matches = [...html.matchAll(re)];
  if (matches.length !== 1) throw new Error(`R1502 expected one browser intake ${kind} reference; found ${matches.length}`);
  html = html.replace(re, `$1?v=r1521-final-intake-alignment"`);
}
fs.writeFileSync(indexFile, html);
