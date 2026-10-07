'use strict';

const { cmd } = require('../arslan');
const { box, guard } = require('../lib/groupTools');

cmd({
    pattern: 'gclink',
    name: 'gclink',
    description: 'Get the group invite link',
    aliases: ['link', 'grouplink'],
    filename: __filename
}, async (sock, m) => {
    const meta = await guard(sock, m);
    if (!meta) return;

    try {
        const code = await sock.groupInviteCode(m.from);
        await m.reply(box('GROUP LINK', [
            `📛 Group : ${meta.subject}`,
            `🔗 https://chat.whatsapp.com/${code}`
        ]));
    } catch (err) {
        await m.reply(box('GROUP LINK', [`❌ Failed: ${err.message}`]));
    }
});
