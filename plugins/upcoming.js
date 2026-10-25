'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const espn = require('../lib/espn');

cmd({
    pattern: 'upcoming',
    name: 'upcoming',
    description: 'Next 7 days of fixtures for a league',
    category: 'football',
    aliases: ['nextmatches'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    const league = espn.resolveLeague(args[0]);
    if (!league) return m.reply(box('UPCOMING', [`❌ Unknown league. Use ${global.BOT_PREFIX}leagues`]));

    try {
        const from = new Date();
        const to = new Date(Date.now() + 7 * 86400000);
        const data = await espn.scoreboard(league.code, `${espn.ymd(from)}-${espn.ymd(to)}`);
        const events = (data.events || [])
            .filter(e => e.status?.type?.state === 'pre')
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, 15);

        if (!events.length) return m.reply(box(league.name.toUpperCase(), ['📭 No fixtures in the next 7 days.']));
        await m.reply(box(`${league.name.toUpperCase()} • NEXT`, events.map(espn.line)));
    } catch (err) {
        await m.reply(box('UPCOMING', [`❌ Failed: ${err.message}`]));
    }
});
