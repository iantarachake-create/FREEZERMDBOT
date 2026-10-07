'use strict';

const { cmd } = require('../arslan');
const { box, num, goOnline, getTargets } = require('../lib/groupTools');

cmd({
    pattern: 'getpp',
    name: 'getpp',
    description: "Get someone's profile picture",
    aliases: ['pp', 'getdp'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    // @mention / reply / number → that user. Otherwise: yourself.
    const targets = getTargets(m, args);
    const jid = targets[0] || m.sender;

    try {
        const url = await sock.profilePictureUrl(jid, 'image');
        await sock.sendMessage(m.from, {
            image: { url },
            caption: box('GET PP', [`👤 User : @${num(jid)}`]),
            mentions: [jid]
        });
    } catch {
        await m.reply(box('GET PP', ['❌ No profile picture (or it is private)']));
    }
});
