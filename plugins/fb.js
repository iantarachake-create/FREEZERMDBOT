'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const { deepUrls } = require('../lib/mediaTools');

cmd({
    pattern: 'facebook',
    name: 'facebook',
    description: 'Download a Facebook video',
    category: 'downloaders',
    aliases: ['fb', 'fbdl'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    const link = args[0];
    if (!/facebook\.com|fb\.watch|fb\.com/i.test(link || '')) {
        return m.reply(box('FACEBOOK', [`❌ Usage: ${global.BOT_PREFIX}facebook <video link>`]));
    }

    let lib;
    try { lib = require('btch-downloader'); } catch {
        return m.reply(box('FACEBOOK', ['❌ Run: npm install btch-downloader']));
    }

    try {
        await m.reply(box('FACEBOOK', ['⏳ Downloading...']));
        const res = await lib.fbdown(link);
        const url = res?.HD || res?.Normal_video || deepUrls(res)[0];
        if (!url) throw new Error('no video found (private or invalid link)');

        await sock.sendMessage(m.from, { video: { url }, caption: box('FACEBOOK', ['✅ Download complete']) });
    } catch (err) {
        await m.reply(box('FACEBOOK', [`❌ Failed: ${err.message}`]));
    }
});
