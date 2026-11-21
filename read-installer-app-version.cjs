'use strict';

const fs = require('node:fs');

function readInstallerApp(file) {
  const fd = fs.openSync(file, 'r');
  try {
    const prefix = Buffer.alloc(16);
    if (fs.readSync(fd, prefix, 0, prefix.length, 0) !== prefix.length || prefix.readUInt32LE(0) !== 4) {
      throw Error('invalid_asar_header');
    }
    const headerSize = prefix.readUInt32LE(4);
    const jsonSize = prefix.readUInt32LE(12);
    if (headerSize < 8 || jsonSize > headerSize - 8 || headerSize > 32 * 1024 * 1024) throw Error('invalid_asar_header_size');
    const header = Buffer.alloc(jsonSize);
    if (fs.readSync(fd, header, 0, jsonSize, 16) !== jsonSize) throw Error('truncated_asar_header');
    const info = JSON.parse(header.toString()).files?.['package.json'];
    if (!info || info.unpacked || !/^\d+$/.test(info.offset) || !Number.isSafeInteger(info.size) ||
        info.size < 1 || info.size > 1024 * 1024) throw Error('invalid_asar_package');
    const start = 8 + headerSize + Number(info.offset);
    const bytes = Buffer.alloc(info.size);
    if (!Number.isSafeInteger(start) || fs.readSync(fd, bytes, 0, bytes.length, start) !== bytes.length) throw Error('truncated_asar_package');
    const { name, version } = JSON.parse(bytes.toString());
    return { name, version };
  } finally {
    fs.closeSync(fd);
  }
}

if (require.main === module) {
  try {
    const { name, version } = readInstallerApp(process.argv[2]);
    if (name !== 'photobridge-lab-desktop' || !/^\d+\.\d+\.\d+$/.test(version)) throw Error('not_a_lab_package');
    console.log(version);
  } catch (error) {
    console.error('Inner package version unavailable:', error.message);
    process.exitCode = 1;
  }
}

module.exports = { readInstallerApp };
