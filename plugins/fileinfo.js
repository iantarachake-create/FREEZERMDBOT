'use strict';

const { cmd } = require('../arslan');
const { makeBox, sizeText, nodeOf, mediaKind, extOf, mimeOf } = require('../lib/freezer-ui');

const box = makeBox('File Info');

const num = (v) => {
    const n = Number(String(v?.toString?.() ?? v ?? ''));
    return Number.isFinite(n) && n > 0 ? n : 0;
};

const clock = (sec) => {
    const s = Math.round(sec);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
};

const hexOf = (v) => {
    try { return Buffer.from(v).toString('hex').slice(0, 16); } catch (_) { return ''; }
};

cmd({
    pattern: 'fileinfo',
    name: 'fileinfo',
    category: 'Tools',
    aliases: ['finfo', 'mediainfo', 'fileinf'],
    description: 'Show details of a replied image, video, audio, sticker or file',
    filename: __filename
}, async (sock, m) => {
    const prefix = global.BOT_PREFIX || '.';
    const target = [m.quoted, m].find(x => mediaKind(x));

    if (!target) {
        return m.reply(box(
            '📄 *𝗙𝗜𝗟𝗘 𝗜𝗡𝗙𝗢*',
            '➤ Reply to an image, video, audio, sticker or document.',
            `➤ Example: reply with ${prefix}fileinfo`
        ));
    }

    try {
        const kind = mediaKind(target);
        const node = nodeOf(target);
        const mime = mimeOf(target) || String(node.mimetype || '').toLowerCase();
        const size = num(node.fileLength);
        const name = node.fileName || '';
        const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : extOf(mime);

        const icon = { image: '🖼️', video: '🎬', audio: '🎵', sticker: '🏷️', document: '📄' }[kind] || '📁';

        await m.reply(box(
            `${icon} *𝗙𝗜𝗟𝗘 𝗜𝗡𝗙𝗢*`,
            `➤ Type     : ${kind}${node.gifPlayback ? ' (GIF)' : ''}${node.ptt ? ' (voice note)' : ''}${node.isAnimated ? ' (animated)' : ''}`,
            name ? `➤ Name     : ${name.slice(0, 50)}` : null,
            `➤ Format   : ${ext || 'unknown'}`,
            `➤ Mime     : ${mime || 'unknown'}`,
            `➤ Size     : ${size ? `${sizeText(size)} (${size.toLocaleString()} bytes)` : 'unknown'}`,
            node.width && node.height ? `➤ Size px  : ${node.width} x ${node.height}` : null,
            node.seconds ? `➤ Duration : ${clock(num(node.seconds))}` : null,
            node.pageCount ? `➤ Pages    : ${num(node.pageCount)}` : null,
            node.viewOnce ? '➤ View once: yes' : null,
            node.caption ? `➤ Caption  : ${String(node.caption).slice(0, 60)}` : null,
            node.fileSha256 ? `➤ Hash     : ${hexOf(node.fileSha256)}...` : null
        ));
    } catch (err) {
        console.error('[FILEINFO] Error:', err.message);
        await m.reply(box('❌ *𝗜𝗡𝗙𝗢 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
