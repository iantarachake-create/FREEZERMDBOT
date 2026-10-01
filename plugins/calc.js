'use strict';

const { cmd } = require('../arslan');

cmd({
    pattern: 'calc',
    name: 'calc',
    category: 'Tools',
    description: 'Calculate mathematical expressions',
    aliases: ['calculate', 'math'],
    filename: __filename
}, async (sock, m, args) => {

    try {

        const expression = args.join(' ').trim();

        if (!expression) {
            return m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗖𝗔𝗟𝗖* ◈',
                    '┃',
                    '┃│ 🧮 *CALCULATOR*',
                    '┃│',
                    '┃│ Usage:',
                    '┃│ ❄️ .calc 25 * 4',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        // Allow only safe mathematical characters
        if (!/^[0-9+\-*/%().\s]+$/.test(expression)) {
            return m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗖𝗔𝗟𝗖* ◈',
                    '┃',
                    '┃│ ❌ *INVALID EXPRESSION*',
                    '┃│',
                    '┃│ Only numbers and:',
                    '┃│ +  -  *  /  %  ( )',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        const result = Function(
            `"use strict"; return (${expression})`
        )();

        if (!Number.isFinite(result)) {
            throw new Error('Invalid calculation result');
        }

        await m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗖𝗔𝗟𝗖* ◈',
                '┃',
                '┃│ 🧮 *CALCULATION*',
                '┃│',
                `┃│ 📌 Expression : ${expression}`,
                '┃│',
                `┃│ ✅ Result : ${result}`,
                '┃',
                '┃│ 🤖 Bot : FREEZER MD BOT',
                '┃',
                '┗▣'
            ].join('\n')
        );

    } catch (error) {

        console.error('[FREEZER-MD] Calc Error:', error);

        await m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗖𝗔𝗟𝗖* ◈',
                '┃',
                '┃│ ❌ *INVALID CALCULATION*',
                '┃│',
                '┃│ Please check your expression.',
                '┃',
                '┗▣'
            ].join('\n')
        );
    }
});
