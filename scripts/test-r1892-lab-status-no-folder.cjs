const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bundle = fs.readFileSync(path.join(__dirname, '../dist/web/assets/index-UIRefine-v655-r84.js'), 'utf8');

function stagePredicate() {
  const from = bundle.indexOf('rn=(le,nt)=>');
  const to = bundle.indexOf(',en=(le,nt)=>', from);
  assert.ok(from > 0 && to > from, 'lab stage predicate was found');
  const expression = bundle.slice(from + 'rn='.length, to);
  const kn = (order, statuses) => statuses.includes(order.status) ||
    (order.status_history || []).some(entry => statuses.includes(entry.status));
  return new Function('o', 'kn', 'Pn', 'return (' + expression + ')')('print', kn, () => 0);
}

test('R1892: downloaded invoiced orders remain eligible for downstream stages even without status history', () => {
  const ready = stagePredicate();
  const order = { status: 'received', status_history: [], downloaded_at: '2026-11-20T08:00:00.000Z', invoice_id: 'invoice-1' };
  assert.equal(ready(order, 'download'), true);
  assert.equal(ready(order, 'print'), true);
});

test('R1892: never treat an unconfirmed download as completed', () => {
  const ready = stagePredicate();
  assert.equal(ready({ status: 'received', status_history: [] }, 'download'), false);
  assert.equal(ready({ status: 'received', status_history: [] }, 'print'), false);
  assert.equal(ready({ status: 'received', downloaded_at: '2026-11-20T08:00:00Z' }, 'print'), false);
  assert.equal(ready({ status: 'sent', status_history: [{ status: 'printing' }] }, 'print'), true);
});

test('R1892: an already issued invoice advances to ready before any folder/PDF access', () => {
  const from = bundle.indexOf('un=async le=>');
  const to = bundle.indexOf(',Cn=async', from);
  assert.ok(from > 0 && to > from, 'lab ready handler was found');
  const handler = bundle.slice(from, to);
  const guard = handler.indexOf('if(le.invoice_id&&le.status!=="ready"');
  const patch = handler.indexOf('await It(le,"ready")', guard);
  const local = handler.indexOf('await Ef(');
  assert.ok(guard >= 0 && patch > guard && local > patch, 'server stage update precedes any local folder access');
  assert.ok(handler.indexOf('try{if(nt){') >= 0 && guard > handler.indexOf('try{if(nt){'), 'legacy invoice build anchor remains available');
  assert.ok(handler.slice(guard, handler.indexOf('const Zt=', guard)).includes('return}'), 'ready transition exits before invoice PDF/folder handling');
});

test('R1892: downloaded and completed API stages remain database-only operations', () => {
  const server = fs.readFileSync(path.join(__dirname, '../dist/api/server.js'), 'utf8');
  const from = server.indexOf("if (labOrder && req.method === 'PATCH')");
  const to = server.indexOf('const ', from + 50);
  assert.ok(from >= 0, 'lab order PATCH API found');
  const scope = server.slice(from, from + 4500);
  assert.match(scope, /UPDATE orders SET status=\$3/);
  assert.doesNotMatch(scope, /(?:getDirectoryHandle|getFileHandle|folder_permission_denied|fs\.existsSync)/);
});
