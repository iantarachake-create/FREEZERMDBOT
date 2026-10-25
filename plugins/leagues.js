'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const { LEAGUES } = require('../lib/espn');

cmd({
    pattern: 'leagues',
    name: 'leagues',
    description: 'List football leagues you can use',
    category: 'football',
    aliases: ['footleagues'],
    filename: __filename
}, async (sock, m) => {
    await goOnline(sock, m);
    const lines = Object.entries(LEAGUES).map(([k, l]) => `⚽ ${k} — ${l.name}`);
    await m.reply(box('LEAGUES', [...lines, '', `✍️ Example: ${global.BOT_PREFIX}table laliga`]));
});
