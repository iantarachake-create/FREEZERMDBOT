'use strict';

const { cmd } = require('../arslan');
const { box } = require('../lib/groupTools');

const EXT = {
    'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
    'video/mp4': 'mp4', 'video/3gpp': '3gp', 'video/webm': 'webm',
    'audio/mpeg': 'mp3', 'audio/mp4': 'm4a', 'audio/ogg': 'ogg', 'audio/ogg; codecs=opus': 'ogg',
    'application/pdf': 'pdf', 'application/zip': 'zip', 'text/plain': 'txt'
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36';

const hosts = [
    {
        name: 'Catbox (permanent)',
        async upload(blob, file) {
            const f = new FormData();
            f.append('reqtype', 'fileupload');
            f.append('fileToUpload', blob, file);
            const r = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: f, headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(90000) });
            const t = (await r.text()).trim();
            return /^https?:\/\//.test(t) ? t : null;
        }
    },
    {
        name: 'Uguu (expires in 3h)',
        async upload(blob, file) {
            const f = new FormData();
            f.append('files[]', blob, file);
            const r = await fetch('https://uguu.se/upload', { method: 'POST', body: f, headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(90000) });
            const j = await r.json();
            return j?.files?.[0]?.url || null;
        }
    },
    {
        name: '0x0.st (temporary)',
        async upload(blob, file) {
            const f = new FormData();
            f.append('file', blob, file);
            const r = await fetch('https://0x0.st', { method: 'POST', body: f, headers: { 'User-Agent': 'FreezerMD/1.0' }, signal: AbortSignal.timeout(90000) });
            const t = (await r.text()).trim();
            return /^https?:\/\//.test(t) ? t : null;
        }
    }
];

cmd({
    pattern: 'tourl',
    name: 'tourl',
    category: 'Tools',
    description: 'Upload media and get a link',
    aliases: ['upload', 'tolink', 'geturl'],
    filename: __filename
}, async (sock, m) => {
    const p = global.BOT_PREFIX || '.';
    const isMedia = m.isMedia || m.quoted?.isMedia;

    if (!isMedia) {
        return m.reply(box('TO URL', [
            '🔗 Turn media into a link',
            '',
            '★ Reply to an image, video, audio,',
            `   sticker or file with ${p}tourl`
        ]));
    }

    await m.react('⌛').catch(() => {});

    try {
        const buffer = await m.download();
        if (!buffer) throw new Error('Could not download the media');
        if (buffer.length > 100 * 1024 * 1024) throw new Error('File is larger than 100 MB');

        const mime = (m.isMedia ? m.mimetype : m.quoted?.mimetype) || 'application/octet-stream';
        const docName = (m.isMedia ? m.message : m.quoted?.message)?.documentMessage?.fileName;
        const ext = (docName && docName.includes('.') ? docName.split('.').pop() : EXT[mime] || EXT[mime.split(';')[0]] || 'bin');
        const file = docName || `freezer-${Date.now()}.${ext}`;
        const blob = new Blob([buffer], { type: mime });

        let url = null;
        let used = '';
        for (const h of hosts) {
            try {
                url = await h.upload(blob, file);
                if (url) { used = h.name; break; }
            } catch (e) {
                console.error(`[FREEZER-MD] tourl ${h.name}:`, e.message);
            }
        }

        if (!url) throw new Error('All upload hosts failed, try again later');

        await m.reply(box('TO URL', [
            `📦 Size : ${(buffer.length / 1024).toFixed(1)} KB`,
            `🌐 Host : ${used}`,
            '',
            `🔗 ${url}`
        ]));
        await m.react('✅').catch(() => {});
    } catch (err) {
        console.error('[FREEZER-MD] tourl error:', err);
        await m.react('❌').catch(() => {});
        await m.reply(box('TO URL', [`❌ Failed: ${err.message}`]));
    }
});
