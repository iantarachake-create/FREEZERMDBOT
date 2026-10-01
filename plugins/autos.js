'use strict';

const { cmd } = require('../arslan');

cmd({
    pattern: 'autofeature',
    name: 'autofeature',
    category: 'Admin',
    aliases: ['af'],
    description: 'Control Freezer-MD automatic features',
    filename: __filename
}, async (sock, m, args) => {

    try {

        const prefix = global.BOT_PREFIX || '.';

        // ─────────────────────────────────────────────
        // OWNER CHECK
        // ─────────────────────────────────────────────

        const normalizeJid = (jid) =>
            jid?.split(':')[0];

        const sender =
            normalizeJid(m.sender);

        const owners =
            (global.owners || [])
                .map(normalizeJid);

        const devs =
            (global.dev || [])
                .map(normalizeJid);

        const botId =
            normalizeJid(sock.user?.id);

        const isOwner =
            owners.includes(sender) ||
            devs.includes(sender) ||
            sender === botId;

        if (!isOwner) {
            return;
        }

        // ─────────────────────────────────────────────
        // HELPERS
        // ─────────────────────────────────────────────

        const onOff = (value) => {
            if (value === 'on') return true;
            if (value === 'off') return false;
            return null;
        };

        const status = (value) =>
            value ? '🟢 ON' : '🔴 OFF';

        const sub =
            (args[0] || '').toLowerCase().trim();

        const val =
            (args[1] || '').toLowerCase().trim();

        // ─────────────────────────────────────────────
        // AUTO READ
        // ─────────────────────────────────────────────

        if (sub === 'read') {

            const parsed = onOff(val);

            if (parsed === null) {
                return await m.reply(
                    [
                        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗨𝗧𝗢-𝗥𝗘𝗔𝗗* ◈',
                        '┃',
                        `┃│ 📖 Current : ${status(global.autoRead)}`,
                        '┃',
                        '┃│ Usage',
                        `┃│ ❄️ ${prefix}autofeature read on`,
                        `┃│ ❄️ ${prefix}autofeature read off`,
                        '┃',
                        '┗▣'
                    ].join('\n')
                );
            }

            global.autoRead = parsed;

            return await m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗨𝗧𝗢-𝗥𝗘𝗔𝗗* ◈',
                    '┃',
                    `┃│ 📖 Status : ${status(parsed)}`,
                    '┃│ 🟢 Settings Applied',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        // ─────────────────────────────────────────────
        // AUTO VIEW
        // ─────────────────────────────────────────────

        if (sub === 'view') {

            const parsed = onOff(val);

            if (parsed === null) {
                return await m.reply(
                    [
                        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗨𝗧𝗢-𝗩𝗜𝗘𝗪* ◈',
                        '┃',
                        `┃│ 👁️ Current : ${status(global.autoView)}`,
                        '┃',
                        '┃│ Usage',
                        `┃│ ❄️ ${prefix}autofeature view on`,
                        `┃│ ❄️ ${prefix}autofeature view off`,
                        '┃',
                        '┗▣'
                    ].join('\n')
                );
            }

            global.autoView = parsed;

            return await m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗨𝗧𝗢-𝗩𝗜𝗘𝗪* ◈',
                    '┃',
                    `┃│ 👁️ Status : ${status(parsed)}`,
                    '┃│ 🟢 Settings Applied',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        // ─────────────────────────────────────────────
        // AUTO LIKE
        // ─────────────────────────────────────────────

        if (sub === 'like') {

            const parsed = onOff(val);

            if (parsed === null) {
                return await m.reply(
                    [
                        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗨𝗧𝗢-𝗟𝗜𝗞𝗘* ◈',
                        '┃',
                        `┃│ ❤️ Current : ${status(global.autoLike)}`,
                        '┃',
                        '┃│ Usage',
                        `┃│ ❄️ ${prefix}autofeature like on`,
                        `┃│ ❄️ ${prefix}autofeature like off`,
                        '┃',
                        '┗▣'
                    ].join('\n')
                );
            }

            global.autoLike = parsed;

            return await m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗨𝗧𝗢-𝗟𝗜𝗞𝗘* ◈',
                    '┃',
                    `┃│ ❤️ Status : ${status(parsed)}`,
                    '┃│ 🟢 Settings Applied',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        // ─────────────────────────────────────────────
        // AUTO TYPING
        // ─────────────────────────────────────────────

        if (sub === 'typing') {

            const parsed = onOff(val);

            if (parsed === null) {
                return await m.reply(
                    [
                        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗨𝗧𝗢-𝗧𝗬𝗣𝗜𝗡𝗚* ◈',
                        '┃',
                        `┃│ ⌨️ Current : ${status(global.autoTyping)}`,
                        `┃│ 📡 Mode    : ${(global.presenceMode || 'none').toUpperCase()}`,
                        '┃',
                        '┃│ Usage',
                        `┃│ ❄️ ${prefix}autofeature typing on`,
                        `┃│ ❄️ ${prefix}autofeature typing off`,
                        '┃',
                        '┗▣'
                    ].join('\n')
                );
            }

            global.autoTyping = parsed;

            // Keep presence mode synchronized
            global.presenceMode =
                parsed ? 'typing' : 'none';

            return await m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗨𝗧𝗢-𝗧𝗬𝗣𝗜𝗡𝗚* ◈',
                    '┃',
                    `┃│ ⌨️ Status : ${status(parsed)}`,
                    `┃│ 📡 Mode   : ${global.presenceMode.toUpperCase()}`,
                    '┃│ 🟢 Settings Applied',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        // ─────────────────────────────────────────────
        // PRESENCE
        // ─────────────────────────────────────────────

        if (sub === 'presence') {

            const modes = [
                'none',
                'typing',
                'recording',
                'online'
            ];

            if (!modes.includes(val)) {

                return await m.reply(
                    [
                        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗣𝗥𝗘𝗦𝗘𝗡𝗖𝗘* ◈',
                        '┃',
                        `┃│ 📡 Current : ${(global.presenceMode || 'none').toUpperCase()}`,
                        '┃',
                        '┃│ Available Modes',
                        '┃│ • none',
                        '┃│ • typing',
                        '┃│ • recording',
                        '┃│ • online',
                        '┃',
                        `┃│ Usage : ${prefix}autofeature presence typing`,
                        '┃',
                        '┗▣'
                    ].join('\n')
                );
            }

            global.presenceMode = val;

            // Keep autoTyping synchronized with typing mode
            global.autoTyping = val === 'typing';

            return await m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗣𝗥𝗘𝗦𝗘𝗡𝗖𝗘* ◈',
                    '┃',
                    `┃│ 📡 Mode    : ${val.toUpperCase()}`,
                    `┃│ ⌨️ Typing  : ${status(global.autoTyping)}`,
                    '┃│ 🟢 Status  : Updated',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        // ─────────────────────────────────────────────
        // MAIN CONTROL PANEL
        // ─────────────────────────────────────────────

        return await m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗨𝗧𝗢 𝗙𝗘𝗔𝗧𝗨𝗥𝗘𝗦* ◈',
                '┃',
                '┃│ ⚙️ *CURRENT STATUS*',
                '┃│',
                `┃│ 📖 Auto-Read    : ${status(global.autoRead)}`,
                `┃│ 👁️ Auto-View    : ${status(global.autoView)}`,
                `┃│ ❤️ Auto-Like    : ${status(global.autoLike)}`,
                `┃│ ⌨️ Auto-Typing  : ${status(global.autoTyping)}`,
                `┃│ 📡 Presence     : ${(global.presenceMode || 'none').toUpperCase()}`,
                '┃',
                '┃│ 🛠️ *CONTROLS*',
                '┃│',
                `┃│ ❄️ ${prefix}autofeature read on/off`,
                `┃│ ❄️ ${prefix}autofeature view on/off`,
                `┃│ ❄️ ${prefix}autofeature like on/off`,
                `┃│ ❄️ ${prefix}autofeature typing on/off`,
                '┃│',
                `┃│ 📡 ${prefix}autofeature presence`,
                '┃│ └─ none',
                '┃│ └─ typing',
                '┃│ └─ recording',
                '┃│ └─ online',
                '┃',
                '┗▣'
            ].join('\n')
        );

    } catch (err) {

        console.error(
            '❌ Freezer AutoFeature Error:',
            err
        );

        await m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗨𝗧𝗢 𝗙𝗘𝗔𝗧𝗨𝗥𝗘𝗦* ◈',
                '┃',
                '┃│ ❌ Auto Feature Error',
                '┃│',
                `┃│ ${String(err.message || err).substring(0, 150)}`,
                '┃',
                '┗▣'
            ].join('\n')
        ).catch(() => {});
    }
});
