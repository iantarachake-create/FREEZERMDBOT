'use strict';

const { cmd } = require('../arslan');
const { makeBox, getMedia, sizeText } = require('../lib/freezer-ui');
const { listEntries, extract } = require('../lib/zipReader');

const box = makeBox('Archive Center');

const MAX_ZIP = 60 * 1024 * 1024;       // zip file itself
const MAX_FILE = 50 * 1024 * 1024;      // one file inside
const MAX_TOTAL = 150 * 1024 * 1024;    // everything unpacked (zip-bomb guard)
const DEFAULT_FILES = 10;
const ALL_FILES = 30;
const PAUSE_MS = 800;

const MIME = {
    txt: 'text/plain', md: 'text/markdown', csv: 'text/csv', json: 'application/json', html: 'text/html',
    pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    webp: 'image/webp', mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', mp4: 'video/mp4',
    mkv: 'video/x-matroska', zip: 'application/zip', apk: 'application/vnd.android.package-archive',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    js: 'text/javascript'
};

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const baseName = (n) => String(n).split('/').pop().replace(/[\u0000-\u001f<>:"\\|?*]/g, '_').slice(0, 100) || 'file';
const mimeFor = (n) => MIME[String(n).split('.').pop().toLowerCase()] || 'application/octet-stream';

cmd({
    pattern: 'unzip',
    name: 'unzip',
    category: 'Tools',
    aliases: ['extract', 'unarchive'],
    description: 'Open a replied .zip file and send what is inside',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';
    const mode = String(args?.[0] || '').toLowerCase();

    try {
        const media = await getMedia(sock, m, ['document']);
        if (!media) {
            return m.reply(box(
                '🗂️ *𝗨𝗡𝗭𝗜𝗣*',
                '➤ Reply to a .zip file.',
                '',
                `➤ ${prefix}unzip         (first ${DEFAULT_FILES} files)`,
                `➤ ${prefix}unzip all     (up to ${ALL_FILES} files)`,
                `➤ ${prefix}unzip list    (just show what is inside)`
            ));
        }
        const zip = media.buffer;
        if (zip.length > MAX_ZIP) {
            return m.reply(box('❌ *𝗧𝗢𝗢 𝗕𝗜𝗚*', `➤ ${sizeText(zip.length)} is over the ${sizeText(MAX_ZIP)} limit.`));
        }
        if (zip.readUInt32LE(0) !== 0x04034b50 && zip.readUInt32LE(0) !== 0x06054b50) {
            return m.reply(box('❌ *𝗡𝗢𝗧 𝗔 𝗭𝗜𝗣*', '➤ That file is not a .zip archive.'));
        }

        await m.react('⏳');

        const entries = listEntries(zip).filter(e =>
            !e.isDir && !e.name.startsWith('__MACOSX/') && !/(^|\/)(\.DS_Store|Thumbs\.db)$/i.test(e.name));

        if (!entries.length) return m.reply(box('📭 *𝗘𝗠𝗣𝗧𝗬*', '➤ This zip has no files inside.'));

        const total = entries.reduce((n, e) => n + e.usize, 0);
        if (total > MAX_TOTAL) {
            return m.reply(box('❌ *𝗧𝗢𝗢 𝗟𝗔𝗥𝗚𝗘*', `➤ It would unpack to ${sizeText(total)}.`, `➤ Limit is ${sizeText(MAX_TOTAL)}.`));
        }

        if (mode === 'list') {
            const shown = entries.slice(0, 40);
            await m.reply(box(
                '🗂️ *𝗭𝗜𝗣 𝗖𝗢𝗡𝗧𝗘𝗡𝗧𝗦*',
                `➤ ${entries.length} files • ${sizeText(total)} unpacked`,
                '',
                ...shown.map(e => `${e.encrypted ? '🔒' : '📄'} ${e.name.slice(0, 45)} (${sizeText(e.usize)})`),
                entries.length > shown.length ? `➤ ...and ${entries.length - shown.length} more` : null
            ));
            await m.react('✅');
            return;
        }

        const limit = mode === 'all' ? ALL_FILES : DEFAULT_FILES;
        let sent = 0;
        const skipped = [];

        for (const entry of entries) {
            if (sent >= limit) break;
            if (!entry.usize) { skipped.push(`${baseName(entry.name)} (empty)`); continue; }
            if (entry.usize > MAX_FILE) { skipped.push(`${baseName(entry.name)} (too big)`); continue; }
            try {
                const data = extract(zip, entry);
                await m.reply({ document: data, mimetype: mimeFor(entry.name), fileName: baseName(entry.name) });
                sent++;
                await wait(PAUSE_MS);
            } catch (e) {
                skipped.push(`${baseName(entry.name)} (${e.message})`);
            }
        }

        const left = entries.length - sent - skipped.length;
        await m.reply(box(
            '🗂️ *𝗨𝗡𝗭𝗜𝗣 𝗗𝗢𝗡𝗘*',
            `➤ Sent    : ${sent} of ${entries.length} files`,
            skipped.length ? `➤ Skipped : ${skipped.length}` : null,
            ...skipped.slice(0, 5).map(s => `   ▸ ${s}`),
            left > 0 ? `➤ Not sent: ${left} (use ${prefix}unzip all)` : null
        ));
        await m.react('✅');
    } catch (err) {
        console.error('[UNZIP] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗨𝗡𝗭𝗜𝗣 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
