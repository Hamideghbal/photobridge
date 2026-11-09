// R1717: protect landing-page first paint without changing internal routes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const html = readFileSync('dist/web/index.html', 'utf8');

test('home prepaint never hides the entire application', () => {
  const start = html.indexOf('<script id="pb1330HomePrepaint">');
  const end = html.indexOf('</style>', start);
  assert.ok(start >= 0 && end > start);
  const gate = html.slice(start, end + 8);
  assert.ok(gate.includes("location.pathname==='/'"));
  assert.ok(gate.includes(',1200)'));
  assert.ok(!gate.includes('pb1330HomePending #root'));
  assert.ok(gate.includes('pbCanonicalHeader'));
});

test('startup scripts cannot block HTML parsing', () => {
  for (const name of ['photobridge-r1363-lab-queue.js', 'photobridge-r1126-desktop-navigation.js']) {
    assert.ok(html.includes('<script defer src="/' + name), name + ' must remain deferred');
    assert.ok(!html.includes('<script src="/' + name), name + ' cannot block parsing');
  }
});

test('core stylesheet is prioritized and no duplicate style download remains', () => {
  const css = '/assets/index-UIRefine-v586.css?v=673&ui=767';
  assert.ok(html.includes('<link rel="preload" as="style" crossorigin fetchpriority="high" href="' + css + '">'));
  assert.ok(html.includes('<link rel="stylesheet" crossorigin href="' + css + '">'));
  assert.equal(html.split('href="/photobridge-v890-lab-finance-store-parity.css?').length - 1, 1);
});
