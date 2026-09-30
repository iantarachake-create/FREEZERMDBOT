'use strict';

const { cmd } = require('../arslan');

cmd({
    pattern: 'ping',
    name: 'ping',
    description: 'Check bot response speed',
    aliases: ['p'],
    filename: __filename
}, async (sock, m) => {

    const start = Date.now();

    await m.reply('🏓 Checking...');

    const speed = Date.now() - start;

    const text = [
        '┏▣ ◈ *🏓 PONG* ◈',
        '┃',
        `┃│ ⚡ Speed  : ${speed}ms`,
        '┃│ 🟢 Status : Online',
        '┃│ 🤖 Bot    : Active',
        '┃',
        '┗▣'
    ].join('\n');

    await m.reply(text);
});
