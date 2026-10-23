'use strict';

const { cmd } = require('../arslan');
const { makeBox, getMedia, toOpus, extOf, sizeText } = require('../lib/freezer-ui');

const box = makeBox('Media Center');
const MAX_BYTES = 50 * 1024 * 1024;

cmd({
    pattern: 'tovn',
    name: 'tovn',
    category: 'Tools',
    aliases: ['tovoice', 'toptt', 'voicenote'],
    description: 'Send a replied audio or video as a voice note',
    filename: __filename
}, async (sock, m) => {
    const prefix = global.BOT_PREFIX || '.';

    try {
        const media = await getMedia(sock, m, ['audio', 'video', 'document']);
        const isAv = media && (media.kind !== 'document' || /^(audio|video)\//.test(media.mime));
        if (!isAv) {
            return m.reply(box(
                '🎤 *𝗧𝗢 𝗩𝗢𝗜𝗖𝗘 𝗡𝗢𝗧𝗘*',
                '➤ Reply to an audio, song or video.',
                `➤ Example: reply with ${prefix}tovn`
            ));
        }
        if (media.buffer.length > MAX_BYTES) {
            return m.reply(box('❌ *𝗧𝗢𝗢 𝗕𝗜𝗚*', `➤ ${sizeText(media.buffer.length)} is over the 50MB limit.`));
        }

        await m.react('⏳');
        const ogg = await toOpus(media.buffer, extOf(media.mime));
        await m.reply({ audio: ogg, mimetype: 'audio/ogg; codecs=opus', ptt: true });
        await m.react('✅');
    } catch (err) {
        console.error('[TOVN] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗩𝗡 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
