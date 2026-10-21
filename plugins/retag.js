const { cmd } = require('../arslan');
const {
    makeBox, isGroup, isOwner, isAdmin, getMedia, quotedText
} = require('../freezer-ui');

const box = makeBox('Group Center');

cmd({
    pattern: 'retag',
    name: 'retag',
    category: 'Group',
    aliases: ['rtag', 'hidetagreply'],
    description: 'Resend a replied message and silently tag everyone',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';

    if (!isGroup(m)) {
        return m.reply(box('❌ *𝗚𝗥𝗢𝗨𝗣 𝗢𝗡𝗟𝗬*', '➤ Use this command in a group.'));
    }
    if (!(isOwner(m) || await isAdmin(sock, m))) {
        return m.reply(box('❌ *𝗔𝗗𝗠𝗜𝗡𝗦 𝗢𝗡𝗟𝗬*', '➤ Only group admins can use this.'));
    }

    const extra = (args || []).join(' ').trim();
    if (!m.quoted && !extra) {
        return m.reply(box(
            '🏷️ *𝗥𝗘𝗧𝗔𝗚*',
            '➤ Reply to any message to resend it with everyone tagged.',
            `➤ Or: ${prefix}retag your text here`
        ));
    }

    try {
        const meta = await sock.groupMetadata(m.from);
        const mentions = meta.participants.map(p => p.id);
        const text = extra || quotedText(m);

        const media = m.quoted ? await getMedia(sock, { quoted: m.quoted }, null) : null;

        if (media) {
            const { buffer, kind, mime, msg } = media;
            let content;
            if (kind === 'image') content = { image: buffer, caption: text, mentions };
            else if (kind === 'video') content = { video: buffer, caption: text, mimetype: mime || 'video/mp4', mentions };
            else if (kind === 'audio') content = { audio: buffer, mimetype: mime || 'audio/mpeg', ptt: !!msg?.msg?.ptt, mentions };
            else if (kind === 'sticker') content = { sticker: buffer, mentions };
            else content = {
                document: buffer,
                mimetype: mime || 'application/octet-stream',
                fileName: msg?.fileName || msg?.msg?.fileName || 'file',
                caption: text,
                mentions
            };
            await sock.sendMessage(m.from, content);
        } else {
            if (!text) throw new Error('That message has no text or media to resend');
            await sock.sendMessage(m.from, { text, mentions });
        }
    } catch (err) {
        console.error('[RETAG] Error:', err.message);
        await m.reply(box('❌ *𝗥𝗘𝗧𝗔𝗚 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
