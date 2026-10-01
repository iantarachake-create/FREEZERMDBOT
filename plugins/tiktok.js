'use strict';

const axios = require('axios');
const fs = require('fs');

const { cmd } = require('../arslan');

cmd({
    pattern: 'tiktok',
    name: 'tiktok',
    category: 'Downloaders',
    description: 'Download TikTok videos without watermark',
    aliases: ['tt', 'tiktokdl', 'ttdl'],
    tags: ['downloader'],
    command: /^\.?(tiktok|tt|tiktokdl|ttdl)$/i,
    filename: __filename
}, async (sock, m, args) => {

    try {

        if (!args.length) {
            return await m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗧𝗜𝗞𝗧𝗢𝗞* ◈',
                    '┃',
                    '┃│ 🎵 TikTok Downloader',
                    '┃│',
                    '┃│ ⚡ Usage : .tiktok <url>',
                    '┃│ ★ Example:',
                    '┃│ .tiktok https://vt.tiktok.com/...',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        const url = args[0];

        if (!/tiktok\.com/i.test(url)) {
            return await m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗧𝗜𝗞𝗧𝗢𝗞* ◈',
                    '┃',
                    '┃│ ❌ Invalid TikTok URL',
                    '┃│',
                    '┃│ Please provide a valid',
                    '┃│ TikTok video link.',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        await m.react('⌛');

        await m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗧𝗜𝗞𝗧𝗢𝗞* ◈',
                '┃',
                '┃│ 🎵 TikTok Downloader',
                '┃│',
                '┃│ ⏳ Downloading video...',
                '┃',
                '┗▣'
            ].join('\n')
        );

        const apiUrl =
            `https://api-rebix.zone.id/api/tiktok2?url=${encodeURIComponent(url)}`;

        const response = await axios.get(apiUrl);

        if (!response.data.status || !response.data.result) {
            await m.react('❌');

            return await m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗧𝗜𝗞𝗧𝗢𝗞* ◈',
                    '┃',
                    '┃│ ❌ Download Failed',
                    '┃│',
                    '┃│ Failed to fetch the TikTok',
                    '┃│ video. Please try again.',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        const result = response.data.result;
        const videoUrl = result.play;

        if (!videoUrl) {
            await m.react('❌');

            return await m.reply(
                [
                    '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗧𝗜𝗞𝗧𝗢𝗞* ◈',
                    '┃',
                    '┃│ ❌ Video Not Found',
                    '┃│',
                    '┃│ No downloadable video URL',
                    '┃│ was returned by the API.',
                    '┃',
                    '┗▣'
                ].join('\n')
            );
        }

        const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer'
        });

        const videoBuffer = Buffer.from(videoResponse.data);

        const tempDir = './temp';

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const fileName = `tiktok_${result.id || Date.now()}.mp4`;
        const filePath = `${tempDir}/${fileName}`;

        fs.writeFileSync(filePath, videoBuffer);

        const caption = [
            '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗧𝗜𝗞𝗧𝗢𝗞* ◈',
            '┃',
            '┃│ 🎵 TikTok Video',
            '┃│',
            `┃│ 📝 Title : ${result.title || 'Unknown'}`,
            `┃│ ⏱️ Duration : ${result.duration || 0}s`,
            `┃│ 👁️ Views : ${Number(result.play_count || 0).toLocaleString()}`,
            `┃│ ❤️ Likes : ${Number(result.digg_count || 0).toLocaleString()}`,
            `┃│ 💬 Comments : ${Number(result.comment_count || 0).toLocaleString()}`,
            `┃│ 🔄 Shares : ${Number(result.share_count || 0).toLocaleString()}`,
            '┃',
            '┃│ 👤 Author',
            `┃│ ${result.author?.nickname || 'Unknown'}`,
            `┃│ @${result.author?.unique_id || 'unknown'}`,
            '┃',
            '┃│ 🟢 Status : Complete',
            '┃│ 🤖 Bot : FREEZER MD BOT',
            '┃',
            '┗▣'
        ].join('\n');

        await sock.sendMessage(m.from, {
            video: videoBuffer,
            caption,
            mimetype: 'video/mp4'
        });

        // Remove temporary file after successful upload
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await m.react('✅');

    } catch (err) {

        console.error('[FREEZER-MD TIKTOK]', err);

        await m.react('❌').catch(() => {});

        await m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗧𝗜𝗞𝗧𝗢𝗞* ◈',
                '┃',
                '┃│ ❌ Download Error',
                '┃│',
                `┃│ ${err.message || 'Something went wrong.'}`,
                '┃',
                '┃│ Please try again later.',
                '┃',
                '┃│ 🤖 Bot : FREEZER MD BOT',
                '┃',
                '┗▣'
            ].join('\n')
        );
    }
});
