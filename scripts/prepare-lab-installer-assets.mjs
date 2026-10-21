import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
export function prepareLabInstallerAssets(root=process.cwd()){
 const app=path.join(root,'apps/lab-desktop'),pkgFile=path.join(app,'package.json');
 if(!fs.existsSync(pkgFile))throw Error('Restore laboratory native sources before preparing installer assets');
 const pkg=JSON.parse(fs.readFileSync(pkgFile,'utf8'));if(pkg.name!=='photobridge-lab-desktop'||pkg.build?.appId!=='ir.photobridge.lab')throw Error('Unexpected native application identity');
 if(!pkg.build.win||!pkg.build.nsis)throw Error('Missing Windows installer configuration');
 const candidates=['photobridge-native-512-r1286.png','photobridge-icon-512-v785.png'];let selected;
 for(const name of candidates){const file=path.join(root,'dist/web',name);if(!fs.existsSync(file))continue;const bytes=fs.readFileSync(file);if(bytes.length>=24&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))&&bytes.readUInt32BE(16)>=256&&bytes.readUInt32BE(20)>=256){selected={file,bytes};break;}}
 if(!selected)throw Error('A valid PhotoBridge PNG icon of at least 256 pixels is required');
 fs.mkdirSync(path.join(app,'assets'),{recursive:true});fs.writeFileSync(path.join(app,'assets/photobridge.png'),selected.bytes);
 // Electron Builder accepts PNG and creates the Windows icon during packaging.
 // Keep the existing project artwork byte-for-byte; the archive has no ICO files.
 pkg.build.win.icon='assets/photobridge.png';delete pkg.build.nsis.installerIcon;delete pkg.build.nsis.uninstallerIcon;
 fs.writeFileSync(pkgFile,JSON.stringify(pkg,null,2)+'\n');return {icon:path.relative(root,selected.file),bytes:selected.bytes.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log('[Lab installer assets]',prepareLabInstallerAssets());
