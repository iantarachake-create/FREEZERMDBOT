'use strict';

const { cmd } = require('../arslan');
const { box } = require('../lib/groupTools');

cmd({
    pattern: 'tagme',
    name: 'tagme',
    category: 'Group',
    description: 'The bot tags you',
    aliases: ['mention', 'metag'],
    filename: __filename
}, async (sock, m, args) => {
    const jid = String(m.sender || '').replace(/:\d+@/, '@');
    const n = jid.split('@')[0];
    const note = args.join(' ').trim() || 'You have been tagged ✅';

    await sock.sendMessage(m.from, {
        text: box('TAG ME', [`👋 Hey @${n}`, `💬 ${note}`]),
        mentions: [jid]
    });
});
