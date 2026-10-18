const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('dist/web/photobridge-r1147-lab-admin-header.js','utf8');
function fixture(path='/lab/settings'){
 const categories=vm.runInNewContext(source.match(/categories=(\[.*\]);\n/)[1]);const buttons=[],visits=[],hiddenClicks=[];
 const context={categories,nav:{append:b=>buttons.push(b)},document:{createElement:()=>({dataset:{},append(){}}),querySelectorAll:()=>['site','general','customers','finance','notifications','system'].map(key=>({click:()=>hiddenClicks.push(key)}))},location:{pathname:path},history:{pushState:(_a,_b,to)=>{visits.push(to);context.location.pathname=to}},dispatchEvent:()=>visits.push('popstate'),PopStateEvent:function(type){this.type=type}};
 const a=source.indexOf('function navigate(path)'),b=source.indexOf('\nfunction clearDesktop',a);vm.runInNewContext(source.slice(a,b),context);
 const start=source.indexOf('categories.forEach('),end=source.indexOf('h.append(nav)',start);let code=source.slice(start,end);const motion=code.indexOf("nav.addEventListener(");if(motion>=0)code=code.slice(0,motion);vm.runInNewContext(code,context);
 return{buttons,visits,hiddenClicks,categories};
}
test('visible lab header categories select their own routes after Site tab is inserted first',()=>{const f=fixture('/lab/settings/site');for(let i=0;i<f.categories.length;i++){f.buttons[i].onclick();assert.equal(f.visits.at(-2),f.categories[i][1]);assert.equal(f.visits.at(-1),'popstate');}assert.deepEqual(f.hiddenClicks,[],'header must not click a different category by array index');});
test('the four existing header actions work from orders and preserve route identity',()=>{const f=fixture('/lab/orders/flow');for(const [label,path]of [['عمومی','/lab/settings'],['عکاسان و همکاری','/lab/settings/customers'],['مالی و تعرفه‌ها','/lab/settings/prices'],['مسیر ذخیره روی هارد','/lab/settings/local']]){const i=f.categories.findIndex(c=>c[0]===label);assert(i>=0);f.buttons[i].onclick();assert.equal(f.visits.at(-2),path);}assert.equal(f.hiddenClicks.length,0);});
