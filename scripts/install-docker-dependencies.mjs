// Install the pinned ONNX package selectively before npm expands its unused binaries.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

// npm pack previously buffered all messages, obscuring stalled downloads.
// Stream milestones and heartbeats, and fail before Liara's 15-minute limit.
function runNpm(args, { stage, capture = false, timeoutMs = 360_000 } = {}) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    console.log(`[PhotoBridge Docker deps] START ${stage}`);
    const child = spawn('npm', args, {
      stdio: ['ignore', capture ? 'pipe' : 'inherit', 'inherit'],
      env: { ...process.env, ONNXRUNTIME_NODE_INSTALL: 'skip' }
    });
    let output = '';
    let timedOut = false;
    let finished = false;
    if (capture) {
      child.stdout.setEncoding('utf8');
      child.stdout.on('data', chunk => {
        output += chunk;
        if (output.length > 16_000_000) {
          console.error(`[PhotoBridge Docker deps] ${stage}: npm output exceeded limit`);
          child.kill('SIGKILL');
        }
      });
    }
    const heartbeat = setInterval(() => {
      console.log(`[PhotoBridge Docker deps] running ${stage}: ${Math.round((Date.now() - started) / 1000)}s`);
    }, 15_000);
    const timeout = setTimeout(() => {
      timedOut = true;
      console.error(`[PhotoBridge Docker deps] TIMEOUT ${stage} after ${timeoutMs / 1000}s; registry=${process.env.NPM_CONFIG_REGISTRY || 'npm default'}`);
      child.kill('SIGKILL');
    }, timeoutMs);
    const finish = (err, code = null, signal = null) => {
      if (finished) return;
      finished = true;
      clearInterval(heartbeat);
      clearTimeout(timeout);
      const seconds = Math.round((Date.now() - started) / 1000);
      if (err || code !== 0 || signal) {
        const issue = timedOut ? 'timed out' : (err?.message || `exit=${code} signal=${signal || 'none'}`);
        console.error(`[PhotoBridge Docker deps] FAIL ${stage} after ${seconds}s: ${issue}`);
        reject(new Error(`Docker dependency ${stage} failed: ${issue}`));
      } else {
        console.log(`[PhotoBridge Docker deps] OK ${stage} (${seconds}s)`);
        resolve(output);
      }
    };
    child.once('error', err => finish(err));
    child.once('close', (code, signal) => finish(null, code, signal));
  });
}

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
  const packed = JSON.parse(await runNpm(['pack', `onnxruntime-node@${version}`,
    '--json', '--cache', cache, '--pack-destination', work], { stage: `npm pack onnxruntime-node@${version}`, capture: true }));
  fs.rmSync(cache, { recursive: true, force: true });
  fs.mkdirSync(native);
  const archive = path.join(work, packed[0].filename);
  const exclude = ['darwin', 'win32', ...(process.arch === 'x64' ? ['linux/arm64'] : ['linux/x64'])];
  console.log(`[PhotoBridge Docker deps] START extract Linux ${process.arch} ONNX native package`);
  execFileSync('tar', ['-xzf', archive, '-C', native, '--strip-components=1',
    ...exclude.map(p => `--exclude=package/bin/napi-v3/${p}`)]);
  fs.rmSync(archive);
  console.log('[PhotoBridge Docker deps] OK extract native package');
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
  await runNpm(['install', '--install-links', '--omit=dev', '--no-audit', '--no-fund',
    '--progress=false', '--prefer-offline'], { stage: 'npm install production dependencies' });
  if (fs.lstatSync('node_modules/onnxruntime-node').isSymbolicLink()) throw new Error('ONNX must not link to temporary files');
  console.log(`[PhotoBridge Docker] Installed ONNX ${version} for linux/${process.arch} without extracting unused platform binaries.`);
} finally {
  fs.writeFileSync('package.json', manifest);
  fs.rmSync(work, { recursive: true, force: true });
  fs.rmSync('/tmp/npm-cache', { recursive: true, force: true });
}
