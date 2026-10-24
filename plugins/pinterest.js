'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');
const { deepUrls, isImageUrl } = require('../lib/mediaTools');
const { searchImages } = require('../lib/ddg');

cmd({
    pattern: 'pinterest',
    name: 'pinterest',
    description: 'Download a pin by link, or search: .pinterest aesthetic 3',
    category: 'downloaders',
    aliases: ['pin', 'pindl'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    if (!args.length) {
        return m.reply(box('PINTEREST', [
            `❌ ${global.BOT_PREFIX}pinterest <pin link>`,
            `❌ ${global.BOT_PREFIX}pinterest aesthetic wallpaper 3`
        ]));
    }

    try {
        // 1) Pin link -> download it
        if (/pinterest\.|pin\.it/i.test(args[0])) {
            let lib;
            try { lib = require('btch-downloader'); } catch {
                return m.reply(box('PINTEREST', ['❌ Run: npm install btch-downloader']));
            }
            await m.reply(box('PINTEREST', ['⏳ Downloading...']));
            const res = await lib.pinterest(args[0]);
            const urls = [...new Set(deepUrls(res))];
            const media = urls.find(u => /\.(mp4|m3u8)/i.test(u)) || urls.find(isImageUrl) || urls[0];
            if (!media) throw new Error('nothing found (invalid or private pin)');

            return await sock.sendMessage(m.from, /\.mp4/i.test(media)
                ? { video: { url: media }, caption: box('PINTEREST', ['✅ Download complete']) }
                : { image: { url: media }, caption: box('PINTEREST', ['✅ Download complete']) });
        }

        // 2) Text -> image search
        let count = 3;
        if (args.length > 1 && /^\d+$/.test(args[args.length - 1])) {
            count = Math.min(10, Math.max(1, parseInt(args.pop())));
        }
        const query = args.join(' ');
        const urls = await searchImages(query + ' pinterest');
        if (!urls.length) return m.reply(box('PINTEREST', ['❌ No results.']));

        let sent = 0;
        for (const url of urls) {
            if (sent >= count) break;
            try {
                await sock.sendMessage(m.from, {
                    image: { url },
                    caption: sent === 0 ? box('PINTEREST', [`🔎 ${query}`]) : ''
                });
                sent++;
            } catch {}
        }
        if (!sent) await m.reply(box('PINTEREST', ['❌ Could not send any image.']));
    } catch (err) {
        await m.reply(box('PINTEREST', [`❌ Failed: ${err.message}`]));
    }
});
