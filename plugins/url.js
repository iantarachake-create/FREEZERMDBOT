'use strict';

const axios = require('axios');
const { cmd } = require('../arslan');

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024; // 100 MB

function box(lines) {
    return `┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗨𝗥𝗟* ◈\n┃\n${lines.join('\n')}\n┃\n┗▣`;
}

const EXT_BY_MIME = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    'video/mp4': 'mp4', 'video/3gpp': '3gp', 'video/webm': 'webm',
    'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg', 'audio/ogg; codecs=opus': 'ogg',
    'application/pdf': 'pdf', 'application/zip': 'zip', 'text/plain': 'txt'
};

function extFor(mime) {
    if (!mime) return 'bin';
    const clean = mime.split(';')[0].trim().toLowerCase();
    return EXT_BY_MIME[mime] || EXT_BY_MIME[clean] || clean.split('/')[1]?.replace(/[^a-z0-9]/g, '') || 'bin';
}

// Accepts "example.com/page" or "https://example.com/page"; returns a clean
// http(s) URL string, or null if the input doesn't look like a link.
function normalizeUrl(input) {
    let s = (input || '').trim();
    if (!s || /\s/.test(s)) return null;
    if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    try {
        const u = new URL(s);
        if (!/^https?:$/.test(u.protocol)) return null;
        if (!u.hostname.includes('.')) return null;
        return u.toString();
    } catch {
        return null;
    }
}

// Shorten with TinyURL, falling back to is.gd.
async function shorten(url) {
    try {
        const r = await axios.get('https://tinyurl.com/api-create.php', {
            params: { url },
            timeout: 15000,
            responseType: 'text'
        });
        const out = String(r.data || '').trim();
        if (/^https?:\/\//i.test(out)) return out;
    } catch {}

    const r = await axios.get('https://is.gd/create.php', {
        params: { format: 'simple', url },
        timeout: 15000,
        responseType: 'text'
    });
    const out = String(r.data || '').trim();
    if (/^https?:\/\//i.test(out)) return out;
    throw new Error(out || 'Shortener returned no link');
}

// Upload a buffer to Catbox and return the hosted link.
async function uploadToCatbox(buffer, filename, mime) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', new Blob([buffer], { type: mime || 'application/octet-stream' }), filename);

    const res = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(60000)
    });
    const out = (await res.text()).trim();
    if (!res.ok || !/^https?:\/\//i.test(out)) {
        throw new Error(out.slice(0, 120) || `Upload failed (${res.status})`);
    }
    return out;
}

cmd({
    pattern: 'url',
    name: 'url',
    category: 'Tools',
    description: 'Shorten a link, or reply to media to get a link for it',
    aliases: ['shorten'],
    react: '🔗',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';

    try {
        const input = args.join(' ').trim();

        // 1) Media (sent with caption, or replied to) -> upload and return link
        const hasMedia = (m.isMedia && m.mediaType !== 'sticker') || (m.quoted?.isMedia);
        if (!input && hasMedia) {
            const mime = m.isMedia ? m.mimetype : m.quoted.mimetype;
            await m.reply(box(['┃│ ⏳ Uploading...']));

            const buffer = await m.download();
            if (!buffer || !buffer.length) {
                return m.reply(box(['┃│ ❌ Could not download that media.']));
            }
            if (buffer.length > MAX_UPLOAD_BYTES) {
                return m.reply(box(['┃│ ❌ File too large (max 100 MB).']));
            }

            const link = await uploadToCatbox(buffer, `freezer-${Date.now()}.${extFor(mime)}`, mime);
            const mb = (buffer.length / 1024 / 1024).toFixed(2);
            return m.reply(box([
                '┃│ ✅ Uploaded',
                '┃│',
                `┃│ 🔗 ${link}`,
                `┃│ 📦 ${mb} MB`
            ]));
        }

        // 2) Text link (typed, or in a replied message) -> shorten
        const source = input || m.quoted?.body || '';
        if (!source) {
            return m.reply(box([
                '┃│ 🔗 URL Tool',
                '┃│',
                '┃│ Shorten a link:',
                `┃│ ★ ${prefix}url https://example.com/long/link`,
                '┃│',
                '┃│ Get a link for media:',
                `┃│ ★ Reply to an image/video/audio/file with ${prefix}url`
            ]));
        }

        const target = normalizeUrl(source.split(/\s+/).find(w => normalizeUrl(w)) || source);
        if (!target) {
            return m.reply(box([
                '┃│ ❌ That does not look like a valid link.',
                `┃│ ★ ${prefix}url https://example.com`
            ]));
        }

        const short = await shorten(target);
        return m.reply(box([
            '┃│ ✅ Link shortened',
            '┃│',
            `┃│ 🔗 ${short}`,
            `┃│ 📏 ${target.length} → ${short.length} chars`
        ]));

    } catch (err) {
        console.error('URL error:', err.message);
        return m.reply(box(['┃│ ❌ Failed. Try again later.']));
    }
});
