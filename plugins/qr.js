'use strict';

const axios = require('axios');
const { cmd } = require('../arslan');
const { makeBox, FOOTER, quotedText } = require('../lib/freezer-ui');

const box = makeBox('QR Center');
const MAX_CHARS = 1000;

let QRCode = null;
try { QRCode = require('qrcode'); } catch (_) { /* falls back to the web service below */ }

async function makeQr(text) {
    if (QRCode) {
        return QRCode.toBuffer(text, { type: 'png', width: 700, margin: 2, errorCorrectionLevel: 'M' });
    }
    const res = await axios.get('https://api.qrserver.com/v1/create-qr-code/', {
        params: { size: '700x700', margin: 2, data: text },
        responseType: 'arraybuffer',
        timeout: 30000
    });
    return Buffer.from(res.data);
}

cmd({
    pattern: 'qr',
    name: 'qr',
    category: 'Tools',
    aliases: ['qrcode', 'makeqr'],
    description: 'Turn any text or link into a QR code',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';
    const text = (args || []).join(' ').trim() || quotedText(m);

    if (!text) {
        return m.reply(box(
            '🔳 *𝗤𝗥 𝗖𝗢𝗗𝗘*',
            '➤ Enter text or a link, or reply to a message.',
            '',
            `➤ ${prefix}qr https://example.com`,
            `➤ ${prefix}qr Hello from Freezer`
        ));
    }
    if (text.length > MAX_CHARS) {
        return m.reply(box('❌ *𝗧𝗘𝗫𝗧 𝗧𝗢𝗢 𝗟𝗢𝗡𝗚*', `➤ Max ${MAX_CHARS} characters for a QR code.`));
    }

    try {
        await m.react('🔳');
        const png = await makeQr(text);
        await m.reply({ image: png, caption: `🔳 ${text.length > 80 ? text.slice(0, 77) + '...' : text}\n\n${FOOTER}` });
        await m.react('✅');
    } catch (err) {
        console.error('[QR] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗤𝗥 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
