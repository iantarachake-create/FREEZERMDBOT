const { cmd } = require('../arslan');
const { makeBox, getMedia, convert, extOf, sizeText } = require('../freezer-ui');

const box = makeBox('Media Center');

// level -> image width / jpeg quality (lower q = better) / video crf / video width
const LEVELS = {
    low:    { w: 1600, q: 4,  crf: 26, vw: 1280 },
    medium: { w: 1280, q: 8,  crf: 30, vw: 854 },
    high:   { w: 960,  q: 14, crf: 35, vw: 640 }
};
const ALIASES = { light: 'low', soft: 'low', mid: 'medium', normal: 'medium', heavy: 'high', max: 'high' };
const MAX_BYTES = 100 * 1024 * 1024;

cmd({
    pattern: 'compress',
    name: 'compress',
    category: 'Tools',
    aliases: ['compressor', 'shrink', 'reducesize'],
    description: 'Reduce the size of an image or video',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';
    const word = String(args?.[0] || 'medium').toLowerCase();
    const levelName = LEVELS[word] ? word : (ALIASES[word] || 'medium');
    const L = LEVELS[levelName];

    try {
        const media = await getMedia(sock, m, ['image', 'video']);
        if (!media) {
            return m.reply(box(
                '🗜️ *𝗖𝗢𝗠𝗣𝗥𝗘𝗦𝗦*',
                '➤ Reply to an image or video.',
                '',
                `➤ ${prefix}compress          (medium)`,
                `➤ ${prefix}compress low      (best quality)`,
                `➤ ${prefix}compress high     (smallest size)`
            ));
        }
        if (media.buffer.length > MAX_BYTES) {
            return m.reply(box('❌ *𝗧𝗢𝗢 𝗕𝗜𝗚*', `➤ ${sizeText(media.buffer.length)} is over the 100MB limit.`));
        }

        await m.react('⏳');
        const before = media.buffer.length;
        const inExt = extOf(media.mime);
        let out;

        if (media.kind === 'image') {
            out = await convert(media.buffer, inExt, 'jpg', [
                '-vf', `scale='min(${L.w},iw)':-2`,
                '-q:v', String(L.q),
                '-frames:v', '1'
            ]);
        } else {
            out = await convert(media.buffer, inExt, 'mp4', [
                '-vf', `scale='min(${L.vw},iw)':-2`,
                '-c:v', 'libx264', '-crf', String(L.crf), '-preset', 'veryfast',
                '-pix_fmt', 'yuv420p',
                '-c:a', 'aac', '-b:a', '64k',
                '-movflags', '+faststart'
            ], 600000);
        }

        const after = out.length;
        const saved = Math.max(0, Math.round((1 - after / before) * 100));
        const caption =
            `🗜️ Compressed (${levelName})\n` +
            `📉 ${sizeText(before)} ➜ ${sizeText(after)}  (-${saved}%)`;

        if (media.kind === 'image') await m.reply({ image: out, caption });
        else await m.reply({ video: out, mimetype: 'video/mp4', caption });

        await m.react('✅');
    } catch (err) {
        console.error('[COMPRESS] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗖𝗢𝗠𝗣𝗥𝗘𝗦𝗦 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
