const { cmd } = require('../arslan');
const { makeBox, getMedia, extOf, sizeText } = require('../lib/freezer-ui');

const box = makeBox('Upload Center');
const MAX_BYTES = 100 * 1024 * 1024;

async function toCatbox(buffer, mime, ext) {
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', new Blob([buffer], { type: mime || 'application/octet-stream' }), `freezer_${Date.now()}.${ext}`);
    const res = await fetch('https://catbox.moe/user/api.php', {
        method: 'POST', body: form, signal: AbortSignal.timeout(120000)
    });
    const text = (await res.text()).trim();
    if (!/^https?:\/\//i.test(text)) throw new Error(`Catbox: ${text.slice(0, 80) || 'upload failed'}`);
    return { url: text, host: 'Catbox (permanent)' };
}

async function toUguu(buffer, mime, ext) {
    const form = new FormData();
    form.append('files[]', new Blob([buffer], { type: mime || 'application/octet-stream' }), `freezer_${Date.now()}.${ext}`);
    const res = await fetch('https://uguu.se/upload?output=text', {
        method: 'POST', body: form, signal: AbortSignal.timeout(120000)
    });
    const text = (await res.text()).trim();
    if (!/^https?:\/\//i.test(text)) throw new Error(`Uguu: ${text.slice(0, 80) || 'upload failed'}`);
    return { url: text, host: 'Uguu (expires in ~3h)' };
}

cmd({
    pattern: 'tourl',
    name: 'tourl',
    category: 'Tools',
    aliases: ['upload', 'imgtourl'],
    description: 'Upload media and get a direct link',
    filename: __filename
}, async (sock, m) => {
    const prefix = global.BOT_PREFIX || '.';

    try {
        const media = await getMedia(sock, m, null);
        if (!media) {
            return m.reply(box(
                '🔗 *𝗧𝗢 𝗨𝗥𝗟*',
                '➤ Reply to an image, video, audio, sticker or file.',
                `➤ Example: reply with ${prefix}tourl`
            ));
        }
        if (media.buffer.length > MAX_BYTES) {
            return m.reply(box('❌ *𝗧𝗢𝗢 𝗕𝗜𝗚*', `➤ ${sizeText(media.buffer.length)} is over the 100MB limit.`));
        }

        await m.react('⏳');
        const ext = extOf(media.mime);

        let result;
        try {
            result = await toCatbox(media.buffer, media.mime, ext);
        } catch (e) {
            console.error('[TOURL] Catbox failed, trying Uguu:', e.message);
            result = await toUguu(media.buffer, media.mime, ext);
        }

        await m.reply(box(
            '🔗 *𝗨𝗣𝗟𝗢𝗔𝗗𝗘𝗗*',
            `➤ Size : ${sizeText(media.buffer.length)}`,
            `➤ Host : ${result.host}`,
            '',
            `➤ ${result.url}`
        ));
        await m.react('✅');
    } catch (err) {
        console.error('[TOURL] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗨𝗣𝗟𝗢𝗔𝗗 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`, '➤ Please try again.'));
    }
});
