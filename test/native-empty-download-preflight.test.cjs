'use strict';

const assert = require('node:assert/strict');
const vm = require('node:vm');
const { test } = require('node:test');
const { emptyDownloadPreflight, patchEmptyDownloadPreflight } = require('../native-empty-download-preflight.cjs');

test('empty destination scans each actual folder once and refuses collisions, partials and saved receipts', async () => {
  let entries = 0, contents = [];
  const dir = {
    __pbNative: true, rootId: 'native', parts: ['Orders', 'new-order'],
    async *entries() { entries++; yield* contents; },
  };
  const scan = vm.runInNewContext('(' + emptyDownloadPreflight.toString() + ')', {
    pb1450Target: async () => ({ dir, day: '2026-11-22' }),
    pb1769DownloadName: (_file, name) => name,
  });
  const root = { __pbNative: true };
  const files = Array.from({ length: 100 }, (_, index) => ({ original_name: index + '.jpg' }));
  const order = { file_count: files.length };
  const result = await scan({ order, files }, root, {});
  assert.equal(entries, 1);
  assert.equal(result.missing.length, 100);
  assert.equal(result.complete, false);
  assert.equal(await scan({ order, files }, root, { partial: {} }), null);
  assert.equal(await scan({ order: { ...order, downloaded_at: 'old' }, files }, root, {}), null);
  assert.equal(await scan({ order, files: [files[0], ...files.slice(0, 99)] }, root, {}), null);
  assert.equal(entries, 1);
  contents = [['partial.tmp', {}]];
  assert.equal(await scan({ order, files }, root, {}), null);
  assert.equal(entries, 2);
});

test('the renderer patch avoids only the initial verification and still validates after writing', async () => {
  const source = `async function pb1450Target(){return {dir:{__pbNative:true,rootId:'r',parts:['order'],async *entries(){}}};}
  async function pb1450Download(detail,root,receipts,progress){let report;
   report = await pb1450Verify(detail,root,receipts,progress);
   await writePhoto();
   report = await pb1450Verify(detail,root,receipts,progress);
   return report;
  }
  async function pb1450AllowStage(){}`;
  const sequence = [];
  const download = vm.runInNewContext(patchEmptyDownloadPreflight(source) + '\npb1450Download', {
    pb1769DownloadName: (_file, name) => name,
    pb1450Verify: async () => { sequence.push('verify'); return {}; },
    writePhoto: async () => { sequence.push('write'); },
  });
  await download({ order: { file_count: 1 }, files: [{ original_name: 'one.jpg' }] }, { __pbNative: true }, {}, () => {});
  assert.deepEqual(sequence, ['write', 'verify']);
});
