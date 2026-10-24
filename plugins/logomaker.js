'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const { render } = require('../lib/logoEngine');

cmd({
    pattern: 'logomaker',
    name: 'logomaker',
    description: 'Make a logo from any ephoto360 effect link',
    aliases: ['makelogo'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    const url = args.shift() || '';
    const text = args.join(' ').trim();
    if (!/^https?:\/\/(en\.)?ephoto360\.com\//i.test(url) || !text) {
        return m.reply(box('LOGO MAKER', [
            `❌ ${global.BOT_PREFIX}logomaker <ephoto360 link> Your Text`,
            '📌 For 2-text effects use: Text1 | Text2',
            `📋 ${global.BOT_PREFIX}logolist shows ready-made styles`
        ]));
    }

    try {
        await m.reply(box('LOGO MAKER', ['⏳ Creating your logo...']));
        const texts = text.includes('|') ? text.split('|').map(s => s.trim()).filter(Boolean) : [text];
        const image = await render(url, texts);
        await sock.sendMessage(m.from, { image: { url: image }, caption: box('LOGO MAKER', [`✍️ ${text}`, '✅ Done']) });
    } catch (err) {
        await m.reply(box('LOGO MAKER', [`❌ Failed: ${err.message}`]));
    }
});
