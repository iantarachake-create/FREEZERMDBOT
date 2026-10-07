'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const admin = require('../lib/adminState');

cmd({
    pattern: 'autobio',
    name: 'autobio',
    description: 'Auto-update the bot About/bio (on / off / custom text)',
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);
    if (!(m.isOwner || m.isDev)) {
        return m.reply(box('OWNER ONLY', ['❌ Only the owner can use this.']));
    }

    const value = (args[0] || '').toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return m.reply(box('AUTO BIO', [
            `📌 Current : ${admin.state.autoBio ? '✅ ON' : '❌ OFF'}`,
            `❌ Usage   : ${global.BOT_PREFIX}autobio on [custom text]`,
            `❌ Usage   : ${global.BOT_PREFIX}autobio off`
        ]));
    }

    if (value === 'on') {
        admin.state.autoBio = true;
        admin.state.bioText = args.slice(1).join(' ');
        admin.save();
        admin.startAutoBio(sock);
        return m.reply(box('AUTO BIO', [
            '✅ Auto bio ON',
            admin.state.bioText ? `📝 Text : ${admin.state.bioText}` : '🕒 Updates every minute (uptime + time)'
        ]));
    }

    admin.state.autoBio = false;
    admin.save();
    admin.stopAutoBio();
    await m.reply(box('AUTO BIO', ['❌ Auto bio OFF']));
});
