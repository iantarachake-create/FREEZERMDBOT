'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const { deepUrls, isImageUrl } = require('../lib/mediaTools');

cmd({
    pattern: 'instagram',
    name: 'instagram',
    description: 'Download Instagram reels/posts',
    category: 'downloaders',
    aliases: ['ig', 'igdl'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    const link = args[0];
    if (!/instagram\.com/i.test(link || '')) {
        return m.reply(box('INSTAGRAM', [`❌ Usage: ${global.BOT_PREFIX}instagram <post/reel link>`]));
    }

    let lib;
    try { lib = require('btch-downloader'); } catch {
        return m.reply(box('INSTAGRAM', ['❌ Run: npm install btch-downloader']));
    }

    try {
        await m.reply(box('INSTAGRAM', ['⏳ Downloading...']));
        const res = await lib.igdl(link);

        // Prefer the "url" field of each item; thumbnails are ignored.
        let urls = (Array.isArray(res) ? res : [res]).map(i => i?.url).filter(u => typeof u === 'string' && u.startsWith('http'));
        if (!urls.length) urls = deepUrls(res);
        urls = [...new Set(urls)].slice(0, 5);
        if (!urls.length) throw new Error('nothing found (private account or invalid link)');

        for (const url of urls) {
            await sock.sendMessage(m.from, isImageUrl(url) ? { image: { url } } : { video: { url } });
        }
    } catch (err) {
        await m.reply(box('INSTAGRAM', [`❌ Failed: ${err.message}`]));
    }
});
