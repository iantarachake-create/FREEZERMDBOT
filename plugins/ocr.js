const axios = require('axios');
const { cmd } = require('../arslan');
const { makeBox, getMedia, convert, extOf, sizeText } = require('../lib/freezer-ui');

const box = makeBox('Vision Center');

// OCR.space. Free public key works but is rate limited; set global.ocrKey for your own.
const OCR_API = 'https://api.ocr.space/parse/image';
const FREE_LIMIT = 1000 * 1000; // free keys accept files up to ~1MB

// shrink to a jpeg under the free size limit
async function prepare(buffer, ext) {
    for (const [w, q] of [[1800, 5], [1400, 10], [1000, 16]]) {
        const jpg = await convert(buffer, ext, 'jpg', ['-vf', `scale='min(${w},iw)':-2`, '-q:v', String(q), '-frames:v', '1']);
        if (jpg.length <= FREE_LIMIT) return jpg;
    }
    throw new Error('Image is too large to read, send a smaller one');
}

cmd({
    pattern: 'ocr',
    name: 'ocr',
    category: 'Tools',
    aliases: ['ocr.all', 'ocrall', 'imgtext', 'totext', 'readtext'],
    description: 'Extract text from an image',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';
    // optional 3-letter language, e.g.  .ocr ara   (default eng)
    const lang = /^[a-z]{3}$/i.test(args?.[0] || '') ? args[0].toLowerCase() : 'eng';

    try {
        const media = await getMedia(sock, m, ['image', 'sticker']);
        if (!media) {
            return m.reply(box(
                '🔍 *𝗢𝗖𝗥*',
                '➤ Reply to an image that contains text.',
                '',
                `➤ ${prefix}ocr`,
                `➤ ${prefix}ocr ara   (language code, default eng)`
            ));
        }

        await m.react('🔍');
        const jpg = await prepare(media.buffer, extOf(media.mime));

        const body = new URLSearchParams({
            apikey: global.ocrKey || process.env.OCR_KEY || 'helloworld',
            language: lang,
            isOverlayRequired: 'false',
            OCREngine: '2',
            base64Image: `data:image/jpeg;base64,${jpg.toString('base64')}`
        });

        const { data } = await axios.post(OCR_API, body.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 60000
        });

        if (data?.IsErroredOnProcessing) {
            const msg = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(', ') : data.ErrorMessage;
            throw new Error(msg || 'OCR service error');
        }

        const text = (data?.ParsedResults || []).map(r => r.ParsedText || '').join('\n').trim();
        if (!text) {
            await m.react('❌');
            return m.reply(box('❌ *𝗡𝗢 𝗧𝗘𝗫𝗧*', '➤ No readable text found in this image.'));
        }

        await m.reply(box('🔍 *𝗘𝗫𝗧𝗥𝗔𝗖𝗧𝗘𝗗 𝗧𝗘𝗫𝗧*', ...text.split(/\r?\n/).map(l => l.trimEnd())));
        await m.react('✅');
    } catch (err) {
        console.error('[OCR] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗢𝗖𝗥 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
