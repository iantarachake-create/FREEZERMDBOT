const { cmd } = require('../arslan');
const { makeBox, FOOTER } = require('../freezer-ui');

const box = makeBox('Logo Maker');

/* Text logos are drawn locally (SVG -> PNG with sharp), so no web API is needed.
   Requires:  npm i sharp                                                        */
const W = 1200;
const H = 500;
const FONT = "'Arial Black', Impact, 'DejaVu Sans', Arial, sans-serif";
const MAX_CHARS = 30;

const esc = (s) => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

const fontSize = (t) => Math.floor(Math.min(180, Math.max(48, 1080 / Math.max(1, t.length * 0.68))));

const grad = (id, stops) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;

const glow = (id, dev) =>
    `<filter id="${id}" x="-30%" y="-40%" width="160%" height="180%"><feGaussianBlur in="SourceGraphic" stdDeviation="${dev}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`;

const txt = (t, s, attrs = '', dx = 0, dy = 0) =>
    `<text x="${W / 2 + dx}" y="${H / 2 + s * 0.35 + dy}" font-family="${FONT}" font-size="${s}" font-weight="900" text-anchor="middle" ${attrs}>${esc(t)}</text>`;

const rect = (fill) => `<rect width="${W}" height="${H}" fill="${fill}"/>`;

const wrap = (defs, body) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${body}</svg>`;

const EFFECTS = {
    neon: (t, s) => wrap(glow('g', 10),
        rect('#05010f') +
        txt(t, s, 'fill="#00f6ff" stroke="#00f6ff" stroke-width="6" filter="url(#g)"') +
        txt(t, s, 'fill="#ffffff" stroke="#bffcff" stroke-width="1.5"')),

    ice: (t, s) => wrap(
        grad('bg', [[0, '#06223f'], [1, '#02060f']]) + grad('t', [[0, '#ffffff'], [0.5, '#9eeaff'], [1, '#2a8fd6']]) + glow('g', 12),
        rect('url(#bg)') +
        txt(t, s, 'fill="#4fc3ff" filter="url(#g)"') +
        txt(t, s, 'fill="url(#t)" stroke="#d9f6ff" stroke-width="3"')),

    fire: (t, s) => wrap(
        grad('t', [[0, '#fff3a0'], [0.4, '#ffb300'], [0.75, '#ff4d00'], [1, '#a80000']]) + glow('g', 14),
        rect('#0d0300') +
        txt(t, s, 'fill="#ff6a00" filter="url(#g)"') +
        txt(t, s, 'fill="url(#t)"')),

    gold: (t, s) => wrap(
        grad('t', [[0, '#fff3b0'], [0.45, '#e0a81f'], [0.55, '#8a5f00'], [1, '#f3d063']]),
        rect('#050505') +
        txt(t, s, 'fill="url(#t)" stroke="#3a2600" stroke-width="4"')),

    glitch: (t, s) => wrap('',
        rect('#080808') +
        txt(t, s, 'fill="#ff003c" opacity="0.9"', -8, -3) +
        txt(t, s, 'fill="#00e5ff" opacity="0.9"', 8, 3) +
        txt(t, s, 'fill="#ffffff"')),

    '3d': (t, s) => {
        let layers = '';
        for (let i = 14; i >= 1; i--) {
            const c = 30 + (14 - i) * 6;
            layers += txt(t, s, `fill="rgb(${c},${c + 20},${c + 70})"`, i * 2, i * 2);
        }
        return wrap(grad('bg', [[0, '#101a33'], [1, '#05070f']]),
            rect('url(#bg)') + layers + txt(t, s, 'fill="#ffffff" stroke="#9db8ff" stroke-width="2"'));
    },

    chrome: (t, s) => wrap(
        grad('t', [[0, '#ffffff'], [0.45, '#9aa0a8'], [0.5, '#2b2e33'], [0.55, '#b9bec5'], [1, '#ffffff']]),
        rect('#0e0e12') +
        txt(t, s, 'fill="url(#t)" stroke="#555555" stroke-width="3"')),

    pink: (t, s) => wrap(glow('g', 10),
        rect('#000000') +
        txt(t, s, 'fill="#ff4fa3" stroke="#ff4fa3" stroke-width="6" filter="url(#g)"') +
        txt(t, s, 'fill="#ff4fa3" stroke="#ffffff" stroke-width="2"')),

    hacker: (t, s) => wrap(glow('g', 8),
        rect('#000500') +
        txt(t, s, 'fill="#00ff41" filter="url(#g)"') +
        txt(t, s, 'fill="#b6ffc8"'))
};

cmd({
    pattern: 'textpro',
    name: 'textpro',
    category: 'Creative',
    aliases: ['logo', 'textlogo', 'text3d'],
    description: 'Create stylish text logos',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';
    const names = Object.keys(EFFECTS);
    const effect = String(args?.[0] || '').toLowerCase();
    const text = (args || []).slice(1).join(' ').trim();

    if (!EFFECTS[effect] || !text) {
        return m.reply(box(
            '🎨 *𝗟𝗢𝗚𝗢 𝗠𝗔𝗞𝗘𝗥*',
            `➤ Usage: ${prefix}textpro <effect> <text>`,
            '',
            '📌 *𝗘𝗙𝗙𝗘𝗖𝗧𝗦*',
            ...names.map(n => `➤ ${n}`),
            '',
            `➤ Example: ${prefix}textpro ice Freezer`
        ));
    }

    if (text.length > MAX_CHARS) {
        return m.reply(box('❌ *𝗧𝗘𝗫𝗧 𝗧𝗢𝗢 𝗟𝗢𝗡𝗚*', `➤ Max ${MAX_CHARS} characters.`));
    }

    let sharp;
    try { sharp = require('sharp'); } catch (_) {
        return m.reply(box('❌ *𝗠𝗜𝗦𝗦𝗜𝗡𝗚 𝗣𝗔𝗖𝗞𝗔𝗚𝗘*', '➤ Run: npm i sharp'));
    }

    try {
        await m.react('🎨');
        const svg = EFFECTS[effect](text, fontSize(text));
        const png = await sharp(Buffer.from(svg)).png().toBuffer();
        await m.reply({ image: png, caption: `🎨 ${effect.toUpperCase()} • ${text}\n\n${FOOTER}` });
        await m.react('✅');
    } catch (err) {
        console.error('[TEXTPRO] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗟𝗢𝗚𝗢 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
