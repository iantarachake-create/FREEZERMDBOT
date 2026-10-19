'use strict';

const { cmd } = require('../arslan');
const { box, guard } = require('../lib/groupTools');

const digits = v => String(v || '').split('@')[0].split(':')[0].replace(/\D/g, '');

// Find a group participant by any of its id forms (phone number or LID)
function findParticipant(meta, n) {
    if (!n) return null;
    return meta.participants.find(p =>
        [p.id, p.lid, p.phoneNumber, p.jid].some(x => x && digits(x) === n)
    ) || null;
}

cmd({
    pattern: 'remove',
    name: 'remove',
    category: 'Group',
    description: 'Remove a member (reply, @mention or number)',
    aliases: ['out'],
    filename: __filename
}, async (sock, m, args) => {
    const meta = await guard(sock, m);
    if (!meta) return;

    const picked = [];
    const add = p => { if (p && !picked.some(x => x.id === p.id)) picked.push(p); };

    if (m.quoted?.key?.participant) add(findParticipant(meta, digits(m.quoted.key.participant)));
    for (const a of args) {
        const n = String(a).replace(/\D/g, ''); // "@2547..." or "+2547..." or plain digits
        if (n.length >= 7) add(findParticipant(meta, n));
    }

    if (!picked.length) {
        const p = global.BOT_PREFIX || '.';
        return m.reply(box('REMOVE', [
            '❌ Reply to the user, @mention them',
            '   or type their number.',
            '',
            `★ ${p}remove @user`,
            `★ ${p}remove 2547XXXXXXXX`
        ]));
    }

    const botNums = [digits(sock.user?.id), digits(sock.user?.lid)].filter(Boolean);
    const lines = [];
    const mentions = [];

    for (const p of picked) {
        const tag = `@${digits(p.id)}`;
        if ([p.id, p.lid, p.phoneNumber].some(x => botNums.includes(digits(x)))) {
            lines.push("🤖 I can't remove myself");
            continue;
        }
        if (p.admin === 'superadmin') {
            lines.push(`👑 ${tag} is the group owner`);
            mentions.push(p.id);
            continue;
        }
        try {
            await sock.groupParticipantsUpdate(m.from, [p.id], 'remove');
            lines.push(`🚪 ${tag} removed`);
        } catch (err) {
            lines.push(`❌ ${tag}: ${err.message}`);
        }
        mentions.push(p.id);
    }

    await sock.sendMessage(m.from, { text: box('REMOVE', lines), mentions });
});
