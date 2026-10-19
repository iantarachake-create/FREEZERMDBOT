'use strict';

const { cmd } = require('../arslan');
const { box, guard } = require('../lib/groupTools');

cmd({
    pattern: 'retag',
    name: 'retag',
    category: 'Group',
    description: 'Re-send a replied message and tag everyone silently',
    aliases: ['rtag', 'hidetag'],
    filename: __filename
}, async (sock, m, args) => {
    const meta = await guard(sock, m, { needBotAdmin: false });
    if (!meta) return;

    const p = global.BOT_PREFIX || '.';
    const mentions = meta.participants.map(x => x.id);
    const text = args.join(' ').trim();
    const q = m.quoted;

    if (!q) {
        if (!text) {
            return m.reply(box('RETAG', [
                '❌ Reply to a message (text, image,',
                '   video, audio, sticker, file)',
                '   or type some text.',
                '',
                `★ ${p}retag`,
                `★ ${p}retag Meeting at 5pm`
            ]));
        }
        return sock.sendMessage(m.from, { text, mentions });
    }

    try {
        const msg = q.message || {};
        let content;

        if (msg.conversation || msg.extendedTextMessage) {
            content = { text: text || q.body, mentions };
        } else if (q.isMedia) {
            const buffer = await q.download();
            if (msg.imageMessage) {
                content = { image: buffer, caption: text || msg.imageMessage.caption || '', mentions };
            } else if (msg.videoMessage) {
                content = {
                    video: buffer, mimetype: q.mimetype || 'video/mp4',
                    caption: text || msg.videoMessage.caption || '',
                    gifPlayback: !!msg.videoMessage.gifPlayback, mentions
                };
            } else if (msg.audioMessage) {
                content = { audio: buffer, mimetype: q.mimetype || 'audio/mp4', ptt: !!msg.audioMessage.ptt, mentions };
            } else if (msg.stickerMessage) {
                content = { sticker: buffer, mentions };
            } else if (msg.documentMessage) {
                content = {
                    document: buffer, mimetype: q.mimetype || 'application/octet-stream',
                    fileName: msg.documentMessage.fileName || 'file',
                    caption: text || msg.documentMessage.caption || '', mentions
                };
            }
        }

        if (!content) return m.reply(box('RETAG', ['❌ That message type is not supported.']));
        await sock.sendMessage(m.from, content);
    } catch (err) {
        console.error('[FREEZER-MD] retag error:', err);
        await m.reply(box('RETAG', [`❌ Failed: ${err.message}`]));
    }
});
