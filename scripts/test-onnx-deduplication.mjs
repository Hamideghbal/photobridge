import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { deduplicateOnnxRuntime } from './deduplicate-onnx-runtime.mjs';

function fixture(t, duplicate) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'photobridge-onnx-dedup-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(root, 'bin/napi-v3/linux/x64');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'libonnxruntime.so.1'), 'native-library');
  fs.writeFileSync(path.join(dir, 'libonnxruntime.so.1.21.0'), duplicate);
  return { root, dir };
}

test('identical native libraries retain both loader names with a relative symlink', t => {
  const { root, dir } = fixture(t, 'native-library');
  const alias = path.join(dir, 'libonnxruntime.so.1.21.0');
  deduplicateOnnxRuntime(root);
  assert.equal(fs.readlinkSync(alias), 'libonnxruntime.so.1');
  assert.equal(fs.readFileSync(alias, 'utf8'), 'native-library');
  deduplicateOnnxRuntime(root);
  assert.equal(fs.readFileSync(alias, 'utf8'), 'native-library');
});

test('equal-sized libraries with different contents are preserved', t => {
  const { root, dir } = fixture(t, 'other--library');
  const alias = path.join(dir, 'libonnxruntime.so.1.21.0');
  deduplicateOnnxRuntime(root);
  assert.equal(fs.lstatSync(alias).isSymbolicLink(), false);
  assert.equal(fs.readFileSync(alias, 'utf8'), 'other--library');
});

test('local builds without installed native dependencies remain supported', t => {
  const { root, dir } = fixture(t, 'native-library');
  fs.rmSync(dir, { recursive: true });
  assert.doesNotThrow(() => deduplicateOnnxRuntime(root));
});
