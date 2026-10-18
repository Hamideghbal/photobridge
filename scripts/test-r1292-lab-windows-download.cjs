const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

test('R1292 lab account exposes one dedicated installer download page',()=>{
 const page=fs.readFileSync('dist/web/index.html','utf8');
 const banner=fs.readFileSync('dist/web/photobridge-r1292-lab-windows-download-shortcut.js','utf8');
 const stylesheet=fs.readFileSync('dist/web/photobridge-r1292-lab-windows-download-shortcut.css','utf8');
 assert(page.includes('/photobridge-r1292-lab-windows-download-shortcut.js?v=r1292'));
 assert(page.includes('/photobridge-r1292-lab-windows-download-shortcut.css?v=r1292'));
 assert(banner.includes("link.href='/lab-windows-download.html'"));
 assert(banner.includes('.labRoleWorkspace'));
 assert(banner.includes("banner.parentElement!==parent"));
 assert(stylesheet.includes('.pb1292LabWindowsLink'));
 new Function(banner);
});

test('R1292 landing page shows only a real published EXE and has a signed-in fallback',()=>{
 const html=fs.readFileSync('dist/web/lab-windows-download.html','utf8');
 const api=fs.readFileSync('dist/api/server.js','utf8');
 const inline=html.match(/<script>([\s\S]*?)<\/script>/);
 assert(inline,'Expected one inline status checker');
 new Function(inline[1]);
 assert(html.includes('href="/api/lab/desktop-installer"'));
 assert(html.includes('/api/lab/desktop-installer/status'));
 assert(html.includes('info.available===true'));
 assert(html.includes('link.hidden=false'));
 assert(html.includes('response.status===401||response.status===403'));
 assert(html.includes('هنوز توسط مدیر سامانه منتشر نشده است'));
 assert(api.includes("url.pathname === '/api/lab/desktop-installer'"));
 assert(api.includes("url.pathname === '/api/lab/desktop-installer/status'"));
 assert(api.includes("m.role='lab_admin'"));
});
