'use strict';

const { cmd } = require('../arslan');
const { box, num, getTargets, guard } = require('../lib/groupTools');

cmd({
    pattern: 'promote',
    name: 'promote',
    description: 'Make a member an admin',
    aliases: ['admin'],
    filename: __filename
}, async (sock, m, args) => {
    const meta = await guard(sock, m);
    if (!meta) return;

    const targets = getTargets(m, args);
    if (!targets.length) {
        return m.reply(box('PROMOTE', ['❌ Tag or reply to the user to promote.']));
    }

    try {
        await sock.groupParticipantsUpdate(m.from, targets, 'promote');
        await sock.sendMessage(m.from, {
            text: box('PROMOTE', targets.map(j => `⬆️ @${num(j)} is now an admin`)),
            mentions: targets
        });
    } catch (err) {
        await m.reply(box('PROMOTE', [`❌ Failed: ${err.message}`]));
    }
});
