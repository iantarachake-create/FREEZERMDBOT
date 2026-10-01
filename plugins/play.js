'use strict';

const { cmd } = require('../arslan');

cmd({
    pattern: 'play',
    name: 'play',
    category: 'Downloaders',
    aliases: ['ply', 'playy', 'pl'],
    description: 'Download songs from YouTube',
    filename: __filename
}, async (sock, m, args) => {

    await m.react('⌛');

    try {
        const query = args?.length
            ? args.join(' ').trim()
            : '';

        if (!query) {
            await m.react('❌').catch(() => {});

            return m.reply([
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗣𝗟𝗔𝗬* ◈',
                '┃',
                '┃│ 🎵 Music Downloader',
                '┃│',
                '┃│ Enter a song name or YouTube link.',
                '┃',
                '┃┌─ EXAMPLES ───────',
                '┃│ ★ .play harlem shake',
                '┃│ ★ .play YouTube link',
                '┃└─────────────',
                '┃',
                '┗▣'
            ].join('\n'));
        }

        const isYoutubeLink =
            /(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?[a-zA-Z0-9_-]{11})/i
                .test(query);

        let audioUrl;
        let filename;
        let thumbnail = '';
        let sourceUrl = '';

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // DIRECT YOUTUBE LINK
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (isYoutubeLink) {

            const response = await fetch(
                `https://api.sidycoders.xyz/api/ytdl?url=${encodeURIComponent(query)}&format=mp3&apikey=memberdycoders`
            );

            const data = await response.json();

            if (!data.status || !data.cdn) {
                await m.react('❌').catch(() => {});

                return m.reply([
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗣𝗟𝗔𝗬* ◈',
                    '┃',
                    '┃│ ❌ Download Failed',
                    '┃│',
                    '┃│ Unable to download this YouTube link.',
                    '┃│ ★ Link may be broken or private.',
                    '┃',
                    '┗▣'
                ].join('\n'));
            }

            audioUrl = data.cdn;
            filename = data.title || 'Unknown Song';
            sourceUrl = query;

        } else {

            if (query.length > 100) {
                await m.react('❌').catch(() => {});

                return m.reply([
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗣𝗟𝗔𝗬* ◈',
                    '┃',
                    '┃│ ❌ Invalid Query',
                    '┃│',
                    '┃│ Song title must be 100 characters or less.',
                    '┃',
                    '┗▣'
                ].join('\n'));
            }

            const response = await fetch(
                `https://apiziaul.vercel.app/api/downloader/ytplaymp3?query=${encodeURIComponent(query)}`
            );

            const data = await response.json();

            if (!data.status || !data.result?.downloadUrl) {
                await m.react('❌').catch(() => {});

                return m.reply([
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗣𝗟𝗔𝗬* ◈',
                    '┃',
                    '┃│ ❌ Not Found',
                    '┃│',
                    `┃│ ★ ${query}`,
                    '┃',
                    '┗▣'
                ].join('\n'));
            }

            audioUrl = data.result.downloadUrl;
            filename = data.result.title || 'Unknown Song';
            thumbnail = data.result.thumbnail || '';
            sourceUrl = data.result.videoUrl || '';
        }

        await m.react('✅');

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // AUDIO
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        await sock.sendMessage(m.from, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${filename}.mp3`,

            contextInfo: thumbnail ? {
                externalAdReply: {
                    title: filename.substring(0, 30),
                    body: 'FREEZER MD BOT',
                    thumbnailUrl: thumbnail,
                    sourceUrl,
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            } : undefined
        });

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // DOCUMENT
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const safeName =
            filename.replace(/[<>:"/\\|?*]/g, '_');

        await sock.sendMessage(m.from, {
            document: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${safeName}.mp3`,

            caption: [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗣𝗟𝗔𝗬* ◈',
                '┃',
                '┃│ 🎵 Song',
                `┃│ ★ ${filename}`,
                '┃',
                '┃│ 🟢 Status : Complete',
                '┃',
                '┗▣'
            ].join('\n')
        });

    } catch (error) {

        console.error('[FREEZER-MD] Play error:', error);

        await m.react('❌').catch(() => {});

        await m.reply([
            '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗣𝗟𝗔𝗬* ◈',
            '┃',
            '┃│ ❌ Play Error',
            '┃│',
            '┃│ Unable to process your request.',
            '┃│ ★ Please try again.',
            '┃',
            '┗▣'
        ].join('\n'));
    }
});
