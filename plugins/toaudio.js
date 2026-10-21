const { cmd } = require('../arslan');
const { makeBox, getMedia, convert, extOf, sizeText } = require('../freezer-ui');

const box = makeBox('Media Center');
const MAX_BYTES = 50 * 1024 * 1024;

cmd({
    pattern: 'toaudio',
    name: 'toaudio',
    category: 'Tools',
    aliases: ['tomp3', 'mp3', 'extractaudio'],
    description: 'Convert a video or voice note to mp3 audio',
    filename: __filename
}, async (sock, m) => {
    const prefix = global.BOT_PREFIX || '.';

    try {
        const media = await getMedia(sock, m, ['video', 'audio']);
        if (!media) {
            return m.reply(box(
                '🎧 *𝗧𝗢 𝗔𝗨𝗗𝗜𝗢*',
                '➤ Reply to a video or audio message.',
                `➤ Example: reply with ${prefix}toaudio`
            ));
        }
        if (media.buffer.length > MAX_BYTES) {
            return m.reply(box('❌ *𝗧𝗢𝗢 𝗕𝗜𝗚*', `➤ ${sizeText(media.buffer.length)} is over the 50MB limit.`));
        }

        await m.react('⏳');
        const mp3 = await convert(
            media.buffer,
            extOf(media.mime),
            'mp3',
            ['-vn', '-c:a', 'libmp3lame', '-b:a', '128k']
        );
        await m.reply({ audio: mp3, mimetype: 'audio/mpeg', fileName: 'freezer-audio.mp3' });
        await m.react('✅');
    } catch (err) {
        console.error('[TOAUDIO] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗖𝗢𝗡𝗩𝗘𝗥𝗧 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
