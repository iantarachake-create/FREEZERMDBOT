'use strict';

const { cmd } = require('../arslan');

cmd({
    pattern: 'group',
    name: 'group',
    category: 'Group',
    description: 'Professional Freezer-MD group management',
    aliases: [
        'gsettings',
        'grup',
        'gc',
        'groupinfo',
        'ginfo'
    ],
    tags: ['group', 'admin', 'management'],
    command: /^\.?(group|gsettings|grup|gc|groupinfo|ginfo)$/i,
    filename: __filename
}, async (sock, m, args) => {

    const prefix = global.BOT_PREFIX || '.';

    // ─────────────────────────────────────────────
    // FREEZER UI
    // ─────────────────────────────────────────────

    const box = (title, lines = []) => {
        return [
            `┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 ${title}* ◈`,
            '┃',
            ...lines.map(line => `┃│ ${line}`),
            '┃',
            '┗▣'
        ].join('\n');
    };

    const errorBox = (title, message) => {
        return box(title, [
            `❌ ${message}`
        ]);
    };

    const successBox = (title, lines) => {
        return box(title, [
            ...lines
        ]);
    };

    try {

        // ─────────────────────────────────────────
        // GROUP CHECK
        // ─────────────────────────────────────────

        if (!m?.isGroup) {
            return await m.reply(
                errorBox(
                    '𝗚𝗥𝗢𝗨𝗣 𝗠𝗔𝗡𝗔𝗚𝗘𝗥',
                    'This command can only be used inside a WhatsApp group.'
                )
            );
        }

        // ─────────────────────────────────────────
        // USER PERMISSION
        // ─────────────────────────────────────────

        if (!m.isOwner && !m.isAdmin) {
            return await m.reply(
                errorBox(
                    '𝗚𝗥𝗢𝗨𝗣 𝗠𝗔𝗡𝗔𝗚𝗘𝗥',
                    'Only group admins or the bot owner can use this command.'
                )
            );
        }

        // ─────────────────────────────────────────
        // GROUP METADATA
        // ─────────────────────────────────────────

        const metadata = m.groupMetadata || {};

        const groupName =
            metadata.subject || 'Unknown Group';

        const description =
            metadata.desc?.toString()?.trim() ||
            'No description set';

        const members =
            metadata.participants?.length || 0;

        const announce =
            Boolean(metadata.announce);

        // ─────────────────────────────────────────
        // BOT ADMIN CHECK
        // ─────────────────────────────────────────

        let botIsAdmin = true;

        try {

            const botId = sock?.user?.id
                ?.split(':')[0];

            if (botId && Array.isArray(metadata.participants)) {

                const botParticipant =
                    metadata.participants.find(
                        participant =>
                            participant.id?.split(':')[0] === botId
                    );

                if (botParticipant) {
                    botIsAdmin =
                        botParticipant.admin === 'admin' ||
                        botParticipant.admin === 'superadmin';
                }
            }

        } catch (adminCheckError) {

            console.warn(
                '[FREEZER-MD] Bot admin check failed:',
                adminCheckError.message
            );
        }

        // ─────────────────────────────────────────
        // GROUP INFORMATION
        // ─────────────────────────────────────────

        if (!args.length) {

            const status =
                announce
                    ? '🔒 Admins Only'
                    : '🔓 Everyone';

            const botStatus =
                botIsAdmin
                    ? '🟢 Admin'
                    : '🔴 Not Admin';

            const infoText = [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗚𝗥𝗢𝗨𝗣* ◈',
                '┃',
                '┃│ 👥 *GROUP INFO*',
                '┃',
                `┃│ 🏷️ Name        : ${groupName}`,
                `┃│ 👥 Members     : ${members}`,
                `┃│ 🔐 Mode        : ${status}`,
                `┃│ 🤖 Bot Status  : ${botStatus}`,
                `┃│ 📝 Description : ${description.substring(0, 150)}`,
                '┃',
                '┃│ ⚙️ *MANAGEMENT*',
                '┃│',
                `┃│ ❄️ ${prefix}group name <text>`,
                `┃│ ❄️ ${prefix}group desc <text>`,
                `┃│ ❄️ ${prefix}group mute`,
                `┃│ ❄️ ${prefix}group unmute`,
                `┃│ ❄️ ${prefix}group reset`,
                '┃',
                '┗▣'
            ].join('\n');

            return await m.reply(infoText);
        }

        // ─────────────────────────────────────────
        // COMMAND PARSER
        // ─────────────────────────────────────────

        const command =
            String(args[0] || '').toLowerCase().trim();

        const text =
            args
                .slice(1)
                .join(' ')
                .trim();

        // ─────────────────────────────────────────
        // VALIDATION
        // ─────────────────────────────────────────

        const requireText = (usage) => {

            if (!text) {
                throw new Error(
                    `Please provide the required text.\n\nExample:\n${usage}`
                );
            }
        };

        const requireBotAdmin = () => {

            if (!botIsAdmin) {
                throw new Error(
                    'I need to be a group admin before I can perform this action.'
                );
            }
        };

        // ─────────────────────────────────────────
        // CHANGE GROUP NAME
        // ─────────────────────────────────────────

        if (command === 'name') {

            requireBotAdmin();

            requireText(
                `${prefix}group name Freezer Cartel`
            );

            if (text.length > 100) {
                throw new Error(
                    'The group name is too long. Please keep it under 100 characters.'
                );
            }

            const oldName = groupName;

            await sock.groupUpdateSubject(
                m.from,
                text
            );

            return await m.reply(
                successBox(
                    '𝗚𝗥𝗢𝗨𝗣 𝗡𝗔𝗠𝗘',
                    [
                        `🏷️ Old : ${oldName}`,
                        `✨ New : ${text}`,
                        '🟢 Status : Updated'
                    ]
                )
            );
        }

        // ─────────────────────────────────────────
        // CHANGE GROUP DESCRIPTION
        // ─────────────────────────────────────────

        if (command === 'desc') {

            requireBotAdmin();

            requireText(
                `${prefix}group desc Welcome to Freezer Cartel`
            );

            if (text.length > 5000) {
                throw new Error(
                    'The group description is too long.'
                );
            }

            await sock.groupUpdateDescription(
                m.from,
                text
            );

            return await m.reply(
                successBox(
                    '𝗚𝗥𝗢𝗨𝗣 𝗗𝗘𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡',
                    [
                        '📝 New Description',
                        `┃ ${text.substring(0, 300)}`,
                        '🟢 Status : Updated'
                    ]
                )
            );
        }

        // ─────────────────────────────────────────
        // MUTE GROUP
        // ─────────────────────────────────────────

        if (command === 'mute') {

            requireBotAdmin();

            await sock.groupSettingUpdate(
                m.from,
                'announcement'
            );

            return await m.reply(
                successBox(
                    '𝗚𝗥𝗢𝗨𝗣 𝗠𝗨𝗧𝗘𝗗',
                    [
                        '🔒 Admins Only',
                        '🟢 Status : Enabled'
                    ]
                )
            );
        }

        // ─────────────────────────────────────────
        // UNMUTE GROUP
        // ─────────────────────────────────────────

        if (command === 'unmute') {

            requireBotAdmin();

            await sock.groupSettingUpdate(
                m.from,
                'not_announcement'
            );

            return await m.reply(
                successBox(
                    '𝗚𝗥𝗢𝗨𝗣 𝗨𝗡𝗠𝗨𝗧𝗘𝗗',
                    [
                        '🔓 Everyone Can Send',
                        '🟢 Status : Enabled'
                    ]
                )
            );
        }

        // ─────────────────────────────────────────
        // RESET DESCRIPTION
        // ─────────────────────────────────────────

        if (command === 'reset') {

            requireBotAdmin();

            await sock.groupUpdateDescription(
                m.from,
                ''
            );

            return await m.reply(
                successBox(
                    '𝗗𝗘𝗦𝗖𝗥𝗜𝗣𝗧𝗜𝗢𝗡 𝗥𝗘𝗦𝗘𝗧',
                    [
                        '🧹 Description Cleared',
                        '🟢 Status : Complete'
                    ]
                )
            );
        }

        // ─────────────────────────────────────────
        // INVALID COMMAND
        // ─────────────────────────────────────────

        return await m.reply(
            errorBox(
                '𝗚𝗥𝗢𝗨𝗣 𝗠𝗔𝗡𝗔𝗚𝗘𝗥',
                [
                    `Invalid option : *${command}*`,
                    '',
                    '*Available Commands*',
                    `❄️ ${prefix}group name <text>`,
                    `❄️ ${prefix}group desc <text>`,
                    `❄️ ${prefix}group mute`,
                    `❄️ ${prefix}group unmute`,
                    `❄️ ${prefix}group reset`
                ].join('\n')
            )
        );

    } catch (err) {

        console.error(
            '[FREEZER-MD] Group Manager Error:',
            err
        );

        const message =
            String(err?.message || 'Unknown error');

        return await m.reply(
            errorBox(
                '𝗔𝗖𝗧𝗜𝗢𝗡 𝗙𝗔𝗜𝗟𝗘𝗗',
                message.substring(0, 500)
            )
        );
    }
});
