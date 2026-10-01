'use strict';

const {
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    proto
} = require('@whiskeysockets/baileys');

const { cmd } = require('../arslan');

cmd({
    pattern: 'groupstatus',
    name: 'groupstatus',
    category: 'Status',
    description: 'Send a group status silently',
    aliases: ['gstatus'],
    tags: ['group', 'status'],
    command: /^\.?(groupstatus|gstatus)$/i,
    filename: __filename
}, async (sock, m, args) => {

    try {

        const prefix = global.BOT_PREFIX || '.';

        const normalize = jid =>
            jid?.split(':')[0];

        const sender = normalize(m.sender);
        const botId = normalize(sock.user?.id);

        const owners =
            (global.owners || []).map(normalize);

        const isOwner =
            owners.includes(sender) ||
            sender === botId;

        if (!isOwner) {
            return;
        }

        const COLORS = {
            green: 0xFF25D366,
            red: 0xFFFF0000,
            blue: 0xFF0000FF,
            yellow: 0xFFFFFF00,
            purple: 0xFF800080,
            black: 0xFF000000,
            white: 0xFFFFFFFF,
            orange: 0xFFFFA500
        };

        let groupId;
        let messageText;
        let chosenColor = COLORS.green;
        let quoted = m.quoted;

        // OUTSIDE GROUP
        if (!m.isGroup) {

            if (quoted) {

                if (!args.length) {
                    return await sock.sendMessage(m.from, {
                        text: [
                            '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗚𝗥𝗢𝗨𝗣 𝗦𝗧𝗔𝗧𝗨𝗦* ◈',
                            '┃',
                            '┃│ ❌ Group JID Required',
                            '┃│',
                            '┃│ Usage:',
                            `┃│ ★ ${prefix}gstatus <group-jid>`,
                            '┃',
                            '┃│ Example:',
                            `┃│ ★ ${prefix}gstatus 123456789-123456@g.us`,
                            '┃',
                            '┗▣'
                        ].join('\n')
                    });
                }

                groupId = args[0];

            } else {

                if (!args.length) {
                    return await sock.sendMessage(m.from, {
                        text: [
                            '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗚𝗥𝗢𝗨𝗣 𝗦𝗧𝗔𝗧𝗨𝗦* ◈',
                            '┃',
                            '┃│ ❌ Invalid Format',
                            '┃│',
                            '┃│ Usage:',
                            `┃│ ★ ${prefix}gstatus groupjid,text,color`,
                            '┃',
                            '┃│ Example:',
                            `┃│ ★ ${prefix}gstatus 123456789-123456@g.us,Hello group!,blue`,
                            '┃',
                            '┗▣'
                        ].join('\n')
                    });
                }

                const fullText = args.join(' ');

                const parts = fullText
                    .split(',')
                    .map(part => part.trim());

                if (parts.length < 2) {
                    return await sock.sendMessage(m.from, {
                        text: [
                            '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗚𝗥𝗢𝗨𝗣 𝗦𝗧𝗔𝗧𝗨𝗦* ◈',
                            '┃',
                            '┃│ ❌ Missing Information',
                            '┃│',
                            '┃│ Required:',
                            '┃│ 1. Group JID',
                            '┃│ 2. Status text',
                            '┃',
                            '┃│ Example:',
                            `┃│ ★ ${prefix}gstatus 123456789-123456@g.us,Hello group!,blue`,
                            '┃',
                            '┗▣'
                        ].join('\n')
                    });
                }

                groupId = parts[0];
                messageText = parts[1];

                if (parts[2]) {
                    const color = parts[2].toLowerCase();

                    if (COLORS[color]) {
                        chosenColor = COLORS[color];
                    }
                }
            }

        } else {

            groupId = m.from;
            quoted = m.quoted;
        }

        // VALIDATE GROUP JID
        if (
            !groupId ||
            !groupId.endsWith('@g.us')
        ) {

            if (!m.isGroup) {
                return await sock.sendMessage(m.from, {
                    text: [
                        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗚𝗥𝗢𝗨𝗣 𝗦𝗧𝗔𝗧𝗨𝗦* ◈',
                        '┃',
                        '┃│ ❌ Invalid Group JID',
                        '┃│',
                        '┃│ Example:',
                        '┃│ 123456789-123456@g.us',
                        '┃',
                        '┗▣'
                    ].join('\n')
                });
            }

            return;
        }

        // BUILD STATUS MESSAGE
        let innerMessage;

        if (quoted) {

            // IMAGE
            if (quoted.message?.imageMessage) {

                const buffer = await quoted.download();

                const media = await prepareWAMessageMedia(
                    {
                        image: buffer,
                        caption:
                            quoted.message.imageMessage.caption || ''
                    },
                    {
                        upload: sock.waUploadToServer
                    }
                );

                innerMessage = {
                    imageMessage: media.imageMessage
                };
            }

            // VIDEO
            else if (quoted.message?.videoMessage) {

                const buffer = await quoted.download();

                const media = await prepareWAMessageMedia(
                    {
                        video: buffer,
                        caption:
                            quoted.message.videoMessage.caption || ''
                    },
                    {
                        upload: sock.waUploadToServer
                    }
                );

                innerMessage = {
                    videoMessage: media.videoMessage
                };
            }

            // AUDIO
            else if (quoted.message?.audioMessage) {

                const buffer = await quoted.download();

                const media = await prepareWAMessageMedia(
                    {
                        audio: buffer,
                        mimetype:
                            quoted.message.audioMessage.mimetype ||
                            'audio/mp4',
                        ptt:
                            quoted.message.audioMessage.ptt || false
                    },
                    {
                        upload: sock.waUploadToServer
                    }
                );

                innerMessage = {
                    audioMessage: media.audioMessage
                };
            }

            // UNSUPPORTED
            else {

                if (!m.isGroup) {
                    return await sock.sendMessage(m.from, {
                        text: [
                            '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗚𝗥𝗢𝗨𝗣 𝗦𝗧𝗔𝗧𝗨𝗦* ◈',
                            '┃',
                            '┃│ ❌ Unsupported Media',
                            '┃│',
                            '┃│ Quote an image, video,',
                            '┃│ or audio message.',
                            '┃',
                            '┗▣'
                        ].join('\n')
                    });
                }

                return;
            }

        } else {

            if (!messageText) {

                if (!m.isGroup) {
                    return await sock.sendMessage(m.from, {
                        text: [
                            '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗚𝗥𝗢𝗨𝗣 𝗦𝗧𝗔𝗧𝗨𝗦* ◈',
                            '┃',
                            '┃│ ❌ No Status Text',
                            '┃│',
                            '┃│ Please provide status text.',
                            '┃',
                            '┗▣'
                        ].join('\n')
                    });
                }

                return;
            }

            // TEXT STATUS
            innerMessage = {
                extendedTextMessage: {
                    text: messageText,
                    backgroundArgb: chosenColor,
                    font: 1
                }
            };
        }

        // GROUP STATUS PAYLOAD
        const content = {
            groupStatusMessageV2: {
                message: innerMessage
            }
        };

        const msg = generateWAMessageFromContent(
            groupId,
            proto.Message.fromObject(content),
            {
                userJid: sock.user.id
            }
        );

        // SEND GROUP STATUS
        await sock.relayMessage(
            groupId,
            msg.message,
            {
                messageId: msg.key.id
            }
        );

        // SUCCESS
        if (!m.isGroup) {

            await sock.sendMessage(m.from, {
                text: [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗚𝗥𝗢𝗨𝗣 𝗦𝗧𝗔𝗧𝗨𝗦* ◈',
                    '┃',
                    '┃│ 🟢 Status Sent',
                    '┃│',
                    `┃│ 🎯 Target : ${groupId}`,
                    '┃│ 🚀 Published Successfully',
                    '┃',
                    '┗▣'
                ].join('\n')
            });
        }

    } catch (err) {

        console.error(
            '[FREEZER-MD] GroupStatus Error:',
            err
        );

        if (!m.isGroup) {

            await sock.sendMessage(m.from, {
                text: [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗚𝗥𝗢𝗨𝗣 𝗦𝗧𝗔𝗧𝗨𝗦* ◈',
                    '┃',
                    '┃│ ❌ Status Failed',
                    '┃│',
                    `┃│ ${String(
                        err.message || err
                    ).substring(0, 180)}`,
                    '┃',
                    '┗▣'
                ].join('\n')
            }).catch(() => {});
        }
    }
});
