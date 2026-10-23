'use strict';

const { cmd } = require('../arslan');
const { makeBox, quotedText } = require('../lib/freezer-ui');

const box = makeBox('Fun Zone');
const MAX_OPTIONS = 20;

// "a | b | c"  or  "a or b or c"  or  "a, b, c"
function parseOptions(text) {
    let parts;
    if (text.includes('|')) parts = text.split('|');
    else if (/\sor\s/i.test(text)) parts = text.split(/\s+or\s+/i);
    else parts = text.split(',');
    const seen = new Set();
    return parts.map(s => s.trim()).filter(s => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()));
}

cmd({
    pattern: 'choose',
    name: 'choose',
    category: 'Fun',
    aliases: ['pick', 'decide', 'either'],
    description: 'Let the bot pick one option for you',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';
    const text = (args || []).join(' ').trim() || quotedText(m);
    const options = parseOptions(text);

    if (options.length < 2) {
        return m.reply(box(
            '🧭 *𝗖𝗛𝗢𝗢𝗦𝗘*',
            '➤ Give me at least 2 options.',
            '',
            `➤ ${prefix}choose pizza | burger | rice`,
            `➤ ${prefix}choose stay home or go out`,
            `➤ ${prefix}choose red, blue, green`
        ));
    }
    if (options.length > MAX_OPTIONS) {
        return m.reply(box('❌ *𝗧𝗢𝗢 𝗠𝗔𝗡𝗬*', `➤ Maximum ${MAX_OPTIONS} options.`));
    }

    const winner = options[Math.floor(Math.random() * options.length)];
    await m.reply(box(
        '🧭 *𝗖𝗛𝗢𝗢𝗦𝗘*',
        ...options.map((o, i) => `${i + 1}. ${o.slice(0, 50)}`),
        '',
        `➤ 🎯 I pick: *${winner.slice(0, 60)}*`
    ));
});
