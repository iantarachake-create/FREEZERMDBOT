'use strict';

const { cmd } = require('../arslan');

cmd({
    pattern: 'antidelete',
    name: 'antidelete',
    aliases: ['ad', 'antidel'],
    category: 'Admin',
    description: 'Configure Freezer-MD Anti-Delete protection',
    filename: __filename
}, async (sock, m, args) => {

    if (!m.isOwner) return;

    const input = (args[0] || '').toLowerCase();

    const prefix = global.BOT_PREFIX || '.';

    // ─────────────────────────────────────────────
    // DASHBOARD
    // ─────────────────────────────────────────────

    if (!['inchat', 'indm', 'false'].includes(input)) {

        const current =
            global.antidelete === 'false'
                ? '🔴 Disabled'
                : `🟢 Active (${global.antidelete})`;

        return m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗡𝗧𝗜-𝗗𝗘𝗟𝗘𝗧𝗘* ◈',
                '┃',
                `┃│ 🛡️ Status : ${current}`,
                '┃',
                '┃│ ⚙️ *AVAILABLE MODES*',
                '┃│',
                `┃│ ❄️ ${prefix}antidelete inchat`,
                '┃│ └─ Recover deleted messages in chat',
                '┃│',
                `┃│ ❄️ ${prefix}antidelete indm`,
                '┃│ └─ Send recovered messages to DM',
                '┃│',
                `┃│ ❄️ ${prefix}antidelete false`,
                '┃│ └─ Disable protection',
                '┃',
                '┗▣'
            ].join('\n')
        );
    }

    // ─────────────────────────────────────────────
    // UPDATE SETTING
    // ─────────────────────────────────────────────

    global.antidelete = input;

    await m.react(
        input === 'false'
            ? '❌'
            : '🛡️'
    );

    // ─────────────────────────────────────────────
    // SUCCESS RESPONSE
    // ─────────────────────────────────────────────

    const status =
        input === 'false'
            ? '🔴 Disabled'
            : `🟢 Enabled (${input})`;

    return m.reply(
        [
            '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗡𝗧𝗜-𝗗𝗘𝗟𝗘𝗧𝗘* ◈',
            '┃',
            `┃│ 🛡️ Status : ${status}`,
            '┃│ ⚙️ Engine : Operational',
            '┃',
            '┃│ 🟢 Settings Applied',
            '┃│',
            '┗▣'
        ].join('\n')
    );
});
