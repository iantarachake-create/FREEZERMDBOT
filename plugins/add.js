'use strict';

const { cmd } = require('../arslan');
const { box, num, getTargets, guard } = require('../lib/groupTools');

cmd({
    pattern: 'add',
    name: 'add',
    description: 'Add a member to the group',
    aliases: ['invite'],
    filename: __filename
}, async (sock, m, args) => {
    const meta = await guard(sock, m);
    if (!meta) return;

    const targets = getTargets(m, args);
    if (!targets.length) {
        return m.reply(box('ADD', ['❌ Usage: .add 2547xxxxxxxx']));
    }

    const results = [];
    for (const jid of targets) {
        try {
            const res = await sock.groupParticipantsUpdate(m.from, [jid], 'add');
            const status = res?.[0]?.status;
            if (status === '200') results.push(`✅ @${num(jid)} added`);
            else if (status === '403') results.push(`📩 @${num(jid)} needs invite (privacy)`);
            else if (status === '409') results.push(`ℹ️ @${num(jid)} already in group`);
            else results.push(`❌ @${num(jid)} failed (${status || 'unknown'})`);
        } catch (err) {
            results.push(`❌ @${num(jid)}: ${err.message}`);
        }
    }

    await sock.sendMessage(m.from, { text: box('ADD MEMBER', results), mentions: targets });
});
