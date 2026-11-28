import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = path => fs.readFileSync(path, 'utf8');
const index = read('dist/web/index.html');
const portal = read('dist/api/equipment-rental-portal.html');
const picker = index.match(/<script id="pb1493MobileSessionResume">([\s\S]*?)<\/script>/)[1];

test('initial probes use the default timeout for each role', async () => {
  const start = picker.indexOf('const results=await Promise.all(');
  const end = picker.indexOf(';', start);
  assert.ok(start >= 0 && end > start);
  const run = new Function('portals', 'validSession', `return (async()=>{${picker.slice(start, end)};return results})()`);
  const calls = [];
  const roles = ['photographer', 'lab', 'rental'];
  await run(roles, async (portal, timeout) => calls.push([portal, timeout]));
  assert.deepEqual(calls, roles.map(portal => [portal, undefined]));
});

test('a transient photographer probe retries within the same selection', async () => {
  const start = picker.indexOf('let valid=await validSession(selected);');
  const end = picker.indexOf('if(valid&&!valid.uncertain)', start);
  assert.ok(start >= 0 && end > start);
  const run = new Function('selected', 'validSession', `return (async()=>{${picker.slice(start, end)} return valid})()`);
  const calls = [];
  const verified = {portal:'photographer'};
  assert.equal(await run('photographer', async (portal, deadline) => {
    calls.push([portal, deadline]);
    return calls.length === 1 ? {uncertain:true} : verified;
  }), verified);
  assert.deepEqual(calls, [['photographer', undefined], ['photographer', 8000]]);
  calls.length = 0;
  assert.equal(await run('photographer', async () => {calls.push('rejected'); return null}), null);
  assert.deepEqual(calls, ['rejected']);
});

test('Store-origin accounts open the Store panel in the existing photographer document', () => {
  const entry = read('dist/web/photobridge-r100f5-entry-routing.js');
  const start = entry.indexOf("if(context?.destination==='lab')");
  const end = entry.indexOf('/* PB1721', start);
  assert.ok(start >= 0 && end > start);
  const route = new Function('window', 'context', `
    let destination;
    if(true){
      ${entry.slice(start, end)}
    return destination;
  `);
  const window = {};
  window.top = window;
  assert.equal(route(window, {destination:'rental'}), '/photographer/gallery?pbStorePanel=store&pbStoreQuery=pbStoreChooser%3D1');
  const panel = read('dist/web/photobridge-r1106-mobile-store-panel.js');
  assert.match(panel, /PB2111 live Store query/);
});

test('a declined gated landing remains retryable and does not navigate without a handoff', () => {
  const entry = read('dist/web/photobridge-r100f5-entry-routing.js');
  const start = entry.indexOf('/* PB2111 gated landing */');
  const end = entry.indexOf('}else location.replace(destination);', start);
  assert.ok(start >= 0 && end > start);
  const run = new Function('window', 'location', `
    let done=true, moving=true;
    const destination='/photographer/gallery';
    ${entry.slice(start, end)} }else location.replace(destination);
    return {done,moving};
  `);
  const moves = [];
  assert.deepEqual(run({pb2092AccountNavigate:() => false}, {replace: path => moves.push(path)}), {done:false,moving:false});
  assert.deepEqual(moves, []);
  assert.deepEqual(run({}, {replace: path => moves.push(path)}), {done:true,moving:true});
  assert.deepEqual(moves, ['/photographer/gallery']);
});

test('the admin preview global cannot resolve to a script element on normal Store pages', () => {
  assert.match(portal, /<script id="pb2079StorePreviewScript">/);
  assert.doesNotMatch(portal, /(?:id|name)="pb2079StorePreview"/);
  assert.match(portal, /window\.pb2079StorePreview=\{shopId:scope,back\}/);
});

test('the confirmed Store logout opens the sign-in screen without requesting session data', () => {
  const marker = portal.indexOf('/* PB2111 confirmed logout landing */');
  const start = portal.lastIndexOf("(async()=>{setBookingPhotographerMode('existing');", marker);
  const end = portal.indexOf('let me=null;', marker);
  assert.ok(start >= 0 && marker > start && end > marker);
  const boot = new Function('location', 'window', 'showLogin', 'setBookingPhotographerMode', 'matchMedia',
    'return ' + portal.slice(start, end) + 'return "probe";})()');
  return Promise.all([
    [{}, 'signed-out', '?logged_out=1'],
    [{pbNativeStorage:{}}, 'probe', '?logged_out=1'],
    [{pb2079StorePreview:{}}, 'probe', '?logged_out=1'],
    [{}, 'probe', ''],
    [{}, 'probe', '?logged_out=1', false],
  ].map(async ([window, expected, search, mobile = true]) => {
    let signInShown = false;
    const result = await boot({pathname:'/rental',search}, window, () => {signInShown=true}, () => {}, () => ({matches:mobile}));
    assert.equal(signInShown ? 'signed-out' : result, expected);
  }));
});

test('an in-flight Store overview cannot render or replace data during logout', async () => {
  const start = portal.indexOf('async function load(opts={}){');
  const end = portal.indexOf('window.pbR1050SyncHeaderChannels', start);
  assert.ok(start >= 0 && end > start);
  const run = new Function('api', 'window', `
    let data='unchanged';
    ${portal.slice(start, end)}
      return true;
    }
    return {load, getData:() => data};
  `);
  const window = {};
  let resolve;
  const runtime = run(() => new Promise(done => {resolve=done}), window);
  const request = runtime.load();
  window.pb2107RentalLogoutPending = true;
  resolve({shop:'old'});
  assert.equal(await request, false);
  assert.equal(runtime.getData(), 'unchanged');
});

test('signing in after Store logout loads the rental identity and clears the logout marker', async () => {
  const start = portal.indexOf('const rentalIdentity=await');
  const end = portal.indexOf("window.__pbRentalProfileImage=''", start);
  assert.ok(start >= 0 && end > start);
  const run = new Function('api', 'window', 'location', 'history', 'return (async()=>{' +
    portal.slice(start, end) + '})()');
  const identity = {rentalShop:{id:'store'}};
  const window = {};
  const calls = [];
  const history = {replaceState:(_state, _title, path) => calls.push(path)};
  await run(async (path, options) => {
    assert.equal(path, '/api/auth/me');
    assert.deepEqual(options.headers, {'x-photobridge-portal':'rental'});
    return identity;
  }, window, {href:'https://photobridge.ir/rental?logged_out=1&view=sales#account'}, history);
  assert.equal(window.__pbRentalAccount, identity);
  assert.deepEqual(calls, ['/rental?view=sales#account']);
});
