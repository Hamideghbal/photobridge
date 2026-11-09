// R1717: protect home first-paint optimization and unrelated routes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const html = readFileSync('dist/web/index.html','utf8');

test('homepage never hides the entire app for six seconds', () => {
  const gate = html.match(/<script id="pb1330HomePrepaint">([\\s\\S]*?)<\\/script><style id="pb1330HomePrepaintStyle">([\\s\\S]*?)<\\/style>/);
  assert.ok(gate, 'home prepaint gate exists');
  assert.match(gate[1], /location\\.pathname===['"]\\/['"]/);
  assert.match(gate[1], /,1200\\)/);
  assert.doesNotMatch(gate[2], /#root/);
  assert.match(gate[2], /pbCanonicalHeader/);
});

test('startup scripts cannot block HTML parsing', () => {
  for (const name of ['photobridge-r1363-lab-queue.js', 'photobridge-r1126-desktop-navigation.js']) {
    const re = new RegExp('<script\\s+defer\\s+src="/(' + name.replace(/\\./g,'\\\\.') + ')[^"<>]*"\\s*><\\/script>');
    assert.match(html, re, name + ' must stay deferred');
  }
});

test('core CSS is prioritized and old duplicate stylesheet is removed', () => {
  const path='/assets/index-UIRefine-v586.css?v=673&ui=767';
  assert.ok(html.includes('<link rel="preload" as="style" fetchpriority="high" href="'+path+'">'));
  assert.ok(html.includes('<link rel="stylesheet" crossorigin href="'+path+'">'));
  const copies=html.match(/href="\\/photobridge-v890-lab-finance-store-parity\\.css\\?/g)||[];
  assert.equal(copies.length,1);
});
