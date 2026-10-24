'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');

cmd({
    pattern: 'lyrics',
    name: 'lyrics',
    description: 'Find song lyrics: .lyrics song name',
    aliases: ['lyric'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    const query = args.join(' ').trim();
    if (!query) return m.reply(box('LYRICS', [`❌ Usage: ${global.BOT_PREFIX}lyrics Burna Boy Last Last`]));

    try {
        const sug = await (await fetch(`https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`)).json();
        const top = sug?.data?.[0];
        if (!top) return m.reply(box('LYRICS', ['❌ Song not found.']));

        const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(top.artist.name)}/${encodeURIComponent(top.title)}`);
        const data = await res.json();
        const lyrics = (data?.lyrics || '').replace(/\r/g, '').trim();
        if (!lyrics) return m.reply(box('LYRICS', ['❌ No lyrics available for this song.']));

        const header = box('LYRICS', [`🎵 ${top.title}`, `🎤 ${top.artist.name}`]);
        if (top.album?.cover_medium) {
            await sock.sendMessage(m.from, { image: { url: top.album.cover_medium }, caption: header });
        } else {
            await m.reply(header);
        }
        await m.reply(lyrics.slice(0, 6000));
    } catch (err) {
        await m.reply(box('LYRICS', [`❌ Failed: ${err.message}`]));
    }
});
