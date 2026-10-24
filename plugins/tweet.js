'use strict';

const { cmd } = require('../arslan');
const { box, num, goOnline } = require('../lib/groupTools');
const { getCtx } = require('../lib/mediaTools');

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrap(text, max = 42) {
    const lines = [];
    for (const para of text.split('\n')) {
        let cur = '';
        for (const word of para.split(/\s+/)) {
            if ((cur + ' ' + word).trim().length > max) { lines.push(cur.trim()); cur = word; }
            else cur += ' ' + word;
        }
        lines.push(cur.trim());
    }
    return lines.slice(0, 14);
}

cmd({
    pattern: 'tweet',
    name: 'tweet',
    description: 'Make a tweet image: .tweet text  or  .tweet Name | text',
    aliases: ['faketweet'],
    filename: __filename
}, async (sock, m, args) => {
    await goOnline(sock, m);

    let sharp;
    try { sharp = require('sharp'); } catch {
        return m.reply(box('TWEET', ['❌ Needs sharp. Run: npm install sharp']));
    }

    const q = getCtx(m).quotedMessage;
    let raw = args.join(' ').trim() || q?.conversation || q?.extendedTextMessage?.text || '';
    if (!raw) return m.reply(box('TWEET', [`❌ Usage: ${global.BOT_PREFIX}tweet Hello world`, `📌 Or: ${global.BOT_PREFIX}tweet Popkid | Hello world`]));

    let name = m.pushName || num(m.sender);
    if (raw.includes('|')) {
        const [n, ...rest] = raw.split('|');
        if (n.trim() && rest.join('|').trim()) { name = n.trim(); raw = rest.join('|').trim(); }
    }
    const handle = '@' + name.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 15);

    try {
        // Avatar (optional)
        let avatar = '';
        try {
            const url = await sock.profilePictureUrl(m.sender, 'image');
            const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
            const png = await sharp(buf).resize(96, 96).png().toBuffer();
            avatar = `<image href="data:image/png;base64,${png.toString('base64')}" x="32" y="32" width="96" height="96" clip-path="url(#av)"/>`;
        } catch {
            avatar = '<circle cx="80" cy="80" r="48" fill="#333639"/>';
        }

        const lines = wrap(raw);
        const textY = 170;
        const lineH = 42;
        const height = textY + lines.length * lineH + 110;
        const stamp = new Date().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' });

        const textSvg = lines.map((l, i) =>
            `<text x="32" y="${textY + i * lineH}" font-size="34" fill="#e7e9ea">${esc(l)}</text>`).join('');

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${height}" font-family="Helvetica, Arial, DejaVu Sans, sans-serif">
  <defs><clipPath id="av"><circle cx="80" cy="80" r="48"/></clipPath></defs>
  <rect width="720" height="${height}" rx="24" fill="#000"/>
  ${avatar}
  <text x="146" y="72" font-size="32" font-weight="bold" fill="#e7e9ea">${esc(name.slice(0, 22))}</text>
  <circle cx="${146 + Math.min(name.length, 22) * 18 + 26}" cy="62" r="12" fill="#1d9bf0"/>
  <text x="146" y="108" font-size="26" fill="#71767b">${esc(handle)}</text>
  ${textSvg}
  <text x="32" y="${height - 56}" font-size="24" fill="#71767b">${esc(stamp)}</text>
  <line x1="32" y1="${height - 36}" x2="688" y2="${height - 36}" stroke="#2f3336" stroke-width="2"/>
</svg>`;

        const out = await sharp(Buffer.from(svg)).png().toBuffer();
        await sock.sendMessage(m.from, { image: out, caption: box('TWEET', ['✅ Tweet created']) });
    } catch (err) {
        await m.reply(box('TWEET', [`❌ Failed: ${err.message}`]));
    }
});
