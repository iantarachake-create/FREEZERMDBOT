'use strict';

const axios = require('axios');
const { cmd } = require('../arslan');
const { box } = require('../lib/groupTools');

const LANGS = new Set([
    'en', 'sw', 'fr', 'es', 'de', 'it', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh-cn', 'ru', 'tr', 'id',
    'nl', 'pl', 'am', 'so', 'zu', 'af', 'th', 'vi', 'bn', 'ur', 'ne', 'fil', 'sv', 'el', 'cs',
    'ro', 'hu', 'uk', 'fi', 'da', 'no'
]);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36';

// Google TTS accepts ~200 characters per request, so split on sentence/word boundaries
function chunk(text, max = 180) {
    const parts = [];
    let rest = text.replace(/\s+/g, ' ').trim();
    while (rest.length > max) {
        let cut = Math.max(rest.lastIndexOf('. ', max), rest.lastIndexOf('! ', max), rest.lastIndexOf('? ', max), rest.lastIndexOf(', ', max));
        if (cut < max * 0.4) cut = rest.lastIndexOf(' ', max);
        if (cut <= 0) cut = max;
        parts.push(rest.slice(0, cut + 1).trim());
        rest = rest.slice(cut + 1).trim();
    }
    if (rest) parts.push(rest);
    return parts;
}

cmd({
    pattern: 'tts',
    name: 'tts',
    category: 'Tools',
    description: 'Convert text to speech',
    aliases: ['say', 'speak', 'texttospeech'],
    filename: __filename
}, async (sock, m, args) => {
    const p = global.BOT_PREFIX || '.';
    let lang = 'en';
    const list = [...args];

    if (list.length && LANGS.has(list[0].toLowerCase())) lang = list.shift().toLowerCase();
    let text = list.join(' ').trim();
    if (!text && m.quoted?.body) text = m.quoted.body.trim();

    if (!text) {
        return m.reply(box('TTS', [
            '🗣️ Text to speech',
            '',
            `★ ${p}tts Hello everyone`,
            `★ ${p}tts sw Karibuni wote`,
            `★ Reply to a text with ${p}tts`,
            '',
            'Languages: en sw fr es de it pt ar',
            'hi ja ko zh-cn ru tr id nl pl am so zu...'
        ]));
    }
    if (text.length > 800) return m.reply(box('TTS', ['❌ Max 800 characters.']));

    await m.react('⌛').catch(() => {});

    try {
        const tl = lang === 'zh-cn' ? 'zh-CN' : lang;
        const buffers = [];
        for (const q of chunk(text)) {
            const res = await axios.get('https://translate.google.com/translate_tts', {
                params: { ie: 'UTF-8', q, tl, client: 'tw-ob', total: 1, idx: 0, textlen: q.length },
                headers: { 'User-Agent': UA, Referer: 'https://translate.google.com/' },
                responseType: 'arraybuffer',
                timeout: 20000
            });
            buffers.push(Buffer.from(res.data));
        }
        await sock.sendMessage(m.from, { audio: Buffer.concat(buffers), mimetype: 'audio/mpeg', ptt: false });
        await m.react('✅').catch(() => {});
    } catch (err) {
        console.error('[FREEZER-MD] tts error:', err);
        await m.react('❌').catch(() => {});
        await m.reply(box('TTS', [`❌ Failed: ${err.message}`]));
    }
});
