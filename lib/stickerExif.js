'use strict';

/* Writes WhatsApp sticker pack info (name + author) into a WebP file.
   Works on static and animated stickers without re-encoding them. */
const crypto = require('crypto');

const chunk = (type, data) => {
    const head = Buffer.alloc(8);
    head.write(type, 0, 4, 'ascii');
    head.writeUInt32LE(data.length, 4);
    return Buffer.concat([head, data, data.length % 2 ? Buffer.alloc(1) : Buffer.alloc(0)]);
};

function parse(buf) {
    if (buf.length < 20 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') {
        throw new Error('This is not a WebP sticker');
    }
    const chunks = [];
    let p = 12;
    while (p + 8 <= buf.length) {
        const type = buf.toString('ascii', p, p + 4);
        const size = buf.readUInt32LE(p + 4);
        chunks.push({ type, data: buf.subarray(p + 8, p + 8 + size) });
        p += 8 + size + (size % 2);
    }
    return chunks;
}

function describe(chunks) {
    const lossy = chunks.find(c => c.type === 'VP8 ');
    if (lossy) {
        return { w: lossy.data.readUInt16LE(6) & 0x3fff, h: lossy.data.readUInt16LE(8) & 0x3fff, alpha: chunks.some(c => c.type === 'ALPH') };
    }
    const lossless = chunks.find(c => c.type === 'VP8L');
    if (lossless) {
        const bits = lossless.data.readUInt32LE(1);
        return { w: (bits & 0x3fff) + 1, h: ((bits >>> 14) & 0x3fff) + 1, alpha: ((bits >>> 28) & 1) === 1 };
    }
    throw new Error('Unsupported WebP format');
}

function buildExif(pack, author) {
    const json = Buffer.from(JSON.stringify({
        'sticker-pack-id': crypto.randomBytes(16).toString('hex'),
        'sticker-pack-name': String(pack || ''),
        'sticker-pack-publisher': String(author || ''),
        emojis: []
    }), 'utf8');
    const head = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
        0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00
    ]);
    const exif = Buffer.concat([head, json]);
    exif.writeUInt32LE(json.length, 14);
    return exif;
}

function setStickerExif(webp, pack, author) {
    const chunks = parse(webp).filter(c => c.type !== 'EXIF');
    const old = chunks.find(c => c.type === 'VP8X');
    const rest = chunks.filter(c => c.type !== 'VP8X');

    let payload;
    if (old) {
        payload = Buffer.from(old.data);
    } else {
        const { w, h, alpha } = describe(chunks);
        payload = Buffer.alloc(10);
        if (alpha) payload[0] |= 0x10;
        payload.writeUIntLE(w - 1, 4, 3);
        payload.writeUIntLE(h - 1, 7, 3);
    }
    payload[0] |= 0x08; // "has EXIF"

    const body = Buffer.concat([
        chunk('VP8X', payload),
        ...rest.map(c => chunk(c.type, c.data)),
        chunk('EXIF', buildExif(pack, author))
    ]);
    const head = Buffer.alloc(12);
    head.write('RIFF', 0, 'ascii');
    head.writeUInt32LE(body.length + 4, 4);
    head.write('WEBP', 8, 'ascii');
    return Buffer.concat([head, body]);
}

// read back the pack name / author (used for tests and handy for info commands)
function readStickerExif(webp) {
    const exif = parse(webp).find(c => c.type === 'EXIF');
    if (!exif) return null;
    const start = exif.data.indexOf('{');
    if (start < 0) return null;
    try { return JSON.parse(exif.data.subarray(start).toString('utf8')); } catch (_) { return null; }
}

module.exports = { setStickerExif, readStickerExif };
