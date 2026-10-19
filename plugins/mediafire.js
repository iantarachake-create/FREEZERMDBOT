'use strict';

const axios = require('axios');
const { cmd } = require('../arslan');
const { box } = require('../lib/groupTools');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const MAX_BYTES = 100 * 1024 * 1024; // bigger files are sent as a link only

const MIME = {
    zip: 'application/zip', rar: 'application/vnd.rar', '7z': 'application/x-7z-compressed',
    apk: 'application/vnd.android.package-archive', pdf: 'application/pdf',
    mp4: 'video/mp4', mkv: 'video/x-matroska', mp3: 'audio/mpeg', jpg: 'image/jpeg',
    jpeg: 'image/jpeg', png: 'image/png', txt: 'text/plain',
    doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

function toBytes(str = '') {
    const mt = str.match(/([\d.]+)\s*(KB|MB|GB|B)/i);
    if (!mt) return 0;
    const unit = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824 }[mt[2].toUpperCase()];
    return Math.round(parseFloat(mt[1]) * unit);
}

async function resolve(url) {
    const { data } = await axios.get(url, {
        headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml', 'Accept-Language': 'en-US,en;q=0.9' },
        timeout: 30000, maxRedirects: 5
    });
    const html = String(data);

    let link = null;
    const btn = html.match(/<a[^>]*id=["']downloadButton["'][^>]*>/i)?.[0] || '';
    link = btn.match(/href=["'](https?:\/\/[^"']+)["']/i)?.[1] || null;

    if (!link) {
        const scrambled = (btn.match(/data-scrambled-url=["']([^"']+)["']/i) || html.match(/data-scrambled-url=["']([^"']+)["']/i))?.[1];
        if (scrambled) {
            try { link = Buffer.from(scrambled, 'base64').toString('utf8'); } catch {}
        }
    }
    if (!link) link = html.match(/href=["'](https?:\/\/download\d*\.mediafire\.com\/[^"']+)["']/i)?.[1] || null;
    if (!link) throw new Error('Could not find the download link (file removed or protected?)');

    const nameFromPage = html.match(/<div[^>]*class=["']filename["'][^>]*>\s*([^<]+?)\s*</i)?.[1];
    const nameFromUrl = decodeURIComponent(link.split('?')[0].split('/').pop() || 'file');
    const sizeText = html.match(/File size:\s*<span>\s*([^<]+?)\s*</i)?.[1]
        || btn && html.match(/Download\s*\(([^)]+)\)/i)?.[1] || '';

    return { link: link.replace(/&amp;/g, '&'), name: (nameFromPage || nameFromUrl).trim(), sizeText, bytes: toBytes(sizeText) };
}

cmd({
    pattern: 'mediafire',
    name: 'mediafire',
    category: 'Downloaders',
    description: 'Download a file from MediaFire',
    aliases: ['mf', 'mfire'],
    filename: __filename
}, async (sock, m, args) => {
    const p = global.BOT_PREFIX || '.';
    const text = args.join(' ') + ' ' + (m.quoted?.body || '');
    const url = text.match(/https?:\/\/(?:www\.)?mediafire\.com\/\S+/i)?.[0];

    if (!url) {
        return m.reply(box('MEDIAFIRE', [
            '📥 MediaFire downloader',
            '',
            `★ ${p}mediafire <mediafire link>`
        ]));
    }

    await m.react('⌛').catch(() => {});

    try {
        const info = await resolve(url);

        if (info.bytes > MAX_BYTES) {
            await m.react('⚠️').catch(() => {});
            return m.reply(box('MEDIAFIRE', [
                `📄 ${info.name}`,
                `📦 ${info.sizeText}`,
                '',
                '⚠️ Too big to send on WhatsApp (100 MB max).',
                '',
                `🔗 ${info.link}`
            ]));
        }

        await m.reply(box('MEDIAFIRE', [`📄 ${info.name}`, `📦 ${info.sizeText || 'unknown size'}`, '', '⏳ Downloading...']));

        const file = await axios.get(info.link, {
            responseType: 'arraybuffer', timeout: 5 * 60 * 1000,
            maxContentLength: MAX_BYTES, maxBodyLength: MAX_BYTES,
            headers: { 'User-Agent': UA, Referer: 'https://www.mediafire.com/' }
        });

        const buffer = Buffer.from(file.data);
        const ext = (info.name.split('.').pop() || '').toLowerCase();

        await sock.sendMessage(m.from, {
            document: buffer,
            fileName: info.name,
            mimetype: MIME[ext] || file.headers['content-type'] || 'application/octet-stream',
            caption: box('MEDIAFIRE', [`📄 ${info.name}`, `📦 ${(buffer.length / 1048576).toFixed(2)} MB`])
        });
        await m.react('✅').catch(() => {});
    } catch (err) {
        console.error('[FREEZER-MD] mediafire error:', err);
        await m.react('❌').catch(() => {});
        await m.reply(box('MEDIAFIRE', [`❌ Failed: ${err.message}`]));
    }
});
