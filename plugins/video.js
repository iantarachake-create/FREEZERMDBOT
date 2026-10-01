'use strict';

const axios = require('axios');
const yts = require('yt-search');
const { cmd } = require('../arslan');

const DL_API = 'https://api.qasimdev.dpdns.org/api/loaderto/download';
const API_KEY = 'qasim-dev';

const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function downloadWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const { data } = await axios.get(DL_API, {
                params: {
                    apiKey: API_KEY,
                    format: '360',
                    url
                },
                timeout: 120000
            });

            if (data?.data?.downloadUrl) return data.data;

            throw new Error('No download URL');

        } catch (err) {
            if (i === retries - 1) throw err;

            console.log(
                `Download attempt ${i + 1} failed, retrying in 5s...`
            );

            await wait(5000);
        }
    }

    throw new Error('All download attempts failed');
}

cmd({
    pattern: 'video',
    name: 'video',
    category: 'Downloaders',
    aliases: ['ytmp4', 'ytvideo'],
    description: 'Download YouTube videos by link or search',
    command: /^\.?(video|ytmp4|ytvideo)\b/i,
    filename: __filename
}, async (sock, m, args) => {

    const query = args.join(' ').trim();

    if (!query) {
        return m.reply([
            '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗩𝗜𝗗𝗘𝗢* ◈',
            '┃',
            '┃│ 🎥 Video Downloader',
            '┃│',
            '┃│ Enter a video name or YouTube link.',
            '┃',
            '┃┌─ EXAMPLE ───────',
            '┃│ ★ .video Alan Walker Faded',
            '┃└─────────────',
            '┃',
            '┗▣'
        ].join('\n'));
    }

    try {
        let videoUrl;
        let videoTitle;
        let videoThumbnail;

        if (
            query.startsWith('http://') ||
            query.startsWith('https://')
        ) {
            videoUrl = query;
        } else {
            const { videos } = await yts(query);

            if (!videos?.length) {
                return m.reply([
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗩𝗜𝗗𝗘𝗢* ◈',
                    '┃',
                    '┃│ ❌ No Videos Found',
                    '┃│',
                    `┃│ ★ ${query}`,
                    '┃',
                    '┗▣'
                ].join('\n'));
            }

            videoUrl = videos[0].url;
            videoTitle = videos[0].title;
            videoThumbnail = videos[0].thumbnail;
        }

        const validYT = videoUrl.match(
            /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([a-zA-Z0-9_-]{11})/
        );

        if (!validYT) {
            return m.reply([
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗩𝗜𝗗𝗘𝗢* ◈',
                '┃',
                '┃│ ❌ Invalid YouTube Link',
                '┃│',
                '┃│ Please provide a valid YouTube URL.',
                '┃',
                '┗▣'
            ].join('\n'));
        }

        const ytId = validYT[1];

        const thumb =
            videoThumbnail ||
            `https://i.ytimg.com/vi/${ytId}/sddefault.jpg`;

        await m.reply({
            image: { url: thumb },
            caption: [
                `🎬 *${videoTitle || query}*`,
                '',
                '⬇️ Downloading...',
                '⏳ Please wait, this may take up to 30s.'
            ].join('\n')
        });

        const videoData = await downloadWithRetry(videoUrl);

        await m.reply({
            video: { url: videoData.downloadUrl },
            mimetype: 'video/mp4',
            fileName: `${videoData.title || videoTitle || 'video'}.mp4`,
            caption: [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗩𝗜𝗗𝗘𝗢* ◈',
                '┃',
                `┃│ 🎬 Video : ${videoData.title || videoTitle || 'Video'}`,
                '┃│',
                '┃│ 🟢 Status : Complete',
                '┃│ 🤖 Bot    : FREEZER MD BOT',
                '┃',
                '┗▣'
            ].join('\n')
        });

    } catch (err) {

        console.error('[VIDEO] Error:', err.message);

        const reason = err.response?.status === 408
            ? 'Download timed out. Try again.'
            : err.message;

        await m.reply([
            '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗩𝗜𝗗𝗘𝗢* ◈',
            '┃',
            '┃│ ❌ Download Failed',
            '┃│',
            `┃│ ★ ${reason}`,
            '┃',
            '┃│ Please try again.',
            '┃',
            '┗▣'
        ].join('\n'));
    }
});
