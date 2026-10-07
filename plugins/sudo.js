'use strict';

const { cmd } = require('../arslan');
const { box, goOnline, getTargets } = require('../lib/groupTools');
const admin = require('../lib/adminState');

cmd({
    pattern: 'sudo',
    name: 'sudo',
    description: 'Manage sudo users (add / del / list)',
    aliases: ['addsudo'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);
    // Sudo users can't manage sudo — real owner/dev only
    if (!(m.isOwner || m.isDev) || (m.isSudo && !m.isDev)) {
        return m.reply(box('OWNER ONLY', ['❌ Only the owner can manage sudo.']));
    }

    const action = (args[0] || '').toLowerCase();
    const list = admin.state.sudo;

    if (action === 'list') {
        return sock.sendMessage(m.from, {
            text: box('SUDO USERS', list.length ? list.map((n, i) => `${i + 1}. @${n}`) : ['📭 No sudo users']),
            mentions: list.map(n => n + '@s.whatsapp.net')
        });
    }

    if (action !== 'add' && action !== 'del') {
        return m.reply(box('SUDO', [
            `❌ ${global.BOT_PREFIX}sudo add @user`,
            `❌ ${global.BOT_PREFIX}sudo del @user`,
            `❌ ${global.BOT_PREFIX}sudo list`
        ]));
    }

    const targets = getTargets(m, args.slice(1));
    if (!targets.length) {
        return m.reply(box('SUDO', ['❌ Tag, reply, or type the number.']));
    }

    const lines = [];
    for (const jid of targets) {
        const n = admin.num(jid);
        if (action === 'add') {
            if (list.includes(n)) lines.push(`ℹ️ @${n} already sudo`);
            else { list.push(n); lines.push(`✅ @${n} added as sudo`); }
        } else {
            const i = list.indexOf(n);
            if (i === -1) lines.push(`ℹ️ @${n} is not sudo`);
            else { list.splice(i, 1); lines.push(`🗑️ @${n} removed from sudo`); }
        }
    }
    admin.save();
    await sock.sendMessage(m.from, { text: box('SUDO', lines), mentions: targets });
});
