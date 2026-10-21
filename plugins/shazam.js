const axios = require('axios');
const { cmd } = require('../arslan');
const { makeBox, getMedia, convert, extOf } = require('../freezer-ui');

const box = makeBox('Music Center');

/* Needs an AudD token:  global.auddToken = '...'   (get one at audd.io)  */
cmd({
    pattern: 'shazam',
    name: 'shazam',
    category: 'Tools',
    aliases: ['whatsong', 'findsong', 'identify'],
    description: 'Identify a song from audio or video',
    filename: __filename
}, async (sock, m) => {
    const prefix = global.BOT_PREFIX || '.';
    const token = global.auddToken || process.env.AUDD_TOKEN;

    try {
        const media = await getMedia(sock, m, ['audio', 'video']);
        if (!media) {
            return m.reply(box(
                '🎼 *𝗦𝗛𝗔𝗭𝗔𝗠*',
                '➤ Reply to a song, voice note or video.',
                `➤ Example: reply with ${prefix}shazam`
            ));
        }
        if (!token) {
            return m.reply(box('❌ *𝗡𝗢𝗧 𝗖𝗢𝗡𝗙𝗜𝗚𝗨𝗥𝗘𝗗*', '➤ Owner must set global.auddToken first.'));
        }

        await m.react('🎧');

        // 20 seconds of audio is plenty and keeps the upload small
        const clip = await convert(
            media.buffer, extOf(media.mime), 'mp3',
            ['-vn', '-t', '20', '-c:a', 'libmp3lame', '-b:a', '96k']
        );

        const form = new FormData();
        form.append('api_token', token);
        form.append('return', 'apple_music,spotify');
        form.append('file', new Blob([clip], { type: 'audio/mpeg' }), 'clip.mp3');

        const { data } = await axios.post('https://api.audd.io/', form, { timeout: 60000 });

        if (data?.status !== 'success') {
            throw new Error(data?.error?.error_message || 'Recognition service error');
        }
        const r = data.result;
        if (!r) {
            await m.react('❌');
            return m.reply(box('❌ *𝗡𝗢𝗧 𝗙𝗢𝗨𝗡𝗗*', '➤ Could not recognise this song.', '➤ Try a clearer or longer clip.'));
        }

        await m.reply(box(
            '🎼 *𝗦𝗢𝗡𝗚 𝗙𝗢𝗨𝗡𝗗*',
            `➤ 🎵 ${r.title || 'Unknown'}`,
            `➤ 👤 ${r.artist || 'Unknown'}`,
            r.album ? `➤ 💿 ${r.album}` : null,
            r.release_date ? `➤ 📅 ${r.release_date}` : null,
            r.label ? `➤ 🏷️ ${r.label}` : null,
            r.song_link ? '' : null,
            r.song_link ? `➤ ${r.song_link}` : null
        ));
        await m.react('✅');
    } catch (err) {
        console.error('[SHAZAM] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗦𝗛𝗔𝗭𝗔𝗠 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
