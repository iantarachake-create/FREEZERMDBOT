'use strict';

const SUPPORTED = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'];

function getCtx(m) {
    return m.message?.extendedTextMessage?.contextInfo || m.msg?.contextInfo || m.contextInfo || {};
}

// Download media from the replied message, or from the message itself (captioned).
// `allowed` = optional array of message types, e.g. ['imageMessage'].
async function getMedia(sock, m, allowed) {
    const ctx = getCtx(m);
    const q = ctx.quotedMessage;
    let msg, key, type;

    if (q) {
        type = SUPPORTED.find(k => q[k]);
        if (type) {
            msg = q;
            key = { remoteJid: m.from, id: ctx.stanzaId, fromMe: false, participant: ctx.participant };
        }
    }
    if (!type && m.message) {
        type = SUPPORTED.find(k => m.message[k]);
        if (type) {
            msg = m.message;
            key = m.key || { remoteJid: m.from, id: 'x', fromMe: false };
        }
    }
    if (!type) return null;
    if (allowed && !allowed.includes(type)) return null;

    const buffer = await global.downloadMediaMessage({ message: msg, key }, 'buffer', {});
    const node = msg[type];
    return { buffer, type, mime: node.mimetype || 'application/octet-stream', caption: node.caption || '', node };
}

// Collect every http(s) URL found anywhere inside an object (for downloader libs
// whose result shape differs between versions).
function deepUrls(obj, out = []) {
    if (!obj) return out;
    if (typeof obj === 'string') { if (/^https?:\/\//i.test(obj)) out.push(obj); return out; }
    if (Array.isArray(obj)) { obj.forEach(o => deepUrls(o, out)); return out; }
    if (typeof obj === 'object') Object.values(obj).forEach(o => deepUrls(o, out));
    return out;
}

// Uses lib/btch-downloader (your own copy) if it exists, otherwise the npm package.
function getDownloader() {
    try {
        return require('./btch-downloader');
    } catch (err) {
        if (err.code !== 'MODULE_NOT_FOUND') throw err;
    }
    return require('btch-downloader');
}

const isImageUrl = u => /\.(jpe?g|png|webp)(\?|$)/i.test(u);

module.exports = { getCtx, getMedia, deepUrls, isImageUrl, getDownloader };
