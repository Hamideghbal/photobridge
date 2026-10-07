import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

console.log('[PhotoBridge Deploy Lite] Building web during npm install...');
run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build:web:actual']);

const webIndex = path.join(root, 'dist', 'web', 'index.html');
if (!fs.existsSync(webIndex)) {
  console.error('[PhotoBridge Deploy Lite] dist/web/index.html was not generated.');
  process.exit(2);
}

// Vite/React are build-only here. The API serves the already bundled dist/web.
const buildOnly = [
  'vite', 'react', 'react-dom', 'scheduler', 'esbuild', 'rollup', 'postcss',
  'picocolors', 'tinyglobby', 'fdir', '@esbuild', '@rollup'
];
for (const rel of buildOnly) {
  try { fs.rmSync(path.join(root, 'node_modules', rel), { recursive: true, force: true }); } catch {}
}

// npm's download cache can make Liara's pushed image hundreds of MB larger.
for (const p of ['/root/.npm', path.join(root, '.npm')]) {
  try { fs.rmSync(p, { recursive: true, force: true }); } catch {}
}

console.log('[PhotoBridge Deploy Lite] Web built; build-only packages and npm cache removed.');
