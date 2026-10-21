const crypto = require('crypto');
const { cmd } = require('../arslan');
const {
    makeBox, isGroup, isOwner, isAdmin, getMedia, quotedText, loadBaileys, toOpus, extOf
} = require('../freezer-ui');

const box = makeBox('Group Center');

/* Posts to the GROUP STATUS (the status shown inside a group).
   Needs a baileys build that has generateWAMessageContent / generateWAMessageFromContent
   and WhatsApp's groupStatusMessageV2 support.                                         */
async function postGroupStatus(sock, jid, content) {
    const baileys = loadBaileys();
    if (!baileys?.generateWAMessageContent || !baileys?.generateWAMessageFromContent) {
        throw new Error('Your baileys build cannot post group status');
    }
    const inside = await baileys.generateWAMessageContent(content, { upload: sock.waUploadToServer });
    const msg = baileys.generateWAMessageFromContent(jid, {
        messageContextInfo: { messageSecret: crypto.randomBytes(32) },
        groupStatusMessageV2: { message: inside }
    }, { userJid: sock.user.id });
    await sock.relayMessage(jid, msg.message, { messageId: msg.key.id });
}

cmd({
    pattern: 'togstatus',
    name: 'togstatus',
    category: 'Group',
    aliases: ['groupstatus', 'gstatus', 'swgc'],
    description: 'Post an image, video, voice note or text to the group status',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';

    if (!isGroup(m)) {
        return m.reply(box('❌ *𝗚𝗥𝗢𝗨𝗣 𝗢𝗡𝗟𝗬*', '➤ Use this command in a group.'));
    }
    if (!(isOwner(m) || await isAdmin(sock, m))) {
        return m.reply(box('❌ *𝗔𝗗𝗠𝗜𝗡𝗦 𝗢𝗡𝗟𝗬*', '➤ Only group admins can use this.'));
    }

    const typed = (args || []).join(' ').trim();

    try {
        const media = await getMedia(sock, m, ['image', 'video', 'audio']);
        let content;

        if (media) {
            const caption = typed || quotedText(m);
            if (media.kind === 'image') {
                content = { image: media.buffer, caption };
            } else if (media.kind === 'video') {
                content = { video: media.buffer, caption, mimetype: 'video/mp4' };
            } else {
                let audio = media.buffer;
                try { audio = await toOpus(media.buffer, extOf(media.mime)); } catch (_) { /* send as is */ }
                content = { audio, mimetype: 'audio/ogg; codecs=opus', ptt: true };
            }
        } else {
            const text = typed || quotedText(m);
            if (!text) {
                return m.reply(box(
                    '📡 *𝗚𝗥𝗢𝗨𝗣 𝗦𝗧𝗔𝗧𝗨𝗦*',
                    '➤ Reply to an image, video or voice note.',
                    `➤ Or: ${prefix}togstatus your text here`,
                    '',
                    '➤ Add a caption by typing it after the command.'
                ));
            }
            content = { text };
        }

        await m.react('📡');
        await postGroupStatus(sock, m.from, content);
        await m.react('✅');
    } catch (err) {
        console.error('[TOGSTATUS] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗦𝗧𝗔𝗧𝗨𝗦 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
