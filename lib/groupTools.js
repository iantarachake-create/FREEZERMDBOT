'use strict';

const box = (title, lines) =>
    ['┏▣ ◈ *' + title + '* ◈', '┃', ...lines.map(l => `┃│ ${l}`), '┃', '┗▣'].join('\n');

const num = jid => (jid || '').split('@')[0].split(':')[0];

// Show the bot as online in the chat before every command runs
async function goOnline(sock, m) {
    try { await sock.sendPresenceUpdate('available', m.from); } catch {}
}

async function isBotAdmin(sock, meta) {
    const botNum = num(sock.user?.id);
    const botLid = num(sock.user?.lid);
    return meta.participants.some(p =>
        p.admin &&
        [num(p.id), num(p.phoneNumber), num(p.lid)].some(n => n && (n === botNum || n === botLid))
    );
}

// Target priority: @mention > replied message > numbers typed in args
function getTargets(m, args) {
    const ctx =
        m.message?.extendedTextMessage?.contextInfo ||
        m.msg?.contextInfo ||
        m.contextInfo ||
        {};
    const list = [];

    (ctx.mentionedJid || m.mentionedJid || []).forEach(j => list.push(j));
    if (!list.length && (ctx.participant || m.quoted?.sender)) {
        list.push(ctx.participant || m.quoted.sender);
    }
    if (!list.length) {
        args.forEach(a => {
            const n = a.replace(/[^0-9]/g, '');
            if (n.length >= 7) list.push(n + '@s.whatsapp.net');
        });
    }
    return [...new Set(list)];
}

// Group-only + admin check + bot-admin check. Returns group metadata or null.
async function guard(sock, m, { needBotAdmin = true } = {}) {
    await goOnline(sock, m);

    if (!m.isGroup) {
        await m.reply(box('GROUP ONLY', ['❌ This command works in groups only.']));
        return null;
    }
    if (!(m.isAdmin || m.isOwner || m.isDev)) {
        await m.reply(box('ADMINS ONLY', ['❌ Only group admins can use this.']));
        return null;
    }
    const meta = await sock.groupMetadata(m.from);
    if (needBotAdmin && !(await isBotAdmin(sock, meta))) {
        await m.reply(box('BOT NOT ADMIN', ['⚠️ Make me an admin first.']));
        return null;
    }
    return meta;
}

module.exports = { box, num, goOnline, isBotAdmin, getTargets, guard };
