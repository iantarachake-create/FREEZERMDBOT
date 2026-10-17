'use strict';

const { cmd } = require('../arslan');

/* ---------- helpers ---------- */

const UP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LO = 'abcdefghijklmnopqrstuvwxyz';
const DG = '0123456789';

// Build a char map from base code points (+ optional exceptions where
// Unicode puts the letter in a different block, e.g. script "B" = U+212C).
function rangeMap({ upper, lower, digit, exceptions = {} }) {
    const map = {};
    for (let i = 0; i < 26; i++) {
        if (upper !== undefined) map[UP[i]] = String.fromCodePoint(upper + i);
        if (lower !== undefined) map[LO[i]] = String.fromCodePoint(lower + i);
    }
    if (digit !== undefined) {
        for (let i = 0; i < 10; i++) map[DG[i]] = String.fromCodePoint(digit + i);
    }
    for (const [k, v] of Object.entries(exceptions)) map[k] = String.fromCodePoint(v);
    return map;
}

function fromStrings(upperStr, lowerStr) {
    const map = {};
    const u = [...upperStr];
    const l = [...lowerStr];
    for (let i = 0; i < 26; i++) {
        if (u[i]) map[UP[i]] = u[i];
        if (l[i]) map[LO[i]] = l[i];
    }
    return map;
}

function apply(text, map) {
    return [...text].map(ch => map[ch] ?? ch).join('');
}

function combine(text, mark) {
    return [...text].map(ch => (ch === ' ' ? ch : ch + mark)).join('');
}

/* ---------- character maps ---------- */

const circled = rangeMap({ upper: 0x24B6, lower: 0x24D0 });
for (let i = 1; i <= 9; i++) circled[String(i)] = String.fromCodePoint(0x245F + i);
circled['0'] = '⓪';

const smallCaps = fromStrings(
    'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ',
    'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ'
);

const FLIP_PAIRS = {
    a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ', i: 'ᴉ', j: 'ɾ',
    k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd', q: 'b', r: 'ɹ', s: 's', t: 'ʇ',
    u: 'n', v: 'ʌ', w: 'ʍ', x: 'x', y: 'ʎ', z: 'z',
    A: '∀', B: 'ᗺ', C: 'Ɔ', D: 'ᗡ', E: 'Ǝ', F: 'Ⅎ', G: '⅁', H: 'H', I: 'I', J: 'ſ',
    K: 'ʞ', L: '˥', M: 'W', N: 'N', O: 'O', P: 'Ԁ', Q: 'Ό', R: 'ᴚ', S: 'S', T: '⊥',
    U: '∩', V: 'Λ', W: 'M', X: 'X', Y: '⅄', Z: 'Z',
    '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'ㄣ', '5': 'ϛ', '6': '9', '7': 'ㄥ', '8': '8', '9': '6', '0': '0',
    '.': '˙', ',': "'", '!': '¡', '?': '¿', '(': ')', ')': '(', '[': ']', ']': '[',
    '{': '}', '}': '{', '<': '>', '>': '<', '&': '⅋', '_': '‾'
};

const fullwidth = rangeMap({ upper: 0xFF21, lower: 0xFF41, digit: 0xFF10 });

const maps = {
    boldSerif:   rangeMap({ upper: 0x1D400, lower: 0x1D41A, digit: 0x1D7CE }),
    italicSerif: rangeMap({ upper: 0x1D434, lower: 0x1D44E, exceptions: { h: 0x210E } }),
    boldItalic:  rangeMap({ upper: 0x1D468, lower: 0x1D482 }),
    script:      rangeMap({
        upper: 0x1D49C, lower: 0x1D4B6,
        exceptions: { B: 0x212C, E: 0x2130, F: 0x2131, H: 0x210B, I: 0x2110, L: 0x2112, M: 0x2133, R: 0x211B, e: 0x212F, g: 0x210A, o: 0x2134 }
    }),
    boldScript:  rangeMap({ upper: 0x1D4D0, lower: 0x1D4EA }),
    fraktur:     rangeMap({
        upper: 0x1D504, lower: 0x1D51E,
        exceptions: { C: 0x212D, H: 0x210C, I: 0x2111, R: 0x211C, Z: 0x2128 }
    }),
    boldFraktur: rangeMap({ upper: 0x1D56C, lower: 0x1D586 }),
    doubleStruck: rangeMap({
        upper: 0x1D538, lower: 0x1D552, digit: 0x1D7D8,
        exceptions: { C: 0x2102, H: 0x210D, N: 0x2115, P: 0x2119, Q: 0x211A, R: 0x211D, Z: 0x2124 }
    }),
    sans:        rangeMap({ upper: 0x1D5A0, lower: 0x1D5BA, digit: 0x1D7E2 }),
    sansBold:    rangeMap({ upper: 0x1D5D4, lower: 0x1D5EE, digit: 0x1D7EC }),
    sansItalic:  rangeMap({ upper: 0x1D608, lower: 0x1D622 }),
    sansBoldItalic: rangeMap({ upper: 0x1D63C, lower: 0x1D656 }),
    mono:        rangeMap({ upper: 0x1D670, lower: 0x1D68A, digit: 0x1D7F6 }),
    negCircled:  rangeMap({ upper: 0x1F150, lower: 0x1F150 }),
    squared:     rangeMap({ upper: 0x1F130, lower: 0x1F130 }),
    negSquared:  rangeMap({ upper: 0x1F170, lower: 0x1F170 })
};

