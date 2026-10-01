'use strict';

const { cmd } = require('../arslan');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const types = {
    imageMessage: 'image',
    videoMessage: 'video',
    stickerMessage: 'sticker',
    audioMessage: 'audio',
    pttMessage: 'audio',
    documentMessage: 'document'
};

async function downloadMedia(quoted) {
    const type = quoted.type;
    const mediaType = types[type];

    if (!mediaType) return null;

    try {
        const node = quoted.message?.[type];
        const stream = await downloadContentFromMessage(node, mediaType);
        const chunks = [];

        for await (const chunk of stream)
            chunks.push(chunk);

        const buffer = Buffer.concat(chunks);

        return buffer.length ? buffer : null;
    } catch {
        try {
            return await quoted.download();
        } catch {
            return null;
        }
    }
}

cmd({
    pattern: 'sv',
    name: 'sv',
    category: 'Tools',
    aliases: ['save', 'savemedia'],
    description: 'Save quoted media to your DM',
    filename: __filename
}, async (sock, m) => {

    if (!m.quoted) {
        return m.reply(
            '┏▣ ◈ *💾 SAVE* ◈\n' +
            '┃\n' +
            '┃│ Reply to a message first.\n' +
            '┃\n' +
            '┗▣'
        );
    }

    await m.react('💾');

    const quoted = m.quoted;
    const type = quoted.type || '';
    const node = quoted.message?.[type] || {};
    const target = m.sender.split('@')[0].split(':')[0] + '@s.whatsapp.net';

    try {
        const caption = quoted.body || node.caption || '';
        const mime = quoted.mimetype || node.mimetype || '';

        if (types[type]) {

            const buffer = await downloadMedia(quoted);

            if (!buffer)
                throw new Error('Media download failed');

            if (type === 'imageMessage') {
                await sock.sendMessage(target, {
                    image: buffer,
                    caption
                });

            } else if (type === 'videoMessage') {
                await sock.sendMessage(target, {
                    video: buffer,
                    caption
                });

            } else if (type === 'stickerMessage') {
                await sock.sendMessage(target, {
                    sticker: buffer
                });

            } else if (
                type === 'audioMessage' ||
                type === 'pttMessage'
            ) {
                await sock.sendMessage(target, {
                    audio: buffer,
                    mimetype: mime || 'audio/ogg; codecs=opus',
                    ptt: type === 'pttMessage'
                });

            } else if (type === 'documentMessage') {
                await sock.sendMessage(target, {
                    document: buffer,
                    mimetype: mime || 'application/octet-stream',
                    fileName: node.fileName || 'file'
                });
            }

        } else {

            const text = quoted.body || node.caption || '';

            if (text) {
                await sock.sendMessage(target, { text });
            } else {
                await sock.sendMessage(target, {
                    forward: {
                        key: quoted.key,
                        message: quoted.message
                    }
                });
            }
        }

        await m.react('✅');

    } catch (error) {

        console.error('[SAVE]', error.message);

        await m.react('❌').catch(() => {});
    }
});
