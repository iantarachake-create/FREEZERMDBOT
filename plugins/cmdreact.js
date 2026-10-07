'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const admin = require('../lib/adminState');

cmd({
    pattern: 'cmdreact',
    name: 'cmdreact',
    description: 'React to every command with an emoji',
    aliases: ['autoreact'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);
    if (!(m.isOwner || m.isDev)) {
        return m.reply(box('OWNER ONLY', ['❌ Only the owner can use this.']));
    }

    const value = (args[0] || '').toLowerCase();
    if (value !== 'on' && value !== 'off') {
        return m.reply(box('CMD REACT', [
            `📌 Current : ${admin.state.cmdReact ? '✅ ON' : '❌ OFF'}`,
            `❌ Usage   : ${global.BOT_PREFIX}cmdreact on|off`
        ]));
    }

    admin.state.cmdReact = value === 'on';
    admin.save();
    await m.reply(box('CMD REACT', [`🎭 Command reactions ${value.toUpperCase()}`]));
});
