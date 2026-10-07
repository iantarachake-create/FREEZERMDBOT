'use strict';

const { cmd } = require('../arslan');
const { box, num, guard } = require('../lib/groupTools');

cmd({
    pattern: 'tagall',
    name: 'tagall',
    description: 'Mention every group member',
    aliases: ['everyone', 'all'],
    filename: __filename
}, async (sock, m, args) => {
    const meta = await guard(sock, m, { needBotAdmin: false });
    if (!meta) return;

    const note = args.join(' ') || 'No message';
    const ids = meta.participants.map(p => p.id);

    const lines = [
        `📢 Message : ${note}`,
        `👥 Members : ${ids.length}`,
        '',
        ...ids.map(id => `🔹 @${num(id)}`)
    ];

    await sock.sendMessage(m.from, { text: box('TAG ALL', lines), mentions: ids });
});
