'use strict';

const axios = require('axios');
const { cmd } = require('../arslan');

const MAX_INPUT = 2000;

// name -> ISO code (codes themselves are also accepted)
const LANGS = {
    afrikaans: 'af', albanian: 'sq', amharic: 'am', arabic: 'ar', armenian: 'hy',
    azerbaijani: 'az', basque: 'eu', belarusian: 'be', bengali: 'bn', bosnian: 'bs',
    bulgarian: 'bg', burmese: 'my', catalan: 'ca', chinese: 'zh-CN', 'chinese-traditional': 'zh-TW',
    croatian: 'hr', czech: 'cs', danish: 'da', dutch: 'nl', english: 'en',
    esperanto: 'eo', estonian: 'et', filipino: 'tl', finnish: 'fi', french: 'fr',
    galician: 'gl', georgian: 'ka', german: 'de', greek: 'el', gujarati: 'gu',
    haitian: 'ht', hausa: 'ha', hebrew: 'iw', hindi: 'hi', hungarian: 'hu',
    icelandic: 'is', igbo: 'ig', indonesian: 'id', irish: 'ga', italian: 'it',
    japanese: 'ja', javanese: 'jw', kannada: 'kn', kazakh: 'kk', khmer: 'km',
    korean: 'ko', kurdish: 'ku', lao: 'lo', latin: 'la', latvian: 'lv',
    lithuanian: 'lt', macedonian: 'mk', malagasy: 'mg', malay: 'ms', malayalam: 'ml',
    maltese: 'mt', maori: 'mi', marathi: 'mr', mongolian: 'mn', nepali: 'ne',
    norwegian: 'no', pashto: 'ps', persian: 'fa', polish: 'pl', portuguese: 'pt',
    punjabi: 'pa', romanian: 'ro', russian: 'ru', serbian: 'sr', sesotho: 'st',
    shona: 'sn', sindhi: 'sd', sinhala: 'si', slovak: 'sk', slovenian: 'sl',
    somali: 'so', spanish: 'es', sundanese: 'su', swahili: 'sw', swedish: 'sv',
    tajik: 'tg', tamil: 'ta', telugu: 'te', thai: 'th', turkish: 'tr',
    ukrainian: 'uk', urdu: 'ur', uzbek: 'uz', vietnamese: 'vi', welsh: 'cy',
    xhosa: 'xh', yiddish: 'yi', yoruba: 'yo', zulu: 'zu'
};

const CODES = new Set(Object.values(LANGS).map(c => c.toLowerCase()));
CODES.add('zh'); CODES.add('he'); CODES.add('jv'); CODES.add('fil');

const CODE_FIXES = { zh: 'zh-CN', he: 'iw', jv: 'jw', fil: 'tl', 'zh-cn': 'zh-CN', 'zh-tw': 'zh-TW' };

const NAME_BY_CODE = {};
for (const [name, code] of Object.entries(LANGS)) {
    NAME_BY_CODE[code.toLowerCase()] = name.charAt(0).toUpperCase() + name.slice(1);
}

function resolveLang(word) {
    if (!word) return null;
    const w = word.toLowerCase();
    if (LANGS[w]) return LANGS[w];
    if (CODES.has(w)) return CODE_FIXES[w] || w;
    return null;
}

function langName(code) {
    if (!code) return 'Unknown';
    const key = code.toLowerCase();
    return NAME_BY_CODE[key] || (key === 'iw' ? 'Hebrew' : key === 'jw' ? 'Javanese' : key.toUpperCase());
}

function box(lines) {
    return `┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗧𝗥𝗔𝗡𝗦𝗟𝗔𝗧𝗘* ◈\n┃\n${lines.join('\n')}\n┃\n┗▣`;
}

async function translateGoogle(text, to) {
    const res = await axios.get('https://translate.googleapis.com/translate_a/single', {
        params: { client: 'gtx', sl: 'auto', tl: to, dt: 't', q: text },
        timeout: 15000
    });
    const data = res.data;
    const out = (data?.[0] || []).map(seg => seg?.[0] || '').join('');
    if (!out) throw new Error('Empty translation');
    return { text: out, from: data?.[2] || 'auto' };
}

// Fallback: MyMemory (needs a source language, so we assume English if unknown).
async function translateMyMemory(text, to) {
    const res = await axios.get('https://api.mymemory.translated.net/get', {
        params: { q: text.slice(0, 500), langpair: `en|${to}` },
        timeout: 15000
    });
    const out = res.data?.responseData?.translatedText;
    if (!out) throw new Error('Empty translation');
    return { text: out, from: 'en' };
}

cmd({
    pattern: 'trt',
    name: 'trt',
    category: 'Tools',
    description: 'Translate text (.trt fr hello, or reply with .trt es)',
    aliases: ['translate', 'tr'],
    react: '🌍',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';

    try {
        let parts = args.map(a => a.trim()).filter(Boolean);

        // First word is the target language if we recognise it; otherwise English.
        let target = 'en';
        if (parts.length) {
            const lang = resolveLang(parts[0]);
            if (lang) {
                target = lang;
                parts = parts.slice(1);
            }
        }

        let text = parts.join(' ');
        if (!text && m.quoted?.body) text = m.quoted.body;

        if (!text) {
            return m.reply(box([
                '┃│ 🌍 Translator',
                '┃│',
                '┃│ Usage:',
                `┃│ ★ ${prefix}trt fr good morning`,
                `┃│ ★ ${prefix}trt spanish how are you`,
                `┃│ ★ Reply to a message with ${prefix}trt sw`,
                `┃│ ★ ${prefix}trt <text>  (translates to English)`,
                '┃│',
                `┃│ ${prefix}trt list  - show supported languages`
            ]));
        }

        if (text.toLowerCase() === 'list' && !m.quoted?.body && parts.length === 1) {
            const names = Object.entries(LANGS).map(([n, c]) => `${n} (${c})`);
            return m.reply(box([
                '┃│ 📚 Supported languages',
                '┃│',
                `┃│ ${names.join(', ')}`
            ]));
        }

        if (text.length > MAX_INPUT) text = text.slice(0, MAX_INPUT);

        let result;
        try {
            result = await translateGoogle(text, target);
        } catch (err) {
            result = await translateMyMemory(text, target);
        }

        return m.reply(box([
            `┃│ 🔤 ${langName(result.from)} ➜ ${langName(target)}`,
            '┃│',
            ...result.text.split('\n').map(l => `┃│ ${l}`)
        ]));

    } catch (err) {
        console.error('TRT error:', err.message);
        return m.reply(box(['┃│ ❌ Translation failed. Try again later.']));
    }
});
