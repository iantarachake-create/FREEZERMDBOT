'use strict';

const { cmd } = require('../arslan');
const { box, num, getTargets, guard } = require('../lib/groupTools');

cmd({
    pattern: 'kick',
    name: 'kick',
    description: 'Remove a member from the group',
    aliases: ['remove'],
    filename: __filename
}, async (sock, m, args) => {
    const meta = await guard(sock, m);
    if (!meta) return;

    const targets = getTargets(m, args);
    if (!targets.length) {
        return m.reply(box('KICK', ['❌ Tag or reply to the user to remove.']));
    }

    const botNum = num(sock.user?.id);
    const done = [];
    for (const jid of targets) {
        if (num(jid) === botNum) { done.push("🤖 I can't kick myself"); continue; }
        const p = meta.participants.find(x => num(x.id) === num(jid) || num(x.phoneNumber) === num(jid));
        if (p?.admin === 'superadmin') { done.push(`👑 @${num(jid)} is the group owner`); continue; }
        try {
            await sock.groupParticipantsUpdate(m.from, [p?.id || jid], 'remove');
            done.push(`🚪 @${num(jid)} removed`);
        } catch (err) {
            done.push(`❌ @${num(jid)}: ${err.message}`);
        }
    }

    await sock.sendMessage(m.from, { text: box('KICK', done), mentions: targets });
});
