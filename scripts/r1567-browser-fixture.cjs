const fs=require('node:fs'),path=require('node:path');
async function setup(page,{native=true,delay=0}={}){
 const root=path.resolve(native?'dist/web/lab-desktop-ui':'dist/web'),calls=[],errors=[],blocked=new Map(),lab={id:'10000000-0000-4000-8000-000000000001',name:'لابراتوار تست',album_enabled:true};
 if(native)await page.addInitScript(()=>{window.pbNativeStorage={invoke:async()=>({configured:false})};});
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.pathname.startsWith('/api/')||u.pathname.startsWith('/desktop/')){
 calls.push({path:u.pathname,method:route.request().method()});
 if(blocked.has(u.pathname))await blocked.get(u.pathname).promise;
 if(delay)await new Promise(r=>setTimeout(r,delay));
 let body={summary:{},orders:[],customers:[],temporaryCustomers:[],invitations:[],invites:[],requests:[],notifications:[],unread:0,transactions:[],invoices:[],payments:[],expenses:[],prices:[],hours:[],sizes:[],papers:[],albums:[],days:[],rows:[],items:[],settings:{},status:{open:true},walletBalance:0,orderStats:{},recentOrders:[],collaborationPending:{count:0},features:{siteAvailable:true,siteEnabled:true,desktopEnabled:true,paidSubscription:true},domains:[],plans:[]};
 if(u.pathname==='/api/auth/me')body={user:{userId:'U',labId:lab.id,labRole:'lab_admin',platformRole:'user',name:'مدیر'},lab};
 if(u.pathname==='/api/lab/dashboard')body={...body,lab};
 if(u.pathname==='/api/lab/write-access')body={allowed:true,activeUntil:'2030-01-01T00:00:00Z',serverNow:new Date().toISOString()};
 if(u.pathname==='/desktop/status')body={signedIn:true,pending:0,conflicts:[]};
 try{return await route.fulfill({json:body})}catch{return}
 }
 const name=path.extname(u.pathname)?u.pathname.replace(/^\//,''):'index.html',file=path.join(root,name);try{return fs.existsSync(file)&&fs.statSync(file).isFile()?await route.fulfill({path:file}):await route.fulfill({status:404})}catch{return}
 });
 return{calls,errors,block(name){let release;const promise=new Promise(r=>release=r);blocked.set(name,{promise,release});return()=>{release();blocked.delete(name);};}};
}
module.exports={setup};
