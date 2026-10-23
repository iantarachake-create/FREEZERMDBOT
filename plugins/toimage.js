'use strict';

const { cmd } = require('../arslan');
const { makeBox, FOOTER, getMedia, convert, nodeOf } = require('../lib/freezer-ui');

const box = makeBox('Media Center');

cmd({
    pattern: 'toimage',
    name: 'toimage',
    category: 'Tools',
    aliases: ['toimg', 'stickertoimg', 'unsticker'],
    description: 'Turn a sticker back into an image (animated ones become a video)',
    filename: __filename
}, async (sock, m) => {
    const prefix = global.BOT_PREFIX || '.';

    try {
        const media = await getMedia(sock, m, ['sticker']);
        if (!media) {
            return m.reply(box(
                '🖼️ *𝗧𝗢 𝗜𝗠𝗔𝗚𝗘*',
                '➤ Reply to a sticker.',
                `➤ Example: reply with ${prefix}toimage`
            ));
        }

        let sharp;
        try { sharp = require('sharp'); } catch (_) {
            return m.reply(box('❌ *𝗠𝗜𝗦𝗦𝗜𝗡𝗚 𝗣𝗔𝗖𝗞𝗔𝗚𝗘*', '➤ Run: npm i sharp'));
        }

        await m.react('⏳');

        const meta = await sharp(media.buffer, { animated: true }).metadata();
        const animated = nodeOf(media.msg).isAnimated === true || (meta.pages || 1) > 1;

        if (!animated) {
            const png = await sharp(media.buffer).png().toBuffer();
            await m.reply({ image: png, caption: `🖼️ Sticker ➜ image\n\n${FOOTER}` });
        } else {
            // animated sticker -> gif -> mp4 (WhatsApp plays it as a GIF)
            const gif = await sharp(media.buffer, { animated: true }).gif().toBuffer();
            const mp4 = await convert(gif, 'gif', 'mp4', [
                '-movflags', 'faststart', '-pix_fmt', 'yuv420p',
                '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
            ]);
            await m.reply({ video: mp4, mimetype: 'video/mp4', gifPlayback: true, caption: `🎞️ Sticker ➜ video\n\n${FOOTER}` });
        }
        await m.react('✅');
    } catch (err) {
        console.error('[TOIMAGE] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗖𝗢𝗡𝗩𝗘𝗥𝗧 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
