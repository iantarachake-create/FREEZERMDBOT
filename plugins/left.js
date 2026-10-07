'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');

cmd({
    pattern: 'left',
    name: 'left',
    description: 'Make the bot leave the group',
    aliases: ['leave'],
    filename: __filename
}, async (sock, m) => {
    await goOnline(sock, m);

    if (!m.isGroup) {
        return m.reply(box('GROUP ONLY', ['❌ Use this inside a group.']));
    }
    if (!(m.isOwner || m.isDev)) {
        return m.reply(box('OWNER ONLY', ['❌ Only the owner can use this.']));
    }

    await m.reply(box('LEFT', ['👋 Goodbye everyone!']));
    try {
        await sock.groupLeave(m.from);
    } catch (err) {
        await m.reply(box('LEFT', [`❌ Failed: ${err.message}`]));
    }
});
