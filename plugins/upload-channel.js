const { cmd } = require('../arslan');
const { makeBox, isOwner, getMedia, quotedText } = require('../freezer-ui');

const box = makeBox('Channel Center');

/* Default channel:  global.channelJid = '120363xxxxxxxxxxxxx@newsletter'
   (your existing .channelid command shows it).                          */
cmd({
    pattern: 'upload-channel',
    name: 'upload-channel',
    category: 'Owner',
    aliases: ['uploadchannel', 'tochannel', 'upch', 'chpost'],
    description: 'Post media or text to your WhatsApp channel',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';

    if (!isOwner(m)) {
        return m.reply(box('❌ *𝗢𝗪𝗡𝗘𝗥 𝗢𝗡𝗟𝗬*', '➤ This command is for the bot owner.'));
    }

    const list = [...(args || [])];
    let jid = global.channelJid || global.newsletterJid || '';
    if (/@newsletter$/i.test(list[0] || '')) jid = list.shift();

    if (!jid) {
        return m.reply(box(
            '❌ *𝗡𝗢 𝗖𝗛𝗔𝗡𝗡𝗘𝗟 𝗦𝗘𝗧*',
            '➤ Set global.channelJid in your config,',
            `➤ or: ${prefix}upload-channel <id>@newsletter`
        ));
    }

    const typed = list.join(' ').trim();

    try {
        const media = await getMedia(sock, m, ['image', 'video', 'audio']);
        let content;

        if (media) {
            const caption = typed || quotedText(m);
            if (media.kind === 'image') content = { image: media.buffer, caption };
            else if (media.kind === 'video') content = { video: media.buffer, caption, mimetype: 'video/mp4' };
            else content = { audio: media.buffer, mimetype: media.mime || 'audio/mpeg', ptt: !!media.msg?.msg?.ptt };
        } else {
            const text = typed || quotedText(m);
            if (!text) {
                return m.reply(box(
                    '📢 *𝗨𝗣𝗟𝗢𝗔𝗗 𝗧𝗢 𝗖𝗛𝗔𝗡𝗡𝗘𝗟*',
                    '➤ Reply to an image, video or audio,',
                    `➤ or: ${prefix}upload-channel your text here`,
                    '',
                    '➤ Add a caption by typing it after the command.'
                ));
            }
            content = { text };
        }

        await m.react('📢');
        await sock.sendMessage(jid, content);
        await m.react('✅');
    } catch (err) {
        console.error('[UPLOAD-CHANNEL] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗖𝗛𝗔𝗡𝗡𝗘𝗟 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
