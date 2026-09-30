'use strict';

const { cmd } = require('../arslan');

cmd({
    pattern: 'uptime',
    name: 'uptime',
    description: 'Show bot uptime',
    aliases: ['up'],
    filename: __filename
}, async (sock, m) => {

    const up = Math.floor(process.uptime());

    const d = Math.floor(up / 86400);
    const h = Math.floor((up % 86400) / 3600);
    const min = Math.floor((up % 3600) / 60);
    const s = up % 60;

    const uptime = [
        d && `${d}d`,
        h && `${h}h`,
        min && `${min}m`,
        `${s}s`
    ].filter(Boolean).join(' ');

    const text = [
        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗* ◈',
        '┃',
        `┃│ 🟢 Status  : Online`,
        `┃│ ⚡ Uptime  : ${uptime}`,
        '┃',
        '┗▣'
    ].join('\n');

    await m.reply(text);
});
