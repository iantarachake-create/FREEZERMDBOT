'use strict';

const { cmd } = require('../arslan');
const { box, num, getTargets, guard } = require('../lib/groupTools');

cmd({
    pattern: 'demote',
    name: 'demote',
    description: 'Remove admin rights from a member',
    aliases: ['unadmin'],
    filename: __filename
}, async (sock, m, args) => {
    const meta = await guard(sock, m);
    if (!meta) return;

    const targets = getTargets(m, args);
    if (!targets.length) {
        return m.reply(box('DEMOTE', ['❌ Tag or reply to the user to demote.']));
    }

    try {
        await sock.groupParticipantsUpdate(m.from, targets, 'demote');
        await sock.sendMessage(m.from, {
            text: box('DEMOTE', targets.map(j => `⬇️ @${num(j)} is no longer an admin`)),
            mentions: targets
        });
    } catch (err) {
        await m.reply(box('DEMOTE', [`❌ Failed: ${err.message}`]));
    }
});
