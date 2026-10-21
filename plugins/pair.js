const axios = require('axios');
const { cmd } = require('../arslan');
const { makeBox, digits } = require('../freezer-ui');

const box = makeBox('Pairing Center');
const COOLDOWN = 60 * 1000;
const lastUse = new Map();

/* Set your pairing server in config:  global.pairApi = 'https://your-pair-site/code'
   It is called as  GET <pairApi>?number=<digits>  and must answer with JSON
   containing  code  (or data.code / pairingCode).                              */
cmd({
    pattern: 'pair',
    name: 'pair',
    category: 'Tools',
    aliases: ['paircode', 'getcode'],
    description: 'Get a WhatsApp pairing code for a number',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';
    const number = digits((args || []).join(''));

    if (number.length < 7 || number.length > 15) {
        return m.reply(box(
            '🔗 *𝗣𝗔𝗜𝗥 𝗖𝗢𝗗𝗘*',
            '➤ Enter your number with country code.',
            '',
            `➤ Example: ${prefix}pair 2349012345678`
        ));
    }

    const base = global.pairApi || process.env.PAIR_API;
    if (!base) {
        return m.reply(box('❌ *𝗡𝗢𝗧 𝗖𝗢𝗡𝗙𝗜𝗚𝗨𝗥𝗘𝗗*', '➤ Owner must set global.pairApi first.'));
    }

    const last = lastUse.get(m.sender) || 0;
    if (Date.now() - last < COOLDOWN) {
        const left = Math.ceil((COOLDOWN - (Date.now() - last)) / 1000);
        return m.reply(box('⏳ *𝗣𝗟𝗘𝗔𝗦𝗘 𝗪𝗔𝗜𝗧*', `➤ Try again in ${left}s.`));
    }
    lastUse.set(m.sender, Date.now());

    try {
        await m.react('⌛');
        const { data } = await axios.get(base, { params: { number }, timeout: 60000 });
        const code = data?.code || data?.data?.code || data?.pairingCode || data?.pairing_code;
        if (!code) throw new Error('Pairing server did not return a code');

        await m.reply(box(
            '🔗 *𝗣𝗔𝗜𝗥𝗜𝗡𝗚 𝗖𝗢𝗗𝗘*',
            `➤ Number : ${number}`,
            '➤ Open WhatsApp ▸ Linked devices',
            '➤ Link with phone number, enter the code below',
            '➤ The code expires quickly.'
        ));
        await m.reply(String(code));
        await m.react('✅');
    } catch (err) {
        console.error('[PAIR] Error:', err.message);
        lastUse.delete(m.sender);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗣𝗔𝗜𝗥 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`, '➤ Please try again.'));
    }
});
