// Install the pinned ONNX package selectively before npm expands its unused binaries.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

if (process.platform !== 'linux' || !['x64', 'arm64'].includes(process.arch)) {
  throw new Error(`Unsupported Docker target ${process.platform}/${process.arch}`);
}
const manifest = fs.readFileSync('package.json', 'utf8');
const pkg = JSON.parse(manifest);
const version = pkg.dependencies['onnxruntime-node'];
if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('ONNX version must be pinned');
const work = fs.mkdtempSync('/tmp/photobridge-onnx-');
const cache = path.join(work, 'cache');
const native = path.join(work, 'package');
try {
  // npm verifies registry integrity. Remove its download cache before extraction.
  const packed = JSON.parse(execFileSync('npm', ['pack', `onnxruntime-node@${version}`,
    '--json', '--cache', cache, '--pack-destination', work], { encoding: 'utf8' }));
  fs.rmSync(cache, { recursive: true, force: true });
  fs.mkdirSync(native);
  const archive = path.join(work, packed[0].filename);
  const exclude = ['darwin', 'win32', ...(process.arch === 'x64' ? ['linux/arm64'] : ['linux/x64'])];
  execFileSync('tar', ['-xzf', archive, '-C', native, '--strip-components=1',
    ...exclude.map(p => `--exclude=package/bin/napi-v3/${p}`)]);
  fs.rmSync(archive);
  const installed = JSON.parse(fs.readFileSync(path.join(native, 'package.json'), 'utf8'));
  if (installed.name !== 'onnxruntime-node' || installed.version !== version) throw new Error('Unexpected ONNX archive');
  for (const file of ['onnxruntime_binding.node', 'libonnxruntime.so.1']) {
    if (!fs.existsSync(path.join(native, 'bin/napi-v3/linux', process.arch, file))) throw new Error(`Missing ONNX binding: ${file}`);
  }
  // Registry archives are already built. Local packing must not rerun source-only
  // TypeScript preparation hooks; retain the normal postinstall/native checks.
  for (const hook of ['prepare', 'preprepare', 'prepack']) delete installed.scripts?.[hook];
  fs.writeFileSync(path.join(native, 'package.json'), JSON.stringify(installed));
  pkg.dependencies['onnxruntime-node'] = `file:${native}`;
  fs.writeFileSync('package.json', JSON.stringify(pkg));
  // Copy the trimmed local package into node_modules; do not leave a /tmp symlink.
  execFileSync('npm', ['install', '--install-links', '--omit=dev', '--no-audit', '--no-fund',
    '--progress=false', '--prefer-offline'], { stdio: 'inherit' });
  if (fs.lstatSync('node_modules/onnxruntime-node').isSymbolicLink()) throw new Error('ONNX must not link to temporary files');
  console.log(`[PhotoBridge Docker] Installed ONNX ${version} for linux/${process.arch} without extracting unused platform binaries.`);
} finally {
  fs.writeFileSync('package.json', manifest);
  fs.rmSync(work, { recursive: true, force: true });
  fs.rmSync('/tmp/npm-cache', { recursive: true, force: true });
}
