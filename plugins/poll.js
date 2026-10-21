const { cmd } = require('../arslan');
const { makeBox } = require('../freezer-ui');

const box = makeBox('Poll Center');

cmd({
    pattern: 'poll',
    name: 'poll',
    category: 'Group',
    aliases: ['createpoll', 'vote'],
    description: 'Create a WhatsApp poll',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';
    let raw = (args || []).join(' ').trim();

    // "-m" at the start lets people pick more than one option
    let multi = false;
    if (/^-m\s/i.test(raw)) { multi = true; raw = raw.replace(/^-m\s+/i, ''); }

    const parts = raw.split('|').map(s => s.trim()).filter(Boolean);
    const question = parts.shift();
    const options = [...new Set(parts)];

    if (!question || options.length < 2) {
        return m.reply(box(
            '📊 *𝗖𝗥𝗘𝗔𝗧𝗘 𝗣𝗢𝗟𝗟*',
            `➤ ${prefix}poll Question | Option 1 | Option 2`,
            `➤ ${prefix}poll -m Question | A | B | C  (multi choice)`,
            '',
            '➤ 2 to 12 options.'
        ));
    }
    if (options.length > 12) {
        return m.reply(box('❌ *𝗧𝗢𝗢 𝗠𝗔𝗡𝗬 𝗢𝗣𝗧𝗜𝗢𝗡𝗦*', '➤ Maximum is 12 options.'));
    }

    try {
        await sock.sendMessage(m.from, {
            poll: {
                name: question.slice(0, 255),
                values: options.map(o => o.slice(0, 100)),
                selectableCount: multi ? options.length : 1
            }
        });
    } catch (err) {
        console.error('[POLL] Error:', err.message);
        await m.reply(box('❌ *𝗣𝗢𝗟𝗟 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
