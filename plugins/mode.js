'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const admin = require('../lib/adminState');

cmd({
    pattern: 'mode',
    name: 'mode',
    description: 'Switch bot between public and private',
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);
    if (!(m.isOwner || m.isDev)) {
        return m.reply(box('OWNER ONLY', ['❌ Only the owner can use this.']));
    }

    const value = (args[0] || '').toLowerCase();
    if (value !== 'public' && value !== 'private') {
        return m.reply(box('BOT MODE', [
            `📌 Current : ${admin.state.mode === 'private' ? '🔒 PRIVATE' : '🌐 PUBLIC'}`,
            `❌ Usage   : ${global.BOT_PREFIX}mode public|private`
        ]));
    }

    admin.state.mode = value;
    admin.save();
    await m.reply(box('BOT MODE', [
        `${value === 'private' ? '🔒' : '🌐'} Mode set to ${value.toUpperCase()}`,
        value === 'private' ? '👑 Only owner & sudo can use commands' : '👥 Everyone can use commands'
    ]));
});
