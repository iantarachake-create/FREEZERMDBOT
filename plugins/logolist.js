'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const LOGOS = require('../lib/logoList');

cmd({
    pattern: 'logolist',
    name: 'logolist',
    description: 'List all logo / text effect commands',
    aliases: ['logos'],
    filename: __filename
}, async (sock, m) => {
    await goOnline(sock, m);

    const p = global.BOT_PREFIX;
    const lines = Object.entries(LOGOS).map(([k, v]) =>
        `🎨 ${p}${k}${v.texts > 1 ? ' a | b' : ''}`);

    await m.reply(box('LOGO LIST', [
        ...lines,
        '',
        `✍️ Usage: ${p}<style> Your Text`,
        `🛠️ Custom: ${p}logomaker <ephoto link> text`
    ]));
});
