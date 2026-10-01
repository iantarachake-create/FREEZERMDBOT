'use strict';

const { cmd } = require('../arslan');

cmd({
    pattern: 'vv',
    name: 'viewonce',
    category: 'Tools',
    description: 'Save view-once image, video or audio',
    aliases: ['vo', 'once'],
    command: /^\.?(viewonce|vo|once)$/i,
    filename: __filename
}, async (sock, m) => {

    try {
        if (!m.quoted) {
            return m.reply([
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗩𝗜𝗘𝗪 𝗢𝗡𝗖𝗘* ◈',
                '┃',
                '┃│ ❌ No Media Found',
                '┃│',
                '┃│ Reply to a *View Once*',
                '┃│ image, video or audio.',
                '┃',
                '┃│ Usage: *.viewonce*',
                '┃',
                '┗▣'
            ].join('\n'));
        }

        const targetMsg = m.quoted;
        const message = targetMsg.message || {};

        console.log(
            '[FREEZER-MD] Quoted message:',
            Object.keys(message)
        );

        let mediaBuffer;
        let mimeType;
        let mediaType;

        // IMAGE
        if (message.imageMessage) {
            console.log('[FREEZER-MD] Downloading image...');

            mediaBuffer = await targetMsg.download();
            mimeType = message.imageMessage.mimetype || 'image/jpeg';
            mediaType = 'image';
        }

        // VIDEO
        else if (message.videoMessage) {
            console.log('[FREEZER-MD] Downloading video...');

            mediaBuffer = await targetMsg.download();
            mimeType = message.videoMessage.mimetype || 'video/mp4';
            mediaType = 'video';
        }

        // AUDIO
        else if (message.audioMessage) {
            console.log('[FREEZER-MD] Downloading audio...');

            mediaBuffer = await targetMsg.download();
            mimeType = message.audioMessage.mimetype || 'audio/ogg';
            mediaType = 'audio';
        }

        // UNSUPPORTED
        else {
            return m.reply([
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗩𝗜𝗘𝗪 𝗢𝗡𝗖𝗘* ◈',
                '┃',
                '┃│ ❌ Unsupported Media',
                '┃│',
                '┃│ Supported:',
                '┃│ 🖼️ Image',
                '┃│ 🎥 Video',
                '┃│ 🎵 Audio',
                '┃',
                '┗▣'
            ].join('\n'));
        }

        if (!mediaBuffer) {
            throw new Error('Media download returned empty buffer');
        }

        console.log(
            `[FREEZER-MD] ${mediaType} downloaded: ${mediaBuffer.length} bytes`
        );

        // IMAGE
        if (mediaType === 'image') {
            await sock.sendMessage(m.from, {
                image: mediaBuffer,
                mimetype: mimeType,
                caption: [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗩𝗜𝗘𝗪 𝗢𝗡𝗖𝗘* ◈',
                    '┃',
                    '┃│ 🖼️ Type   : Image',
                    '┃│ 🟢 Status : Saved',
                    '┃│ 🤖 Bot    : FREEZER MD BOT',
                    '┃',
                    '┗▣'
                ].join('\n')
            });
        }

        // VIDEO
        else if (mediaType === 'video') {
            await sock.sendMessage(m.from, {
                video: mediaBuffer,
                mimetype: mimeType,
                caption: [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗩𝗜𝗘𝗪 𝗢𝗡𝗖𝗘* ◈',
                    '┃',
                    '┃│ 🎥 Type   : Video',
                    '┃│ 🟢 Status : Saved',
                    '┃│ 🤖 Bot    : FREEZER MD BOT',
                    '┃',
                    '┗▣'
                ].join('\n')
            });
        }

        // AUDIO
        else if (mediaType === 'audio') {
            await sock.sendMessage(m.from, {
                audio: mediaBuffer,
                mimetype: mimeType,
                ptt: false
            });
        }

        console.log(
            `[FREEZER-MD] ${mediaType} sent successfully`
        );

    } catch (error) {

        console.error('[FREEZER-MD] ViewOnce Error:', error);

        return m.reply([
            '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗩𝗜𝗘𝗪 𝗢𝗡𝗖𝗘* ◈',
            '┃',
            '┃│ ❌ Failed to Save',
            '┃│',
            '┃│ Try replying directly to',
            '┃│ the View Once message.',
            '┃',
            '┗▣'
        ].join('\n'));
    }
});
