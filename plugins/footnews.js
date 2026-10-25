'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const espn = require('../lib/espn');

cmd({
    pattern: 'footnews',
    name: 'footnews',
    description: 'Latest football headlines',
    category: 'football',
    aliases: ['fnews', 'footballnews'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    const league = espn.resolveLeague(args[0]);
    if (!league) return m.reply(box('FOOTBALL NEWS', [`❌ Unknown league. Use ${global.BOT_PREFIX}leagues`]));

    try {
        const data = await espn.news(league.code);
        const articles = (data.articles || []).slice(0, 6);
        if (!articles.length) return m.reply(box('FOOTBALL NEWS', ['📭 No news right now.']));

        const lines = [];
        articles.forEach((a, i) => {
            lines.push(`${i + 1}. 📰 ${a.headline}`);
            const link = a.links?.web?.href;
            if (link) lines.push(`   🔗 ${link}`);
            lines.push('');
        });
        lines.pop();
        await m.reply(box(`${league.name.toUpperCase()} • NEWS`, lines));
    } catch (err) {
        await m.reply(box('FOOTBALL NEWS', [`❌ Failed: ${err.message}`]));
    }
});
