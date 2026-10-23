'use strict';

const { cmd } = require('../arslan');
const { makeBox, getMedia, convert, extOf, sizeText, nodeOf } = require('../lib/freezer-ui');

const box = makeBox('Media Center');
const MAX_BYTES = 50 * 1024 * 1024;
const BITRATES = [64, 96, 128, 192, 256, 320];

cmd({
    pattern: 'tomp3',
    name: 'tomp3',
    category: 'Tools',
    aliases: ['mp3', 'extractmp3'],
    description: 'Convert a video or voice note to an mp3 file',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';
    const asked = parseInt(args?.[0], 10);
    const bitrate = BITRATES.includes(asked) ? asked : 128;

    try {
        const media = await getMedia(sock, m, ['video', 'audio', 'document']);
        const isAv = media && (media.kind !== 'document' || /^(audio|video)\//.test(media.mime));
        if (!isAv) {
            return m.reply(box(
                '🎵 *𝗧𝗢 𝗠𝗣𝟯*',
                '➤ Reply to a video, audio or voice note.',
                '',
                `➤ ${prefix}tomp3          (128 kbps)`,
                `➤ ${prefix}tomp3 320      (best quality)`,
                `➤ Bitrates: ${BITRATES.join(', ')}`
            ));
        }
        if (media.buffer.length > MAX_BYTES) {
            return m.reply(box('❌ *𝗧𝗢𝗢 𝗕𝗜𝗚*', `➤ ${sizeText(media.buffer.length)} is over the 50MB limit.`));
        }

        await m.react('⏳');
        const mp3 = await convert(media.buffer, extOf(media.mime), 'mp3',
            ['-vn', '-c:a', 'libmp3lame', '-b:a', `${bitrate}k`]);

        const original = String(nodeOf(media.msg).fileName || '').replace(/\.[^.]+$/, '');
        const fileName = `${(original || 'freezer-audio').replace(/[<>:"/\\|?*\n\r]/g, '_').slice(0, 80)}.mp3`;

        await m.reply({ audio: mp3, mimetype: 'audio/mpeg', fileName });
        await m.react('✅');
    } catch (err) {
        console.error('[TOMP3] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗠𝗣𝟯 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
