'use strict';

const fs = require('node:fs');
const path = require('node:path');

function readProfile(file) {
  const { DatabaseSync } = require('node:sqlite');
  const profile = path.dirname(file);
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    const get = db.prepare('SELECT value FROM settings WHERE key=?');
    const value = key => JSON.parse(get.get(key)?.value || 'null');
    if (value('nativeVersion') !== '1.0.120') return [];
    const ui = fs.realpathSync(path.join(profile, 'ui'));
    const current = value('uiRoot');
    const known = value('uiKnownGoodRoot');
    return [...new Set([current, known])].filter(Boolean).flatMap(dir => {
      try {
        const root = fs.realpathSync(dir);
        const relative = path.relative(ui, root);
        return /^[0-9a-f]{64}$/i.test(relative) ? [root] : [];
      } catch { return []; }
    });
  } finally {
    db.close();
  }
}

if (require.main === module) {
  try {
    for (const root of readProfile(process.argv[2])) console.log(root);
  } catch {
    // Absent, locked or unavailable profile is not an installation candidate.
  }
}

module.exports = { readProfile };
