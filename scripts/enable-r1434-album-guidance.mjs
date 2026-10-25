import fs from 'node:fs';
const source=fs.readFileSync('scripts/r1380-album-editor.js','utf8'),file='dist/web/assets/index-UIRefine-v655-r84.js';let ui=fs.readFileSync(file,'utf8');
function block(text,name){const token='function '+name+'(',start=text.indexOf(token);if(start<0||text.indexOf(token,start+token.length)>=0)throw Error('R1434 missing/duplicate component '+name);const tail=text.slice(start+token.length),next=tail.search(/\n(?:async )?function /);return{start,end:next<0?text.length:start+token.length+next}}
if(!ui.includes('/* PB1434 album interactions */')){
 for(const name of ['PB1380AlbumEditor','PB1380PriceTable','PB1381CatalogRow','PB1384GalleryButton']){
  const current=block(ui,name),fresh=block(source,name);ui=ui.slice(0,current.start)+source.slice(fresh.start,fresh.end)+ui.slice(current.end);
 }
 if(!ui.includes('function PB1434BindingSizes(')){const helper=block(source,'PB1434BindingSizes');ui+='\n'+source.slice(helper.start,helper.end)+'\n'}
 ui+='\n/* PB1434 album interactions */\n';fs.writeFileSync(file,ui);
}
let html=fs.readFileSync('dist/web/index.html','utf8');
html=html.replace(/(photobridge-r1380-album-editor\.css)(?:\?[^"'<>\s]*)?/g,'$1?v=r1434');
html=html.replace(/(assets\/index-UIRefine-v655-r84\.js\?[^"']*)/g,url=>url.includes('&albumGuidance=')?url:url+'&albumGuidance=r1434');fs.writeFileSync('dist/web/index.html',html);
