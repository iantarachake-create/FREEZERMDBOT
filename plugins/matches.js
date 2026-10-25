'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const espn = require('../lib/espn');

cmd({
    pattern: 'matches',
    name: 'matches',
    description: "Today's matches for a league",
    category: 'football',
    aliases: ['todaymatches'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    const league = espn.resolveLeague(args[0]);
    if (!league) return m.reply(box('MATCHES', [`❌ Unknown league. Use ${global.BOT_PREFIX}leagues`]));

    try {
        const data = await espn.scoreboard(league.code);
        const events = data.events || [];
        if (!events.length) return m.reply(box(league.name.toUpperCase(), ['📭 No matches today.']));
        await m.reply(box(league.name.toUpperCase(), events.map(espn.line)));
    } catch (err) {
        await m.reply(box('MATCHES', [`❌ Failed: ${err.message}`]));
    }
});
