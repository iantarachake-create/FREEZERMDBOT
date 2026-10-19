'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const sharp = require('sharp');
const { cmd } = require('../arslan');
const { box } = require('../lib/groupTools');

let FFMPEG = 'ffmpeg';
try { FFMPEG = require('@ffmpeg-installer/ffmpeg').path; } catch { /* use system ffmpeg */ }

const ffmpeg = args => new Promise((resolve, reject) =>
    execFile(FFMPEG, args, { timeout: 5 * 60 * 1000, maxBuffer: 10 * 1024 * 1024 }, (err, _o, stderr) =>
        err ? reject(new Error(String(stderr || err.message).trim().split('\n').slice(-2).join(' '))) : resolve()));

const size = b => b > 1048576 ? `${(b / 1048576).toFixed(2)} MB` : `${(b / 1024).toFixed(1)} KB`;

cmd({
    pattern: 'compress',
    name: 'compress',
    category: 'Tools',
    description: 'Compress an image or video',
    aliases: ['shrink', 'reduce'],
    filename: __filename
}, async (sock, m, args) => {
    const p = global.BOT_PREFIX || '.';
    const kind = m.isMedia ? m.mediaType : m.quoted?.mediaType;

    if (kind !== 'image' && kind !== 'video') {
        return m.reply(box('COMPRESS', [
            '🗜️ Make images / videos smaller',
            '',
            '★ Reply to an image or video with',
            `   ${p}compress`,
            `★ ${p}compress 40   (1-100, lower = smaller)`
        ]));
    }

    const level = Math.min(Math.max(parseInt(args[0], 10) || 60, 1), 100);
    await m.react('⌛').catch(() => {});

    const base = path.join(os.tmpdir(), `freezer-cmp-${Date.now()}-${Math.floor(Math.random() * 1e6)}`);
    const files = [];

    try {
        const input = await m.download();
        if (!input) throw new Error('Could not download the media');
        if (input.length > 64 * 1024 * 1024) throw new Error('File is larger than 64 MB');

        let output;
        if (kind === 'image') {
            output = await sharp(input).rotate()
                .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
                .jpeg({ quality: level, mozjpeg: true }).toBuffer();
        } else {
            const inp = `${base}.in`;
            const out = `${base}.mp4`;
            files.push(inp, out);
            fs.writeFileSync(inp, input);
            const crf = Math.round(Math.min(Math.max(18 + (100 - level) * 0.2, 18), 38));
            await ffmpeg([
                '-y', '-i', inp,
                '-vf', "scale='min(720,iw)':-2",
                '-c:v', 'libx264', '-crf', String(crf), '-preset', 'veryfast',
                '-c:a', 'aac', '-b:a', '64k', '-movflags', '+faststart', out
            ]);
            output = fs.readFileSync(out);
        }

        const saved = Math.max(0, Math.round((1 - output.length / input.length) * 100));
        const caption = box('COMPRESS', [
            `📦 Before : ${size(input.length)}`,
            `✅ After  : ${size(output.length)}`,
            `📉 Saved  : ${saved}%`
        ]);

        if (kind === 'image') await m.reply(output, { caption });
        else await sock.sendMessage(m.from, { video: output, mimetype: 'video/mp4', caption });
        await m.react('✅').catch(() => {});
    } catch (err) {
        console.error('[FREEZER-MD] compress error:', err);
        await m.react('❌').catch(() => {});
        await m.reply(box('COMPRESS', [`❌ Failed: ${err.message}`]));
    } finally {
        for (const f of files) { try { fs.unlinkSync(f); } catch {} }
    }
});
