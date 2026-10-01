'use strict';

const { cmd } = require('../arslan');

cmd({
    pattern: 'tagall',
    name: 'tagall',
    category: 'Group',
    description: 'Mention all group members',
    aliases: ['everyone', 'all'],
    filename: __filename
}, async (sock, m, args) => {

    try {
        if (!m.isGroup) {
            return m.reply([
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗧𝗔𝗚𝗔𝗟𝗟* ◈',
                '┃',
                '┃│ ❌ Groups Only',
                '┃│',
                '┃│ This command can only be',
                '┃│ used inside a group.',
                '┃',
                '┗▣'
            ].join('\n'));
        }

        if (!m.isAdmin && !m.isOwner) {
            return m.reply([
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗧𝗔𝗚𝗔𝗟𝗟* ◈',
                '┃',
                '┃│ ❌ Access Denied',
                '┃│',
                '┃│ Only group admins can',
                '┃│ use this command.',
                '┃',
                '┗▣'
            ].join('\n'));
        }

        const participants = m.groupMetadata?.participants || [];

        if (!participants.length) {
            return m.reply([
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗧𝗔𝗚𝗔𝗟𝗟* ◈',
                '┃',
                '┃│ ❌ No Members Found',
                '┃│',
                '┃│ Unable to find group members.',
                '┃',
                '┗▣'
            ].join('\n'));
        }

        const text = args.join(' ') || 'Attention everyone! 📢';

        const mentions = participants.map(p => p.id);

        const message = [
            '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗧𝗔𝗚𝗔𝗟𝗟* ◈',
            '┃',
            '┃│ 📢 *GROUP ANNOUNCEMENT*',
            '┃',
            `┃│ ${text}`,
            '┃',
            '┗▣',
            '',
            mentions
                .map(jid => `@${jid.split('@')[0]}`)
                .join(' ')
        ].join('\n');

        return await sock.sendMessage(m.from, {
            text: message,
            mentions
        });

    } catch (err) {

        console.error('[FREEZER-MD] Tagall Error:', err);

        return m.reply([
            '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗧𝗔𝗚𝗔𝗟𝗟* ◈',
            '┃',
            '┃│ ❌ Tagall Failed',
            '┃│',
            '┃│ Failed to mention group members.',
            '┃',
            '┗▣'
        ].join('\n'));
    }
});
