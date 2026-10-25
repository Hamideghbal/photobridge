const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{execFileSync}=require('node:child_process');
test('album gallery has one scroll body between its persistent header and footer',()=>{
 const ui=fs.readFileSync('dist/web/assets/index-UIRefine-v655-r84.js','utf8'),modal=ui.slice(ui.indexOf('function PB1384GalleryModal('),ui.indexOf('function PB1384StoredColor'));
 assert.equal(modal.split("className:'pb1457GalleryBody'").length,2);
 assert(modal.indexOf("e.jsxs('header'")<modal.indexOf('pb1457GalleryBody'));
 assert(modal.indexOf('pb1457GalleryBody')<modal.indexOf('PB1454SampleChooser'));
 assert(modal.indexOf('pb1384GalleryGrid')<modal.indexOf("e.jsxs('footer'"));
 const css=fs.readFileSync('dist/web/photobridge-r1380-album-editor.css','utf8');
 assert(css.includes('min-height:0;min-width:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain'));
 assert(css.includes('.pb1457GalleryBody .pb1454SampleChoices'));
 assert(fs.readFileSync('dist/web/index.html','utf8').includes('galleryBounds=r1457'));
});
test('gallery transform is idempotent',()=>{
 const files=['dist/web/assets/index-UIRefine-v655-r84.js','dist/web/photobridge-r1380-album-editor.css','dist/web/index.html','dist/api/equipment-rental-book.html'];
 const before=files.map(file=>fs.readFileSync(file,'utf8'));
 execFileSync(process.execPath,['scripts/enable-r1457-contained-album-gallery.mjs']);
 files.forEach((file,i)=>assert.equal(fs.readFileSync(file,'utf8'),before[i],file));
});
