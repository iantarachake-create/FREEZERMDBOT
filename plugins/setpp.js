'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');

cmd({
    pattern: 'setpp',
    name: 'setpp',
    description: "Set the bot's profile picture (reply to an image)",
    aliases: ['setprofile', 'setdp'],
    filename: __filename
}, async (sock, m) => {
    await goOnline(sock, m);
    if (!(m.isOwner || m.isDev)) {
        return m.reply(box('OWNER ONLY', ['❌ Only the owner can use this.']));
    }

    const ctx = m.message?.extendedTextMessage?.contextInfo || m.msg?.contextInfo || {};
    const quoted = ctx.quotedMessage;
    let target;

    if (quoted?.imageMessage) {
        target = {
            message: quoted,
            key: { remoteJid: m.from, id: ctx.stanzaId, fromMe: false, participant: ctx.participant }
        };
    } else if (m.message?.imageMessage) {
        target = { message: m.message, key: m.key };
    } else {
        return m.reply(box('SET PP', ['❌ Reply to an image with .setpp']));
    }

    try {
        const buffer = await global.downloadMediaMessage(target, 'buffer', {});
        const botJid = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        await sock.updateProfilePicture(botJid, buffer);
        await m.reply(box('SET PP', ['✅ Profile picture updated']));
    } catch (err) {
        await m.reply(box('SET PP', [`❌ Failed: ${err.message}`]));
    }
});
