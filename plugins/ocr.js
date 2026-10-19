'use strict';

const axios = require('axios');
const sharp = require('sharp');
const { cmd } = require('../arslan');
const { box } = require('../lib/groupTools');

// Uses OCR.space. Set OCR_API_KEY in your env for higher limits
// (the public "helloworld" key works but is heavily rate-limited).
const KEY = process.env.OCR_API_KEY || 'helloworld';

async function shrink(buffer) {
    let quality = 80;
    let out = buffer;
    for (let i = 0; i < 4; i++) {
        out = await sharp(buffer).rotate()
            .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality }).toBuffer();
        if (out.length < 1000 * 1024) break;
        quality -= 15;
    }
    return out;
}

async function recognise(b64, lang, engine) {
    const form = new URLSearchParams();
    form.append('base64Image', `data:image/jpeg;base64,${b64}`);
    form.append('language', lang);
    form.append('OCREngine', String(engine));
    form.append('scale', 'true');
    form.append('detectOrientation', 'true');
    const { data } = await axios.post('https://api.ocr.space/parse/image', form.toString(), {
        headers: { apikey: KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 60000, maxBodyLength: Infinity
    });
    if (data?.IsErroredOnProcessing) {
        const e = Array.isArray(data.ErrorMessage) ? data.ErrorMessage.join(' ') : data.ErrorMessage;
        throw new Error(e || 'OCR failed');
    }
    return (data?.ParsedResults || []).map(r => r.ParsedText || '').join('\n').trim();
}

cmd({
    pattern: 'ocr',
    name: 'ocr',
    category: 'Tools',
    description: 'Extract text from an image',
    aliases: ['readtext', 'imgtext'],
    filename: __filename
}, async (sock, m, args) => {
    const p = global.BOT_PREFIX || '.';
    const kind = m.isMedia ? m.mediaType : m.quoted?.mediaType;

    if (kind !== 'image') {
        return m.reply(box('OCR', [
            '🔤 Read text from a picture',
            '',
            '★ Reply to an image with',
            `   ${p}ocr`,
            `★ ${p}ocr fre   (other language)`,
            '',
            'Codes: eng fre ger spa por ita',
            'rus ara tur kor jpn chs'
        ]));
    }

    await m.react('⌛').catch(() => {});

    try {
        const raw = await m.download();
        if (!raw) throw new Error('Could not download the image');
        const b64 = (await shrink(raw)).toString('base64');

        const lang = (args[0] || '').toLowerCase();
        let text;
        if (lang) {
            text = await recognise(b64, lang, 1);
        } else {
            try { text = await recognise(b64, 'eng', 2); }
            catch { text = await recognise(b64, 'eng', 1); }
        }

        if (!text) {
            await m.react('❌').catch(() => {});
            return m.reply(box('OCR', ['❌ No text found in this image.']));
        }
        await m.reply(box('OCR', ['✅ Extracted text', '']) + '\n\n' + text);
        await m.react('✅').catch(() => {});
    } catch (err) {
        console.error('[FREEZER-MD] ocr error:', err);
        await m.react('❌').catch(() => {});
        await m.reply(box('OCR', [`❌ Failed: ${err.message}`]));
    }
});
