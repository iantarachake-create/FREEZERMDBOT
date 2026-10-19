'use strict';

const { cmd } = require('../arslan');
const { box } = require('../lib/groupTools');

cmd({
    pattern: 'poll',
    name: 'poll',
    category: 'Group',
    description: 'Create a poll',
    aliases: ['vote'],
    filename: __filename
}, async (sock, m, args) => {
    const p = global.BOT_PREFIX || '.';
    let multi = false;
    const raw = args.join(' ').replace(/--multi\b/i, () => { multi = true; return ''; }).trim();
    const parts = (raw.includes('|') ? raw.split('|') : raw.split(','))
        .map(s => s.trim()).filter(Boolean);

    if (parts.length < 3) {
        return m.reply(box('POLL', [
            '❌ Need a question and 2+ options.',
            '',
            `★ ${p}poll Best team? | Arsenal | Chelsea | Spurs`,
            `★ ${p}poll Lunch?, Pizza, Burger --multi`,
            '',
            '--multi lets people pick many options'
        ]));
    }

    const name = parts[0].slice(0, 250);
    const values = [...new Set(parts.slice(1).map(v => v.slice(0, 90)))].slice(0, 12);
    if (values.length < 2) return m.reply(box('POLL', ['❌ Give at least 2 different options.']));

    await sock.sendMessage(m.from, {
        poll: { name, values, selectableCount: multi ? values.length : 1 }
    });
});
