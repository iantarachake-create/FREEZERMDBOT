'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');

cmd({
    pattern: 'ytsearch',
    name: 'ytsearch',
    description: 'Search YouTube videos',
    category: 'downloaders',
    aliases: ['yts'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    const query = args.join(' ');
    if (!query) return m.reply(box('YT SEARCH', [`❌ Usage: ${global.BOT_PREFIX}ytsearch afrobeat mix`]));

    let yts;
    try { yts = require('yt-search'); } catch {
        return m.reply(box('YT SEARCH', ['❌ Run: npm install yt-search']));
    }

    try {
        const { videos } = await yts(query);
        if (!videos?.length) return m.reply(box('YT SEARCH', ['❌ No results.']));

        const lines = [];
        videos.slice(0, 8).forEach((v, i) => {
            lines.push(`${i + 1}. 🎬 ${v.title}`);
            lines.push(`   ⏱️ ${v.timestamp} | 👁️ ${v.views.toLocaleString()} | 👤 ${v.author?.name}`);
            lines.push(`   🔗 ${v.url}`);
            lines.push('');
        });
        lines.pop();

        await m.reply(box('YT SEARCH', lines));
    } catch (err) {
        await m.reply(box('YT SEARCH', [`❌ Failed: ${err.message}`]));
    }
});
