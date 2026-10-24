'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const { searchImages } = require('../lib/ddg');

const QUERIES = [
    'matching couple pfp anime',
    'couple matching profile pictures aesthetic',
    'anime couple dp matching boy girl'
];

cmd({
    pattern: 'ppcouple',
    name: 'ppcouple',
    description: 'Random matching couple profile pictures',
    aliases: ['couplepp', 'couple'],
    filename: __filename
}, async (sock, m) => {
    await goOnline(sock, m);

    try {
        const q = QUERIES[Math.floor(Math.random() * QUERIES.length)];
        const urls = (await searchImages(q)).sort(() => Math.random() - 0.5);

        const picks = [];
        for (const url of urls) {
            if (picks.length === 2) break;
            try {
                const res = await fetch(url, { method: 'HEAD' });
                if (res.ok) picks.push(url);
            } catch {}
        }
        if (picks.length < 2) throw new Error('could not find a pair, try again');

        await sock.sendMessage(m.from, { image: { url: picks[0] }, caption: box('PP COUPLE', ['👦 Male']) });
        await sock.sendMessage(m.from, { image: { url: picks[1] }, caption: box('PP COUPLE', ['👧 Female']) });
    } catch (err) {
        await m.reply(box('PP COUPLE', [`❌ Failed: ${err.message}`]));
    }
});
