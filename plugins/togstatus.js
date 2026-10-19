'use strict';

const {
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    proto
} = require('@whiskeysockets/baileys');

const { cmd } = require('../arslan');
const { box, guard } = require('../lib/groupTools');

const COLORS = {
    green: 0xFF25D366, red: 0xFFFF0000, blue: 0xFF0000FF, yellow: 0xFFFFFF00,
    purple: 0xFF800080, black: 0xFF000000, white: 0xFFFFFFFF, orange: 0xFFFFA500
};

cmd({
    pattern: 'togstatus',
    name: 'togstatus',
    category: 'Status',
    description: 'Post a group status (text, image, video or audio)',
    aliases: ['tgs', 'gstat'],
    filename: __filename
}, async (sock, m, args) => {
    const meta = await guard(sock, m, { needBotAdmin: false });
    if (!meta) return;

    const p = global.BOT_PREFIX || '.';
    let text = args.join(' ').trim();
    let color = COLORS.green;

    // optional "| color" at the end
    const cm = text.match(/\|\s*([a-z]+)\s*$/i);
    if (cm && COLORS[cm[1].toLowerCase()]) {
        color = COLORS[cm[1].toLowerCase()];
        text = text.slice(0, cm.index).trim();
    }

    const q = m.quoted;
    const qm = q?.message || {};
    const upload = { upload: sock.waUploadToServer };
    let inner;

    try {
        if (qm.imageMessage) {
            const media = await prepareWAMessageMedia(
                { image: await q.download(), caption: text || qm.imageMessage.caption || '' }, upload);
            inner = { imageMessage: media.imageMessage };
        } else if (qm.videoMessage) {
            const media = await prepareWAMessageMedia(
                { video: await q.download(), caption: text || qm.videoMessage.caption || '' }, upload);
            inner = { videoMessage: media.videoMessage };
        } else if (qm.audioMessage) {
            const media = await prepareWAMessageMedia(
                { audio: await q.download(), mimetype: qm.audioMessage.mimetype || 'audio/mp4', ptt: !!qm.audioMessage.ptt }, upload);
            inner = { audioMessage: media.audioMessage };
        } else {
            if (!text && q?.body) text = q.body;
            if (!text) {
                return m.reply(box('GROUP STATUS', [
                    '❌ Nothing to post.',
                    '',
                    `★ ${p}togstatus Hello group!`,
                    `★ ${p}togstatus Hello | blue`,
                    '★ Reply to an image / video / audio',
                    '',
                    'Colors: green red blue yellow',
                    'purple black white orange'
                ]));
            }
            inner = { extendedTextMessage: { text, backgroundArgb: color, font: 1 } };
        }

        const msg = generateWAMessageFromContent(
            m.from,
            proto.Message.fromObject({ groupStatusMessageV2: { message: inner } }),
            { userJid: sock.user.id }
        );
        await sock.relayMessage(m.from, msg.message, { messageId: msg.key.id });
        await m.react('✅').catch(() => {});
    } catch (err) {
        console.error('[FREEZER-MD] togstatus error:', err);
        await m.reply(box('GROUP STATUS', [`❌ Failed: ${err.message}`]));
    }
});
