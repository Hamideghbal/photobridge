'use strict';
const fs=require('node:fs'),path=require('node:path');
function startupPage(root=__dirname){
 const icon=fs.readFileSync(path.join(root,'assets/photobridge.png')).toString('base64');
 const font=fs.readFileSync(path.join(root,'assets/photobridge-vazirmatn.woff2')).toString('base64');
 return `<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>@font-face{font-family:Vazirmatn;src:url(data:font/woff2;base64,${font})}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f5f7fb;color:#344054;font-family:Vazirmatn,Tahoma,sans-serif}.startup{display:flex;flex-direction:column;align-items:center;gap:20px;text-align:center;padding:24px}.startup img{display:block;width:240px;max-width:65vw;height:auto;border-radius:28px;object-fit:contain;flex-shrink:0}.startup h1{position:static;margin:0;font-size:22px;line-height:1.5}.startup p{margin:0;font-size:14px;line-height:1.8}.startup small{font-size:12px;color:#667085;max-width:440px;line-height:1.9}</style><main class="startup" role="status"><img src="data:image/png;base64,${icon}" alt="PhotoBridge" width="240" height="240"><h1>لابراتوار فوتوبریج</h1><p>بررسی و آماده‌سازی برنامه…</p><small>اگر اینترنت در دسترس نباشد، آخرین نسخهٔ سالم ذخیره‌شده باز می‌شود.</small></main></html>`;
}
module.exports={startupPage};
