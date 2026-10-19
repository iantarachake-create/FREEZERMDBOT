'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { cmd } = require('../arslan');
const { box } = require('../lib/groupTools');

let FFMPEG = 'ffmpeg';
try { FFMPEG = require('@ffmpeg-installer/ffmpeg').path; } catch { /* use system ffmpeg */ }

const ffmpeg = args => new Promise((resolve, reject) =>
    execFile(FFMPEG, args, { timeout: 5 * 60 * 1000, maxBuffer: 10 * 1024 * 1024 }, (err, _o, stderr) =>
        err ? reject(new Error(String(stderr || err.message).trim().split('\n').slice(-2).join(' '))) : resolve()));

cmd({
    pattern: 'toaudio',
    name: 'toaudio',
    category: 'Tools',
    description: 'Convert a video or voice note to MP3',
    aliases: ['tomp3', 'mp3'],
    filename: __filename
}, async (sock, m) => {
    const p = global.BOT_PREFIX || '.';
    const kind = m.isMedia ? m.mediaType : m.quoted?.mediaType;

    if (kind !== 'video' && kind !== 'audio') {
        return m.reply(box('TO AUDIO', [
            '🎧 Convert to MP3',
            '',
            '★ Reply to a video or voice note',
            `   with ${p}toaudio`
        ]));
    }

    await m.react('⌛').catch(() => {});

    const base = path.join(os.tmpdir(), `freezer-mp3-${Date.now()}-${Math.floor(Math.random() * 1e6)}`);
    const inp = `${base}.in`;
    const out = `${base}.mp3`;

    try {
        const media = await m.download();
        if (!media) throw new Error('Could not download the media');
        if (media.length > 64 * 1024 * 1024) throw new Error('File is larger than 64 MB');
        fs.writeFileSync(inp, media);
        await ffmpeg(['-y', '-i', inp, '-vn', '-ac', '2', '-ar', '44100', '-b:a', '128k', out]);
        const audio = fs.readFileSync(out);
        await sock.sendMessage(m.from, { audio, mimetype: 'audio/mpeg', ptt: false });
        await m.react('✅').catch(() => {});
    } catch (err) {
        console.error('[FREEZER-MD] toaudio error:', err);
        await m.react('❌').catch(() => {});
        await m.reply(box('TO AUDIO', [`❌ Failed: ${err.message}`]));
    } finally {
        for (const f of [inp, out]) { try { fs.unlinkSync(f); } catch {} }
    }
});
