'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const espn = require('../lib/espn');

cmd({
    pattern: 'results',
    name: 'results',
    description: 'Latest results (last 7 days) for a league',
    category: 'football',
    aliases: ['lastresults', 'ft'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    const league = espn.resolveLeague(args[0]);
    if (!league) return m.reply(box('RESULTS', [`❌ Unknown league. Use ${global.BOT_PREFIX}leagues`]));

    try {
        const from = new Date(Date.now() - 7 * 86400000);
        const data = await espn.scoreboard(league.code, `${espn.ymd(from)}-${espn.ymd(new Date())}`);
        const events = (data.events || [])
            .filter(e => e.status?.type?.state === 'post')
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 15);

        if (!events.length) return m.reply(box(league.name.toUpperCase(), ['📭 No finished matches in the last 7 days.']));
        await m.reply(box(`${league.name.toUpperCase()} • RESULTS`, events.map(espn.line)));
    } catch (err) {
        await m.reply(box('RESULTS', [`❌ Failed: ${err.message}`]));
    }
});
