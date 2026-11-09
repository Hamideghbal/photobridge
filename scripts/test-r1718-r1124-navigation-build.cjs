const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

test('R1124 and R1132 handle deferred and normal navigation without duplicates', () => {
  const repo = path.resolve(__dirname, '..');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-r1718-nav-'));
  const pages = ['dist/web/index.html', 'dist/api/equipment-rental-book.html'];
  const pair = /(photobridge-r1126-desktop-navigation\.(?:css|js)\?v=)[^&"']+/g;
  try {
    for (const page of pages) {
      const dest = path.join(temp, page);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(path.join(repo, page), dest);
    }
    const run = script => execFileSync(process.execPath, [path.join(repo, 'scripts', script)], {
      cwd: temp, stdio: 'pipe', timeout: 10000
    });
    run('enable-r1124-photographer-desktop-header.mjs');
    for (const page of pages) {
      const html = fs.readFileSync(path.join(temp, page), 'utf8');
      assert.equal([...html.matchAll(pair)].length, 2, page + ' must contain one navigation CSS/JS pair after R1124');
    }
    run('enable-r1132-final-assets.mjs');
    for (const page of pages) {
      const html = fs.readFileSync(path.join(temp, page), 'utf8');
      assert.equal([...html.matchAll(pair)].length, 2, page + ' must retain one pair after R1132');
      assert.equal((html.match(/photobridge-r1126-desktop-navigation\.js\?v=/g) || []).length, 1);
    }
    const home = fs.readFileSync(path.join(temp, 'dist/web/index.html'), 'utf8');
    assert.ok(home.includes('location.pathname!==\x27/\x27'), 'R1717 homepage guard stays active');
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
