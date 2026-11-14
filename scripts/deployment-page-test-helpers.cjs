// A final build merges stylesheets. Validate their deployed provenance rather
// than requiring the pre-build link tags to remain in index.html.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
exports.readDeploymentPage=file=>{
 const html=fs.readFileSync(file,'utf8');
 if(file!=='dist/web/index.html'||!html.includes('/assets/photobridge-boot-'))return html;
 const manifest=JSON.parse(fs.readFileSync('dist/web/assets/photobridge-boot-manifest.json','utf8'));
 assert(html.includes('/assets/'+manifest.boot),'index references current boot stylesheet');
 const css=fs.readFileSync(path.join('dist/web/assets',manifest.boot),'utf8');
 for(const source of manifest.sources){const relative=source.split(/[?#]/)[0].replace(/^\//,'');assert(css.includes('/* '+relative+' */'),'boot CSS includes '+source)}
 return html+'\n'+JSON.stringify(manifest.sources);
};
