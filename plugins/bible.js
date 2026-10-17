'use strict';

const axios = require('axios');
const { cmd } = require('../arslan');

const API = 'https://bible-api.com';
const TRANSLATIONS = ['kjv', 'web', 'asv', 'bbe', 'oeb-us', 'oeb-cw', 'webbe', 'almeida', 'rccv', 'cherokee', 'clementine'];
const MAX_CHARS = 3500;

const RANDOM_VERSES = [
    'John 3:16', 'Psalm 23:1-4', 'Philippians 4:13', 'Jeremiah 29:11',
    'Proverbs 3:5-6', 'Isaiah 41:10', 'Romans 8:28', 'Joshua 1:9',
    'Matthew 11:28', 'Psalm 46:1', 'Romans 12:2', '1 Corinthians 13:4-7',
    'Isaiah 40:31', 'Psalm 121:1-2', 'Galatians 5:22-23', 'Matthew 6:33',
    '2 Timothy 1:7', 'Hebrews 11:1', 'Psalm 27:1', 'Lamentations 3:22-23'
];

function box(lines) {
    const body = lines.join('\n');
    return `┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗕𝗜𝗕𝗟𝗘* ◈\n┃\n${body}\n┃\n┗▣`;
}

cmd({
    pattern: 'bible',
    name: 'bible',
    category: 'Tools',
    description: 'Read a Bible verse (e.g. .bible john 3:16)',
    aliases: ['verse', 'bv'],
    react: '📖',
    filename: __filename
}, async (sock, m, args) => {
    try {
        const prefix = global.BOT_PREFIX || '.';
        let parts = args.map(a => a.trim()).filter(Boolean);

        if (!parts.length) {
            return m.reply(box([
                '┃│ 📖 Bible Verse Finder',
                '┃│',
                '┃│ Usage:',
                `┃│ ★ ${prefix}bible john 3:16`,
                `┃│ ★ ${prefix}bible psalm 23:1-4`,
                `┃│ ★ ${prefix}bible 1 cor 13:4-7 web`,
                `┃│ ★ ${prefix}bible random`,
                '┃│',
                `┃│ Translations: ${TRANSLATIONS.join(', ')}`,
                '┃│ Default: kjv'
            ]));
        }

        // Optional translation as the last word
        let translation = 'kjv';
        const last = parts[parts.length - 1].toLowerCase();
        if (parts.length > 1 && TRANSLATIONS.includes(last)) {
            translation = last;
            parts = parts.slice(0, -1);
        }

        let reference = parts.join(' ');
        const isRandom = reference.toLowerCase() === 'random';
        if (isRandom) {
            reference = RANDOM_VERSES[Math.floor(Math.random() * RANDOM_VERSES.length)];
        }

        const res = await axios.get(`${API}/${encodeURIComponent(reference)}`, {
            params: { translation },
            timeout: 15000
        });

        const data = res.data;
        const text = (data?.text || '').trim();

        if (!text) {
            return m.reply(box([
                '┃│ ❌ Verse not found',
                '┃│',
                `┃│ ★ ${reference}`,
                `┃│ Try: ${prefix}bible john 3:16`
            ]));
        }

        let body = text.replace(/\n{3,}/g, '\n\n');
        let truncated = false;
        if (body.length > MAX_CHARS) {
            body = body.slice(0, MAX_CHARS).replace(/\s+\S*$/, '') + '...';
            truncated = true;
        }

        const lines = [
            `┃│ 📖 *${data.reference || reference}*`,
            `┃│ 🔤 ${(data.translation_name || translation).toString()}`,
            '┃│',
            ...body.split('\n').map(l => `┃│ ${l}`)
        ];
        if (truncated) lines.push('┃│', '┃│ ✂️ Passage shortened, request fewer verses.');

        return m.reply(box(lines));

    } catch (err) {
        if (err.response?.status === 404) {
            return m.reply(box([
                '┃│ ❌ Verse not found',
                '┃│',
                '┃│ Check the book name and verse numbers.',
                `┃│ Example: ${global.BOT_PREFIX || '.'}bible john 3:16`
            ]));
        }
        console.error('Bible error:', err.message);
        return m.reply(box(['┃│ ❌ Could not fetch the verse. Try again later.']));
    }
});
