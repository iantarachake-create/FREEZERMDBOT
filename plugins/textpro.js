'use strict';

const sharp = require('sharp');
const { cmd } = require('../arslan');
const { box } = require('../lib/groupTools');

// Text-effect logos rendered locally (SVG -> PNG with sharp).
// No website or API key needed, so it keeps working offline.

const W = 1200, H = 500;
const FONT = "'DejaVu Sans', 'Liberation Sans', Arial, Helvetica, sans-serif";
const MONO = "'DejaVu Sans Mono', 'Liberation Mono', 'Courier New', monospace";

const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));
const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;

function layout(text) {
    const size = Math.max(48, Math.min(190, Math.floor(1040 / (text.length * 0.66))));
    return { size, x: W / 2, y: H / 2 + size * 0.35 };
}
const T = (t, L, attrs = '', dx = 0, dy = 0, font = FONT) =>
    `<text x="${L.x + dx}" y="${L.y + dy}" text-anchor="middle" font-family="${font}" font-weight="900" font-size="${L.size}" ${attrs}>${esc(t)}</text>`;
const bg = fill => `<rect width="100%" height="100%" fill="${fill}"/>`;
const glow = (id, std) =>
    `<filter id="${id}" x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="${std}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;
const grad = (id, stops) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map((c, i) =>
        `<stop offset="${Math.round(i / (stops.length - 1) * 100)}%" stop-color="${c}"/>`).join('')}</linearGradient>`;

const neon = (t, color) => {
    const L = layout(t);
    return svg(`<defs>${glow('g1', 14)}${glow('g2', 4)}</defs>${bg('#07070f')}` +
        T(t, L, `fill="none" stroke="${color}" stroke-width="10" opacity="0.85" filter="url(#g1)"`) +
        T(t, L, `fill="#ffffff" stroke="${color}" stroke-width="3" filter="url(#g2)"`));
};

const gradient = (t, { back, stops, stroke, glowColor }) => {
    const L = layout(t);
    return svg(`<defs>${grad('gt', stops)}${glow('g1', 16)}` +
        `<filter id="sh" x="-20%" y="-20%" width="150%" height="150%"><feGaussianBlur stdDeviation="5"/></filter></defs>${bg(back)}` +
        (glowColor ? T(t, L, `fill="${glowColor}" stroke="${glowColor}" stroke-width="12" opacity="0.55" filter="url(#g1)"`) : '') +
        T(t, L, 'fill="#000" opacity="0.6" filter="url(#sh)"', 6, 10) +
        T(t, L, `fill="url(#gt)" stroke="${stroke}" stroke-width="4" stroke-linejoin="round"`));
};

const STYLES = {
    neon:      t => neon(t, '#ff2bd6'),
    neonblue:  t => neon(t, '#18c8ff'),
    neongreen: t => neon(t, '#39ff14'),
    ice:    t => gradient(t, { back: '#04162b', stops: ['#ffffff', '#aee9ff', '#3aa0ff', '#1b5fd0'], stroke: '#e6fbff', glowColor: '#40c4ff' }),
    fire:   t => gradient(t, { back: '#0e0300', stops: ['#fff7a8', '#ffb300', '#ff5400', '#b80000'], stroke: '#3a0000', glowColor: '#ff6a00' }),
    gold:   t => gradient(t, { back: '#0b0b0b', stops: ['#fff3b0', '#f2c230', '#a67300', '#f7d86b', '#8a5a00'], stroke: '#4a3000', glowColor: '#b8860b' }),
    chrome: t => gradient(t, { back: '#15181d', stops: ['#ffffff', '#9aa3ad', '#ffffff', '#454b53', '#c9d1d9'], stroke: '#0b0d10' }),
    blood:  t => gradient(t, { back: '#080000', stops: ['#ff3b3b', '#a00000', '#4a0000'], stroke: '#1a0000', glowColor: '#ff0000' }),
    sunset: t => gradient(t, { back: '#1b0b2e', stops: ['#ffe29f', '#ff7e5f', '#d63384', '#6a11cb'], stroke: '#2a0845' }),
    glitch: t => {
        const L = layout(t);
        return svg(`${bg('#0b0b0f')}` +
            T(t, L, 'fill="#00fff0" opacity="0.9"', -7, 0) +
            T(t, L, 'fill="#ff003c" opacity="0.9"', 7, 0) +
            T(t, L, 'fill="#ffffff"') +
            [90, 170, 250, 330, 410].map((y, i) =>
                `<rect x="${(i * 211) % 400}" y="${y}" width="${500 + (i * 97) % 400}" height="6" fill="#0b0b0f" opacity="0.9"/>`).join(''));
    },
    '3d': t => {
        const L = layout(t);
        let layers = '';
        for (let i = 16; i >= 1; i--) layers += T(t, L, `fill="${i % 2 ? '#b8000f' : '#8e000c'}"`, i, i);
        return svg(`<defs>${grad('bgd', ['#2b2d42', '#14151f'])}</defs>${bg('url(#bgd)')}` + layers +
            T(t, L, 'fill="#ff4d5e" stroke="#ffd0d4" stroke-width="3"'));
    },
    matrix: t => {
        const L = layout(t);
        const rain = Array.from({ length: 28 }, (_, i) =>
            `<text x="${20 + i * 43}" y="${40 + (i * 53) % 440}" font-family="${MONO}" font-size="26" fill="#00ff41" opacity="0.18">${(i * 7) % 2}${(i * 3) % 2}${(i * 5) % 2}</text>`).join('');
        return svg(`<defs>${glow('g1', 8)}</defs>${bg('#000')}${rain}` +
            T(t, L, 'fill="#00ff41" opacity="0.8" filter="url(#g1)"', 0, 0, MONO) +
            T(t, L, 'fill="#caffd8"', 0, 0, MONO));
    }
};

cmd({
    pattern: 'textpro',
    name: 'textpro',
    category: 'Tools',
    description: 'Create a stylish text logo',
    aliases: ['logo', 'textlogo'],
    filename: __filename
}, async (sock, m, args) => {
    const p = global.BOT_PREFIX || '.';
    const names = Object.keys(STYLES);

    if (!args.length) {
        return m.reply(box('TEXTPRO', [
            '🎨 Text logo maker',
            '',
            `★ ${p}textpro <style> <text>`,
            `★ ${p}textpro ice Freezer`,
            '',
            '📚 Styles:',
            ...names.map(n => `   • ${n}`),
            '',
            'No style given = neon'
        ]));
    }

    let style = args[0].toLowerCase();
    let text;
    if (STYLES[style]) text = args.slice(1).join(' ').trim();
    else { style = 'neon'; text = args.join(' ').trim(); }

    if (!text) return m.reply(box('TEXTPRO', [`❌ Add some text: ${p}textpro ${style} Freezer`]));
    if (text.length > 24) return m.reply(box('TEXTPRO', ['❌ Max 24 characters.']));

    try {
        await m.react('⌛').catch(() => {});
        const png = await sharp(Buffer.from(STYLES[style](text))).png().toBuffer();
        await m.reply(png, { caption: box('TEXTPRO', [`🎨 Style : ${style}`, `✍️ Text  : ${text}`]) });
        await m.react('✅').catch(() => {});
    } catch (err) {
        console.error('[FREEZER-MD] textpro error:', err);
        await m.reply(box('TEXTPRO', [`❌ Failed: ${err.message}`]));
    }
});

