'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const { deepUrls } = require('../lib/mediaTools');

const first = v => (Array.isArray(v) ? v[0] : v);

cmd({
    pattern: 'tiktok',
    name: 'tiktok',
    description: 'Download TikTok video (add "audio" for sound only)',
    category: 'downloaders',
    aliases: ['tt', 'ttdl'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    const link = args[0];
    const wantAudio = (args[1] || '').toLowerCase() === 'audio';
    if (!/tiktok\.com|vm\.tiktok|vt\.tiktok/i.test(link || '')) {
        return m.reply(box('TIKTOK', [
            `❌ ${global.BOT_PREFIX}tiktok <video link>`,
            `❌ ${global.BOT_PREFIX}tiktok <video link> audio`
        ]));
    }

    let lib;
    try { lib = require('btch-downloader'); } catch {
        return m.reply(box('TIKTOK', ['❌ Run: npm install btch-downloader']));
    }

    try {
        await m.reply(box('TIKTOK', ['⏳ Downloading...']));
        const res = await lib.ttdl(link);

        if (wantAudio) {
            const audio = first(res?.audio);
            if (!audio) throw new Error('no audio found for this video');
            return await sock.sendMessage(m.from, { audio: { url: audio }, mimetype: 'audio/mpeg' });
        }

        const video = first(res?.video) || res?.url || deepUrls(res).find(u => /\.mp4|video/i.test(u)) || deepUrls(res)[0];
        if (!video) throw new Error('no video found (private or invalid link)');

        await sock.sendMessage(m.from, {
            video: { url: video },
            caption: box('TIKTOK', [res?.title ? `🎬 ${String(res.title).slice(0, 120)}` : '✅ Download complete'])
        });
    } catch (err) {
        await m.reply(box('TIKTOK', [`❌ Failed: ${err.message}`]));
    }
});
