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
    execFile(FFMPEG, args, { timeout: 120000, maxBuffer: 10 * 1024 * 1024 }, (err, _o, stderr) =>
        err ? reject(new Error(String(stderr || err.message).trim().split('\n').slice(-2).join(' '))) : resolve()));

// Song recognition needs an API account. Set ONE of these in your env:
//   ACRCloud : ACR_HOST, ACR_ACCESS_KEY, ACR_ACCESS_SECRET   (console.acrcloud.com)
//   AudD     : AUDD_API_TOKEN                                (dashboard.audd.io)
const ACR = {
    host: process.env.ACR_HOST,
    access_key: process.env.ACR_ACCESS_KEY,
    access_secret: process.env.ACR_ACCESS_SECRET
};
const AUDD = process.env.AUDD_API_TOKEN;

async function viaAcr(sample) {
    const ACRCloud = require('acrcloud');
    const res = await new ACRCloud({ ...ACR }).identify(sample);
    if (res?.status?.code !== 0) return null;
    const t = res.metadata?.music?.[0];
    if (!t) return null;
    const yt = t.external_metadata?.youtube?.vid;
    const sp = t.external_metadata?.spotify?.track?.id;
    return {
        title: t.title,
        artist: (t.artists || []).map(a => a.name).join(', '),
        album: t.album?.name,
        released: t.release_date,
        link: yt ? `https://youtu.be/${yt}` : sp ? `https://open.spotify.com/track/${sp}` : ''
    };
}

async function viaAudd(sample) {
    const form = new FormData();
    form.append('api_token', AUDD);
    form.append('file', new Blob([sample], { type: 'audio/mpeg' }), 'sample.mp3');
    const res = await fetch('https://api.audd.io/', { method: 'POST', body: form, signal: AbortSignal.timeout(60000) });
    const json = await res.json();
    const t = json?.result;
    if (json?.status !== 'success' || !t) return null;
    return { title: t.title, artist: t.artist, album: t.album, released: t.release_date, link: t.song_link };
}

cmd({
    pattern: 'shazam',
    name: 'shazam',
    category: 'Tools',
    description: 'Identify a song from audio or video',
    aliases: ['findsong', 'whatsong', 'identify'],
    filename: __filename
}, async (sock, m) => {
    const p = global.BOT_PREFIX || '.';
    const kind = m.isMedia ? m.mediaType : m.quoted?.mediaType;

    if (kind !== 'audio' && kind !== 'video') {
        return m.reply(box('SHAZAM', [
            '🎶 Identify a song',
            '',
            '★ Reply to an audio / voice note /',
            `   video with ${p}shazam`
        ]));
    }
    if (!(ACR.host && ACR.access_key && ACR.access_secret) && !AUDD) {
        return m.reply(box('SHAZAM', [
            '⚠️ No recognition key set.',
            '',
            'Add to your env ONE of:',
            '• ACR_HOST, ACR_ACCESS_KEY,',
            '  ACR_ACCESS_SECRET  (ACRCloud)',
            '• AUDD_API_TOKEN     (AudD)'
        ]));
    }

    await m.react('⌛').catch(() => {});

    const base = path.join(os.tmpdir(), `freezer-shz-${Date.now()}-${Math.floor(Math.random() * 1e6)}`);
    const inp = `${base}.in`;
    const out = `${base}.mp3`;

    try {
        const media = await m.download();
        if (!media) throw new Error('Could not download the media');
        fs.writeFileSync(inp, media);
        // first 20 seconds is plenty for a fingerprint
        await ffmpeg(['-y', '-i', inp, '-t', '20', '-vn', '-ac', '1', '-ar', '44100', '-b:a', '128k', out]);
        const sample = fs.readFileSync(out);

        let hit = null;
        if (ACR.host && ACR.access_key && ACR.access_secret) {
            try { hit = await viaAcr(sample); } catch (e) { console.error('[FREEZER-MD] ACRCloud:', e.message); }
        }
        if (!hit && AUDD) {
            try { hit = await viaAudd(sample); } catch (e) { console.error('[FREEZER-MD] AudD:', e.message); }
        }

        if (!hit) {
            await m.react('❌').catch(() => {});
            return m.reply(box('SHAZAM', ['❌ Could not identify this song.', 'Try a clearer / longer clip.']));
        }

        await m.reply(box('SHAZAM', [
            `🎵 Title    : ${hit.title || '-'}`,
            `🎤 Artist   : ${hit.artist || '-'}`,
            ...(hit.album ? [`💿 Album    : ${hit.album}`] : []),
            ...(hit.released ? [`📅 Released : ${hit.released}`] : []),
            ...(hit.link ? [`🔗 ${hit.link}`] : [])
        ]));
        await m.react('✅').catch(() => {});
    } catch (err) {
        console.error('[FREEZER-MD] shazam error:', err);
        await m.react('❌').catch(() => {});
        await m.reply(box('SHAZAM', [`❌ Failed: ${err.message}`]));
    } finally {
        for (const f of [inp, out]) { try { fs.unlinkSync(f); } catch {} }
    }
});
