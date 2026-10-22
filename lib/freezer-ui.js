'use strict';

/* =========================================================
   FREEZER-MD shared helpers
   Lives in /lib next to function.js and groupTools.js.
========================================================= */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

let FFMPEG = 'ffmpeg';
try { FFMPEG = require('@ffmpeg-installer/ffmpeg').path || 'ffmpeg'; } catch (_) { /* use system ffmpeg */ }

const TITLE = '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗* ◈';
const FOOTER = '> © 𝗙𝗥𝗘𝗘𝗭𝗘𝗥-𝗠𝗗 🥶';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

/* ---------- boxed message style ---------- */
function makeBox(tag = 'Command Center') {
    return (heading, ...lines) => [
        TITLE,
        '┃',
        `┃┌─ ${heading} ───`,
        ...lines
            .filter(l => l !== null && l !== undefined)
            .map(l => (l === '' ? '┃│' : `┃│ ${l}`)),
        '┃└─────────────',
        '┃',
        `┃📌 FREEZER-MD • ${tag}`,
        '┃',
        '┗▣',
        FOOTER
    ].join('\n');
}

/* ---------- misc ---------- */
const digits = (s) => String(s || '').split('@')[0].split(':')[0].replace(/\D/g, '');

function sizeText(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function quotedText(m) {
    const q = m.quoted;
    return String(q?.text || q?.body || q?.msg?.text || q?.msg?.caption || q?.caption || '').trim();
}

function isGroup(m) {
    return m.isGroup === true || String(m.from || '').endsWith('@g.us');
}

function isOwner(m) {
    if (m.isOwner === true || m.isDev === true || m.fromMe === true) return true;
    const list = [global.owner, global.ownerNumber, global.OWNER_NUMBER, global.owners]
        .flat()
        .filter(Boolean)
        .map(digits)
        .filter(Boolean);
    return list.includes(digits(m.sender));
}

// handler.js already works this out for the sender (m.isAdmin)
async function isAdmin(sock, m) {
    return m.isAdmin === true;
}

/* ---------- baileys loader (works with most forks) ---------- */
let _baileys;
function loadBaileys() {
    if (_baileys !== undefined) return _baileys;
    const names = [global.baileysModule, '@whiskeysockets/baileys', 'baileys', '@adiwajshing/baileys'].filter(Boolean);
    for (const name of names) {
        try { _baileys = require(name); return _baileys; } catch (_) { /* try next */ }
    }
    _baileys = null;
    return null;
}

/* ---------- media helpers ---------- */
function mimeOf(msg) {
    return String(msg?.mimetype || msg?.msg?.mimetype || '').toLowerCase();
}

function mediaKind(msg) {
    if (!msg) return null;
    if (['image', 'video', 'audio', 'document', 'sticker'].includes(msg.mediaType)) return msg.mediaType;
    const mime = mimeOf(msg);
    const type = String(msg.mtype || msg.type || '').toLowerCase();
    if (type.includes('sticker')) return 'sticker';
    if (type.includes('image') || mime.startsWith('image/')) return 'image';
    if (type.includes('video') || mime.startsWith('video/')) return 'video';
    if (type.includes('audio') || mime.startsWith('audio/')) return 'audio';
    if (type.includes('document') || mime) return 'document';
    return null;
}

// raw WhatsApp message node of a serialized message (m or m.quoted)
function nodeOf(msg) {
    return msg?.message?.[msg?.type] || msg?.msg || {};
}
const isPtt = (msg) => !!nodeOf(msg).ptt;
const fileNameOf = (msg) => nodeOf(msg).fileName || 'file';

const MIME_EXT = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    'video/mp4': 'mp4', 'video/3gpp': '3gp', 'video/webm': 'webm', 'video/quicktime': 'mov',
    'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg', 'audio/wav': 'wav',
    'application/pdf': 'pdf', 'application/zip': 'zip'
};
function extOf(mime) {
    const clean = String(mime || '').split(';')[0].trim().toLowerCase();
    return MIME_EXT[clean] || clean.split('/')[1] || 'bin';
}

const silentLogger = {
    level: 'silent', info() {}, error() {}, warn() {}, debug() {}, trace() {}, fatal() {},
    child() { return silentLogger; }
};

async function downloadMedia(sock, msg) {
    // 1) the serializer's own helper, if the base has one
    if (typeof msg?.download === 'function') {
        try {
            const b = await msg.download();
            if (Buffer.isBuffer(b) && b.length) return b;
        } catch (_) { /* fall through */ }
    }
    // 2) plain baileys download
    const baileys = loadBaileys();
    if (baileys?.downloadMediaMessage) {
        const raw = msg.fakeObj || msg;
        const b = await baileys.downloadMediaMessage(
            raw, 'buffer', {},
            { logger: silentLogger, reuploadRequest: sock.updateMediaMessage }
        );
        if (Buffer.isBuffer(b) && b.length) return b;
    }
    return null;
}

// Looks at the replied-to message first, then the command message itself
async function getMedia(sock, m, kinds) {
    for (const msg of [m.quoted, m]) {
        const kind = mediaKind(msg);
        if (!kind || (kinds && !kinds.includes(kind))) continue;
        try {
            const buffer = await downloadMedia(sock, msg);
            if (buffer?.length) return { buffer, kind, mime: mimeOf(msg), msg };
        } catch (_) { /* try next */ }
    }
    return null;
}

/* ---------- ffmpeg ---------- */
async function convert(buffer, inExt, outExt, args = [], timeout = 180000) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const input = path.join(os.tmpdir(), `fz_${id}.${inExt || 'bin'}`);
    const output = path.join(os.tmpdir(), `fz_${id}_out.${outExt}`);
    try {
        fs.writeFileSync(input, buffer);
        await execFileAsync(FFMPEG, ['-y', '-i', input, ...args, output], {
            timeout, maxBuffer: 20 * 1024 * 1024
        });
        return fs.readFileSync(output);
    } finally {
        for (const f of [input, output]) { try { fs.unlinkSync(f); } catch (_) {} }
    }
}

const toOpus = (buffer, inExt) =>
    convert(buffer, inExt, 'ogg', ['-vn', '-c:a', 'libopus', '-b:a', '64k', '-ar', '48000', '-ac', '1']);

module.exports = {
    FFMPEG, FOOTER, UA, makeBox, digits, sizeText, quotedText,
    isGroup, isOwner, isAdmin, loadBaileys,
    mimeOf, mediaKind, nodeOf, isPtt, fileNameOf, extOf, downloadMedia, getMedia, convert, toOpus
};
