'use strict';

const { cmd } = require('../arslan');
const { makeBox, getMedia } = require('../lib/freezer-ui');
const { setStickerExif } = require('../lib/stickerExif');

const box = makeBox('Sticker Center');

cmd({
    pattern: 'take',
    name: 'take',
    category: 'Creative',
    aliases: ['steal', 'wm', 'stickername'],
    description: 'Change the pack name and author of a sticker',
    filename: __filename
}, async (sock, m) => {
    const prefix = global.BOT_PREFIX || '.';

    // ".take Pack | Author"  /  ".take Pack"  /  ".take"
    const raw = String(m.body || '').replace(/^\S+\s*/, '').trim();
    const [first, second] = raw.split('|').map(s => s.trim());
    const pack = (first || m.pushName || 'FREEZER-MD').slice(0, 40);
    const author = (second || (first ? m.pushName : '') || 'FREEZER-MD').slice(0, 40);

    try {
        const media = await getMedia(sock, m, ['sticker', 'image', 'video']);
        if (!media) {
            return m.reply(box(
                '🏷️ *𝗧𝗔𝗞𝗘 𝗦𝗧𝗜𝗖𝗞𝗘𝗥*',
                '➤ Reply to a sticker (or an image / short video).',
                '',
                `➤ ${prefix}take                (your name)`,
                `➤ ${prefix}take My Pack`,
                `➤ ${prefix}take My Pack | My Name`
            ));
        }

        await m.react('⏳');
        let sticker;
        if (media.kind === 'sticker') {
            sticker = setStickerExif(media.buffer, pack, author);   // keeps animation and quality
        } else {
            const { createSticker } = require('../sticker');         // image/video -> new sticker
            sticker = await createSticker(media.buffer, null, pack, author);
        }

        await m.reply({ sticker });
        await m.react('✅');
    } catch (err) {
        console.error('[TAKE] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗧𝗔𝗞𝗘 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
