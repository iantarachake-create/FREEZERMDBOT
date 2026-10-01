'use strict';

const { cmd } = require('../arslan');

cmd({
    pattern: 'channelid',
    name: 'channelid',
    category: 'Owner',
    aliases: ['chid', 'getchannelid'],
    description: 'Get the real WhatsApp Channel JID from a channel invite link',
    filename: __filename
}, async (sock, m) => {

    // ─────────────────────────────────────────────
    // OWNER PROTECTION
    // ─────────────────────────────────────────────

    if (!m.isOwner && !m.isDev) {
        return m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗* ◈',
                '┃',
                '┃│ ❌ Access Denied',
                '┃│',
                '┃│ This command is restricted',
                '┃│ to the bot owner.',
                '┃',
                '┗▣'
            ].join('\n')
        );
    }

    try {

        // ─────────────────────────────────────────
        // CHANNEL URL
        // ─────────────────────────────────────────

        const channelUrl =
            global.channelUrl ||
            'https://whatsapp.com/channel/0029Vb87tM1D8SE7qCVjbq3U';

        // Extract invite code
        const match = channelUrl.match(
            /whatsapp\.com\/channel\/([^/?]+)/i
        );

        if (!match) {
            return m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗖𝗛𝗔𝗡𝗡𝗘𝗟* ◈',
                    '┃',
                    '┃│ ❌ Invalid Channel URL',
                    '┃│',
                    '┃│ Example:',
                    '┃│ https://whatsapp.com/channel/0029Vb87tM1D8SE7qCVjbq3U',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        const inviteCode = match[1];

        // ─────────────────────────────────────────
        // RESOLVING
        // ─────────────────────────────────────────

        await m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗖𝗛𝗔𝗡𝗡𝗘𝗟* ◈',
                '┃',
                '┃│ 🔎 Channel Resolver',
                '┃│ ⏳ Resolving...',
                `┃│ 🔗 Invite : ${inviteCode}`,
                '┃',
                '┗▣'
            ].join('\n')
        );

        const metadata = await sock.newsletterMetadata(
            'invite',
            inviteCode
        );

        if (!metadata) {
            return m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗖𝗛𝗔𝗡𝗡𝗘𝗟* ◈',
                    '┃',
                    '┃│ ❌ Channel Not Found',
                    '┃│',
                    '┃│ WhatsApp returned no channel',
                    '┃│ metadata.',
                    '┃',
                    '┃│ 🔗 Check the channel link',
                    '┃│ and try again.',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        // ─────────────────────────────────────────
        // GET REAL JID
        // ─────────────────────────────────────────

        const jid =
            metadata.id ||
            metadata.jid ||
            metadata.newsletterJid;

        if (!jid) {

            console.log(
                'FREEZER-MD CHANNEL METADATA:',
                metadata
            );

            return m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗖𝗛𝗔𝗡𝗡𝗘𝗟* ◈',
                    '┃',
                    '┃│ ⚠️ Channel Found',
                    '┃│',
                    '┃│ No JID was returned.',
                    '┃│',
                    '┃│ Check the terminal logs for',
                    '┃│ the complete metadata.',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        // ─────────────────────────────────────────
        // TERMINAL LOG
        // ─────────────────────────────────────────

        console.log(
            '\n┏▣ ◈ 𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗖𝗛𝗔𝗡𝗡𝗘𝗟 ◈'
        );
        console.log('┃');
        console.log(
            `┃│ 📢 Name : ${metadata.name || 'Unknown'}`
        );
        console.log(`┃│ 🆔 JID  : ${jid}`);
        console.log(`┃│ 🔗 Code : ${inviteCode}`);
        console.log('┃');
        console.log('┗▣\n');

        // ─────────────────────────────────────────
        // SUCCESS
        // ─────────────────────────────────────────

        await m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗖𝗛𝗔𝗡𝗡𝗘𝗟* ◈',
                '┃',
                '┃│ 📢 *CHANNEL FOUND*',
                '┃',
                `┃│ 🏷️ Name : ${metadata.name || 'Unknown'}`,
                '┃│',
                '┃│ 🆔 *JID*',
                `┃│ \`${jid}\``,
                '┃',
                '┃│ 🔗 *CHANNEL*',
                `┃│ ${channelUrl}`,
                '┃',
                '┃│ 🟢 Status : Resolved',
                '┃',
                '┗▣',
                '',
                '❄️ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗕𝗢𝗧*',
                '> Real newsletter JID obtained.'
            ].join('\n')
        );

    } catch (error) {

        // ─────────────────────────────────────────
        // ERROR HANDLER
        // ─────────────────────────────────────────

        console.error(
            '❌ Freezer-MD Channel Resolver:',
            error
        );

        await m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗖𝗛𝗔𝗡𝗡𝗘𝗟* ◈',
                '┃',
                '┃│ ❌ Resolution Failed',
                '┃│',
                `┃│ Error : ${error.message}`,
                '┃',
                '┃│ Check your Baileys version',
                '┃│ and make sure the bot is connected.',
                '┃',
                '┗▣'
            ].join('\n')
        );
    }
});
