'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');

cmd({
    pattern: 'join',
    name: 'join',
    description: 'Make the bot join a group via invite link',
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    if (!(m.isOwner || m.isDev)) {
        return m.reply(box('OWNER ONLY', ['❌ Only the owner can use this.']));
    }

    const text = args.join(' ') || m.quoted?.text || '';
    const match = text.match(/chat\.whatsapp\.com\/([A-Za-z0-9]{20,24})/);
    if (!match) {
        return m.reply(box('JOIN', ['❌ Usage: .join https://chat.whatsapp.com/xxxx']));
    }

    try {
        const gid = await sock.groupAcceptInvite(match[1]);
        await m.reply(box('JOIN', ['✅ Joined successfully', `🆔 ${gid}`]));
    } catch (err) {
        await m.reply(box('JOIN', [`❌ Failed: ${err.message}`]));
    }
});
