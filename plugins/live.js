'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const espn = require('../lib/espn');

cmd({
    pattern: 'live',
    name: 'live',
    description: 'Live football scores across top leagues',
    category: 'football',
    aliases: ['livescores', 'livenow'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    const one = args[0] ? espn.resolveLeague(args[0]) : null;
    if (args[0] && !one) return m.reply(box('LIVE', [`❌ Unknown league. Use ${global.BOT_PREFIX}leagues`]));
    const targets = one ? [one] : espn.LIVE_LEAGUES.map(k => ({ key: k, ...espn.LEAGUES[k] }));

    try {
        const results = await Promise.allSettled(targets.map(l => espn.scoreboard(l.code)));
        const lines = [];
        let anyLive = false;

        results.forEach((r, i) => {
            if (r.status !== 'fulfilled') return;
            const live = (r.value.events || []).filter(e => e.status?.type?.state === 'in');
            if (!live.length) return;
            anyLive = true;
            lines.push(`🏆 ${targets[i].name}`);
            live.forEach(e => lines.push(espn.line(e)));
            lines.push('');
        });

        if (!anyLive) {
            return m.reply(box('LIVE SCORES', ['😴 No live matches right now.', `📅 Try ${global.BOT_PREFIX}matches or ${global.BOT_PREFIX}upcoming`]));
        }
        lines.pop();
        await m.reply(box('LIVE SCORES', lines));
    } catch (err) {
        await m.reply(box('LIVE SCORES', [`❌ Failed: ${err.message}`]));
    }
});