/* ---------- style list (order = style number) ---------- */

const STYLES = [
    ['Bold Serif',        t => apply(t, maps.boldSerif)],
    ['Italic Serif',      t => apply(t, maps.italicSerif)],
    ['Bold Italic Serif', t => apply(t, maps.boldItalic)],
    ['Script',            t => apply(t, maps.script)],
    ['Bold Script',       t => apply(t, maps.boldScript)],
    ['Fraktur',           t => apply(t, maps.fraktur)],
    ['Bold Fraktur',      t => apply(t, maps.boldFraktur)],
    ['Double Struck',     t => apply(t, maps.doubleStruck)],
    ['Sans',              t => apply(t, maps.sans)],
    ['Sans Bold',         t => apply(t, maps.sansBold)],
    ['Sans Italic',       t => apply(t, maps.sansItalic)],
    ['Sans Bold Italic',  t => apply(t, maps.sansBoldItalic)],
    ['Monospace',         t => apply(t, maps.mono)],
    ['Bubbles',           t => apply(t, circled)],
    ['Black Bubbles',     t => apply(t.toUpperCase(), maps.negCircled)],
    ['Squares',           t => apply(t.toUpperCase(), maps.squared)],
    ['Black Squares',     t => apply(t.toUpperCase(), maps.negSquared)],
    ['Small Caps',        t => apply(t.toLowerCase(), smallCaps)],
    ['Full Width',        t => apply(t, fullwidth).replace(/ /g, '\u3000')],
    ['Upside Down',       t => [...t].map(ch => FLIP_PAIRS[ch] ?? ch).reverse().join('')],
    ['Strikethrough',     t => combine(t, '\u0336')],
    ['Underline',         t => combine(t, '\u0332')],
    ['Slash Through',     t => combine(t, '\u0338')],
    ['Wavy',              t => combine(t, '\u0303')],
    ['Dotted',            t => combine(t, '\u0307')]
];

const MAX_INPUT = 100;

function box(lines) {
    return `┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗙𝗔𝗡𝗖𝗬* ◈\n┃\n${lines.join('\n')}\n┃\n┗▣`;
}

cmd({
    pattern: 'fancy',
    name: 'fancy',
    category: 'Tools',
    description: 'Turn text into fancy fonts (.fancy hello, .fancy 4 hello)',
    aliases: ['font', 'fonts', 'style'],
    react: '✨',
    filename: __filename
}, async (sock, m, args) => {
    try {
        const prefix = global.BOT_PREFIX || '.';
        let parts = args.map(a => a.trim()).filter(Boolean);

        // optional style number first: .fancy 4 hello
        let styleNo = null;
        if (parts.length && /^\d+$/.test(parts[0]) && parts.length > 1) {
            styleNo = parseInt(parts[0], 10);
            parts = parts.slice(1);
        } else if (parts.length === 1 && /^\d+$/.test(parts[0]) && m.quoted?.body) {
            styleNo = parseInt(parts[0], 10);
            parts = [];
        }

        let text = parts.join(' ');
        if (!text && m.quoted?.body) text = m.quoted.body;

        if (!text) {
            return m.reply(box([
                '┃│ ✨ Fancy Text Maker',
                '┃│',
                '┃│ Usage:',
                `┃│ ★ ${prefix}fancy hello world`,
                `┃│ ★ ${prefix}fancy 4 hello world`,
                '┃│ ★ Reply to a message with .fancy',
                '┃│',
                `┃│ ${STYLES.length} styles available (1-${STYLES.length})`
            ]));
        }

        if (text.length > MAX_INPUT) text = text.slice(0, MAX_INPUT);

        // single style
        if (styleNo !== null) {
            if (styleNo < 1 || styleNo > STYLES.length) {
                return m.reply(box([
                    `┃│ ❌ Pick a style from 1 to ${STYLES.length}`,
                    `┃│ ★ ${prefix}fancy ${STYLES.length} ${text}`
                ]));
            }
            const [name, fn] = STYLES[styleNo - 1];
            return m.reply(fn(text));
        }

        // all styles
        const lines = STYLES.map(([name, fn], i) => `┃│ *${i + 1}. ${name}*\n┃│ ${fn(text)}\n┃│`);
        lines.push(`┃│ 💡 ${prefix}fancy <number> ${text.length > 12 ? 'text' : text} for one style only`);
        return m.reply(box(lines));

    } catch (err) {
        console.error('Fancy error:', err.message);
        return m.reply(box(['┃│ ❌ Could not generate fancy text.']));
    }
});
