'use strict';

/* Small dependency-free ZIP reader (stored + deflate entries, which covers
   practically every .zip). Everything stays in memory, nothing is written to disk. */
const zlib = require('zlib');

const EOCD_SIG = 0x06054b50;
const CEN_SIG = 0x02014b50;
const LOC_SIG = 0x04034b50;

function listEntries(buf) {
    if (buf.length < 22 || buf.readUInt32LE(0) !== LOC_SIG && buf.readUInt32LE(0) !== EOCD_SIG) {
        throw new Error('This is not a ZIP file');
    }

    // find the "end of central directory" record, scanning back from the end
    let eocd = -1;
    for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 65535); i--) {
        if (buf.readUInt32LE(i) === EOCD_SIG) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('ZIP file is damaged (no directory found)');

    const total = buf.readUInt16LE(eocd + 10);
    const cdOffset = buf.readUInt32LE(eocd + 16);
    if (total === 0xffff || cdOffset === 0xffffffff) throw new Error('ZIP64 archives are not supported');

    const entries = [];
    let p = cdOffset;
    for (let i = 0; i < total; i++) {
        if (p + 46 > buf.length || buf.readUInt32LE(p) !== CEN_SIG) throw new Error('ZIP directory is damaged');
        const flags = buf.readUInt16LE(p + 8);
        const method = buf.readUInt16LE(p + 10);
        const csize = buf.readUInt32LE(p + 20);
        const usize = buf.readUInt32LE(p + 24);
        const nameLen = buf.readUInt16LE(p + 28);
        const extraLen = buf.readUInt16LE(p + 30);
        const commentLen = buf.readUInt16LE(p + 32);
        const offset = buf.readUInt32LE(p + 42);
        const name = buf.toString('utf8', p + 46, p + 46 + nameLen);

        entries.push({
            name, method, csize, usize, offset,
            encrypted: (flags & 1) === 1,
            isDir: name.endsWith('/')
        });
        p += 46 + nameLen + extraLen + commentLen;
    }
    return entries;
}

function extract(buf, entry) {
    if (entry.encrypted) throw new Error('password-protected');
    const o = entry.offset;
    if (o + 30 > buf.length || buf.readUInt32LE(o) !== LOC_SIG) throw new Error('damaged entry');
    const start = o + 30 + buf.readUInt16LE(o + 26) + buf.readUInt16LE(o + 28);
    const raw = buf.subarray(start, start + entry.csize);

    let data;
    if (entry.method === 0) data = Buffer.from(raw);
    else if (entry.method === 8) data = zlib.inflateRawSync(raw, { maxOutputLength: entry.usize + 1 });
    else throw new Error(`unsupported compression (${entry.method})`);

    if (data.length !== entry.usize) throw new Error('size mismatch');
    return data;
}

module.exports = { listEntries, extract };
