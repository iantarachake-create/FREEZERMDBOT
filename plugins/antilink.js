'use strict';

const {
    setAntilink,
    getAntilink,
    removeAntilink
} = require('../lib/antilink');

const { cmd } = require('../arslan');

cmd({
    pattern: 'antilink',
    name: 'antilink',
    aliases: ['alink', 'linkblock'],
    category: 'Admin',
    description: 'Protect the group by blocking links',
    filename: __filename
}, async (sock, m, args) => {

    const chatId = m.from;
    const prefix = global.BOT_PREFIX || '.';

    // ─────────────────────────────────────────────
    // GROUP CHECK
    // ─────────────────────────────────────────────

    if (!m.isGroup) {
        return m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞* ◈',
                '┃',
                '┃│ ❌ Group Only',
                '┃│',
                '┃│ This command can only be used',
                '┃│ inside a WhatsApp group.',
                '┃',
                '┗▣'
            ].join('\n')
        );
    }

    // ─────────────────────────────────────────────
    // ADMIN CHECK
    // ─────────────────────────────────────────────

    if (!m.isAdmin && !m.isOwner) {
        return m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞* ◈',
                '┃',
                '┃│ ❌ Access Denied',
                '┃│',
                '┃│ Only group admins or the',
                '┃│ bot owner can use this command.',
                '┃',
                '┗▣'
            ].join('\n')
        );
    }

    const action =
        (args[0] || '').toLowerCase();

    // ─────────────────────────────────────────────
    // MAIN MENU
    // ─────────────────────────────────────────────

    if (!action) {

        const config =
            await getAntilink(chatId);

        return m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞* ◈',
                '┃',
                '┃│ 🔗 *PROTECTION STATUS*',
                '┃│',
                `┃│ 🟢 Status : ${config?.enabled ? 'Enabled' : 'Disabled'}`,
                `┃│ ⚙️ Action : ${config?.action || 'Not set'}`,
                '┃',
                '┃│ ⚙️ *COMMANDS*',
                '┃│',
                `┃│ ❄️ ${prefix}antilink on`,
                `┃│ ❄️ ${prefix}antilink off`,
                `┃│ ❄️ ${prefix}antilink set delete`,
                `┃│ ❄️ ${prefix}antilink set kick`,
                `┃│ ❄️ ${prefix}antilink set warn`,
                `┃│ ❄️ ${prefix}antilink status`,
                '┃',
                '┃│ 🛡️ *PROTECTION*',
                '┃│',
                '┃│ • WhatsApp Groups',
                '┃│ • WhatsApp Channels',
                '┃│ • Telegram Links',
                '┃│ • Social & Website Links',
                '┃│ • Other URLs',
                '┃',
                '┃│ 👑 *EXEMPTIONS*',
                '┃│',
                '┃│ • Group Admins',
                '┃│ • Bot Owner',
                '┃',
                '┗▣'
            ].join('\n')
        );
    }

    // ─────────────────────────────────────────────
    // ACTIONS
    // ─────────────────────────────────────────────

    switch (action) {

        // ─────────────────────────────────────────
        // ENABLE
        // ─────────────────────────────────────────

        case 'on': {

            const existingConfig =
                await getAntilink(chatId);

            if (existingConfig?.enabled) {
                return m.reply(
                    [
                        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞* ◈',
                        '┃',
                        '┃│ ⚠️ Already Enabled',
                        '┃│',
                        '┃│ Antilink protection is already',
                        '┃│ active in this group.',
                        '┃',
                        '┗▣'
                    ].join('\n')
                );
            }

            const result =
                await setAntilink(chatId, 'delete');

            return m.reply(
                result
                    ? [
                        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞* ◈',
                        '┃',
                        '┃│ 🟢 *PROTECTION ENABLED*',
                        '┃│',
                        '┃│ 🔗 Action : 🗑️ Delete',
                        '┃│ 🛡️ Admins : Exempt',
                        '┃│ 👑 Owner  : Exempt',
                        '┃│',
                        '┃│ 🟢 Status : Active',
                        '┃',
                        '┗▣'
                    ].join('\n')
                    :
                    [
                        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞* ◈',
                        '┃',
                        '┃│ ❌ Enable Failed',
                        '┃│',
                        '┃│ Failed to enable antilink.',
                        '┃',
                        '┗▣'
                    ].join('\n')
            );
        }

        // ─────────────────────────────────────────
        // DISABLE
        // ─────────────────────────────────────────

        case 'off': {

            await removeAntilink(chatId);

            return m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞* ◈',
                    '┃',
                    '┃│ 🔴 *PROTECTION DISABLED*',
                    '┃│',
                    '┃│ 🔓 Members can now send links.',
                    '┃│',
                    '┃│ 🔴 Status : Inactive',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        // ─────────────────────────────────────────
        // SET ACTION
        // ─────────────────────────────────────────

        case 'set': {

            if (args.length < 2) {
                return m.reply(
                    [
                        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞* ◈',
                        '┃',
                        '┃│ ❌ Action Required',
                        '┃│',
                        '┃│ Usage:',
                        `┃│ ❄️ ${prefix}antilink set delete`,
                        `┃│ ❄️ ${prefix}antilink set kick`,
                        `┃│ ❄️ ${prefix}antilink set warn`,
                        '┃',
                        '┗▣'
                    ].join('\n')
                );
            }

            const setAction =
                args[1].toLowerCase();

            if (!['delete', 'kick', 'warn'].includes(setAction)) {
                return m.reply(
                    [
                        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞* ◈',
                        '┃',
                        '┃│ ❌ Invalid Action',
                        '┃│',
                        '┃│ Available:',
                        '┃│ 🗑️ delete',
                        '┃│ 🥶 kick',
                        '┃│ ⚠️ warn',
                        '┃',
                        '┗▣'
                    ].join('\n')
                );
            }

            const setResult =
                await setAntilink(chatId, setAction);

            const actionDescriptions = {
                delete: '🗑️ Delete link + warn user',
                kick: '🥶 Delete link + remove user',
                warn: '⚠️ Warn user only'
            };

            return m.reply(
                setResult
                    ? [
                        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞* ◈',
                        '┃',
                        '┃│ 🟢 *ACTION UPDATED*',
                        '┃│',
                        `┃│ ⚙️ Action : ${actionDescriptions[setAction]}`,
                        '┃│ 🛡️ Admins : Exempt',
                        '┃│ 👑 Owner  : Exempt',
                        '┃',
                        '┃│ 🟢 Status : Updated',
                        '┃',
                        '┗▣'
                    ].join('\n')
                    :
                    [
                        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞* ◈',
                        '┃',
                        '┃│ ❌ Update Failed',
                        '┃│',
                        '┃│ Failed to update antilink.',
                        '┃',
                        '┗▣'
                    ].join('\n')
            );
        }

        // ─────────────────────────────────────────
        // STATUS
        // ─────────────────────────────────────────

        case 'status':
        case 'get': {

            const status =
                await getAntilink(chatId);

            let behaviorNote =
                '• No action configured';

            if (status?.action === 'delete') {
                behaviorNote =
                    '• 🗑️ Link message deleted\n' +
                    '• ⚠️ User receives warning';
            }

            else if (status?.action === 'kick') {
                behaviorNote =
                    '• 🗑️ Link message deleted\n' +
                    '• 🥶 User removed from group';
            }

            else if (status?.action === 'warn') {
                behaviorNote =
                    '• ⚠️ User receives warning\n' +
                    '• 💬 Message remains';
            }

            return m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞* ◈',
                    '┃',
                    '┃│ 🔗 *STATUS*',
                    '┃│',
                    `┃│ 🟢 Status : ${status?.enabled ? 'Enabled' : 'Disabled'}`,
                    `┃│ ⚙️ Action : ${status?.action || 'Not set'}`,
                    '┃',
                    '┃│ 🛡️ *BEHAVIOUR*',
                    '┃│',
                    ...behaviorNote
                        .split('\n')
                        .map(line => `┃│ ${line}`),
                    '┃',
                    '┃│ 👑 *EXEMPT*',
                    '┃│ • Group Admins',
                    '┃│ • Bot Owner',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        // ─────────────────────────────────────────
        // INVALID COMMAND
        // ─────────────────────────────────────────

        default:

            return m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗔𝗡𝗧𝗜𝗟𝗜𝗡𝗞* ◈',
                    '┃',
                    '┃│ ❌ Invalid Command',
                    '┃│',
                    '┃│ Use:',
                    `┃│ ❄️ ${prefix}antilink`,
                    '┃│',
                    '┃│ to view all available options.',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
    }
});
