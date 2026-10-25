'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const espn = require('../lib/espn');

const stat = (entry, name) => {
    const s = (entry.stats || []).find(x => x.name === name || x.abbreviation === name);
    return s ? (s.displayValue ?? s.value) : '-';
};

cmd({
    pattern: 'table',
    name: 'table',
    description: 'League table / standings',
    category: 'football',
    aliases: ['pointstable'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    const league = espn.resolveLeague(args[0]);
    if (!league) return m.reply(box('TABLE', [`❌ Unknown league. Use ${global.BOT_PREFIX}leagues`]));

    try {
        const data = await espn.standings(league.code);
        const groups = data.children || [];
        if (!groups.length) throw new Error('no table available for this competition');

        const lines = [];
        for (const g of groups.slice(0, 4)) {
            if (groups.length > 1) lines.push(`📌 ${g.name}`);
            const entries = [...(g.standings?.entries || [])]
                .sort((a, b) => Number(stat(a, 'rank')) - Number(stat(b, 'rank')) || Number(stat(b, 'points')) - Number(stat(a, 'points')));

            lines.push('#  Team            P  W  D  L  GD  Pts');
            entries.forEach((e, i) => {
                const name = (e.team?.shortDisplayName || e.team?.displayName || '?').slice(0, 14).padEnd(14);
                const row = [stat(e, 'gamesPlayed'), stat(e, 'wins'), stat(e, 'ties'), stat(e, 'losses')]
                    .map(v => String(v).padStart(2)).join(' ');
                const gd = String(stat(e, 'pointDifferential')).padStart(3);
                const pts = String(stat(e, 'points')).padStart(3);
                lines.push(`${String(stat(e, 'rank') === '-' ? i + 1 : stat(e, 'rank')).padStart(2)} ${name} ${row} ${gd} ${pts}`);
            });
            lines.push('');
        }
        lines.pop();
        await m.reply(box(`${league.name.toUpperCase()} • TABLE`, lines));
    } catch (err) {
        await m.reply(box('TABLE', [`❌ Failed: ${err.message}`]));
    }
});
