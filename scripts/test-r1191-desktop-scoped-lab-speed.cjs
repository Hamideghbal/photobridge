const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8');
test('desktop lab queue moves immediately while original mobile timing is preserved',async()=>{
 const start=source.indexOf('const ee=(le,nt,xt)=>'),end=source.indexOf(',Q=async(le,nt=!1)=>',start);
 assert(start>=0&&end>start);
 const code=source.slice(start,end);
 assert(code.includes('R1191 preserve mobile'));
 const scope='(min-width:821px) and (hover:hover) and (pointer:fine)';
 assert(code.includes(scope));
 const make=(desktop)=>{
  const tasks=[],phases=[],ue={current:null},win={matchMedia:()=>({matches:desktop}),clearTimeout:()=>{},setTimeout:(fn,ms)=>{tasks.push({fn,ms});return tasks.length}};
  const ee=Function('ue','window','R','oe','return ('+code.slice('const ee='.length)+')')(ue,win,x=>phases.push(x.phase),key=>({flow:0,ready:1,completed:2})[key]||0);
  return {ee,tasks,phases};
 };
 const desktop=make(true);let a=0;
 await desktop.ee('flow','ready',()=>a++);
 assert.equal(a,1);assert.equal(desktop.tasks.length,0);assert(desktop.phases.includes('idle'));
 const mobile=make(false);let b=0;
 const work=mobile.ee('flow','ready',()=>b++);
 assert.equal(b,0);assert.equal(mobile.tasks[0]?.ms,340);
 mobile.tasks.shift().fn();
 assert.equal(b,1);assert.equal(mobile.tasks[0]?.ms,560);
 mobile.tasks.shift().fn();
 await work;
 assert.equal(mobile.phases.at(-1),'idle');
});
test('fast first batch limited to desktop; mobile card-by-card effect retained',()=>{
 assert(source.includes('if(!window.matchMedia("(min-width:821px) and (hover:hover) and (pointer:fine)").matches){Ge(0);let le=0;'));
 assert(source.includes('window.setInterval(()=>{le+=1,Ge(Math.min(Be.length,le+1))'));
 assert(source.includes('let le=Math.min(Be.length,24);Ge(le)'));
});
test('desktop-only React cache key refreshed',()=>{
 assert.match(fs.readFileSync('dist/web/index.html','utf8'),/index-UIRefine-v655-r84\.js\?v=[^"]+&desktop=r1191"/);
});
