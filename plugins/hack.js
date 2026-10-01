'use strict';

const { cmd } = require('../arslan');

const sleep = ms =>
    new Promise(resolve => setTimeout(resolve, ms));

cmd({
    pattern: 'hack',
    name: 'hack',
    category: 'Fun',
    description: 'Fake hacking simulation',
    aliases: ['hacker', 'hackprank'],
    filename: __filename
}, async (sock, m) => {

    try {

        const target =
            m.quoted?.sender ||
            m.mentionedJid?.[0] ||
            m.sender;

        const number =
            target.split('@')[0];

        // Initial message
        const sent = await m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗛𝗔𝗖𝗞* ◈',
                '┃',
                '┃│ 🎯 Target : +' + number,
                '┃│',
                '┃│ 🔐 Initializing...',
                '┃',
                '┗▣'
            ].join('\n')
        );

        const edit = async text => {
            try {
                await sock.sendMessage(
                    m.from,
                    {
                        text,
                        edit: sent.key
                    }
                );
            } catch {
                await m.reply(text);
            }
        };

        const loading = [
            '▰□□□□□□□□□ 10%',
            '▰▰□□□□□□□□ 20%',
            '▰▰▰□□□□□□□ 30%',
            '▰▰▰▰□□□□□□ 40%',
            '▰▰▰▰▰□□□□□ 50%',
            '▰▰▰▰▰▰□□□□ 60%',
            '▰▰▰▰▰▰▰□□□ 70%',
            '▰▰▰▰▰▰▰▰□□ 80%',
            '▰▰▰▰▰▰▰▰▰□ 90%',
            '▰▰▰▰▰▰▰▰▰▰ 100%'
        ];

        for (const bar of loading) {

            await edit(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗛𝗔𝗖𝗞* ◈',
                    '┃',
                    `┃│ 🎯 Target : +${number}`,
                    '┃│',
                    '┃│ 🔐 Connecting...',
                    `┃│ ${bar}`,
                    '┃',
                    '┗▣'
                ].join('\n')
            );

            await sleep(350);
        }

        const steps = [
            '🔎 Scanning target...',
            '🛰️ Establishing secure connection...',
            '🔓 Bypassing firewall...',
            '📡 Accessing encrypted system...',
            '💻 Injecting FREEZER protocol...',
            '🧬 Decrypting data...',
            '⚡ Finalizing operation...'
        ];

        for (const step of steps) {

            await edit(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗛𝗔𝗖𝗞* ◈',
                    '┃',
                    `┃│ 🎯 Target : +${number}`,
                    '┃│',
                    `┃│ ${step}`,
                    '┃│ ⏳ Please wait...',
                    '┃',
                    '┗▣'
                ].join('\n')
            );

            await sleep(600);
        }

        await edit(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗛𝗔𝗖𝗞* ◈',
                '┃',
                '┃│ ⚡ *SIMULATION COMPLETE*',
                '┃│',
                `┃│ 🎯 Target : +${number}`,
                '┃│ 🔐 Security : Bypassed',
                '┃│ 📡 Connection : Established',
                '┃│ 💾 Data : Encrypted',
                '┃│',
                '┃│ 😂 Just kidding!',
                '┃│ ❄️ This was a fake hacking prank.',
                '┃',
                '┗▣'
            ].join('\n')
        );

    } catch (err) {

        console.error('[FREEZER-MD] Hack Error:', err);

        await m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗* ◈',
                '┃',
                '┃│ ❌ Simulation Error',
                `┃│ ${err?.message || 'Something went wrong.'}`,
                '┃',
                '┗▣'
            ].join('\n')
        );
    }
});
