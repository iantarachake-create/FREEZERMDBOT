'use strict';

const axios = require('axios');
const { cmd } = require('../arslan');

cmd({
    pattern: 'genimg',
    name: 'genimg',
    category: 'AI',
    aliases: ['gimg', 'gen', 'timg'],
    filename: __filename
}, async (sock, m, args) => {

    if (!args.length) {
        return m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗚𝗘𝗡𝗜𝗠𝗚* ◈',
                '┃',
                '┃│ 🖼️ Generate an AI image',
                '┃│',
                '┃│ ⚡ Usage : .genimg <text>',
                '┃│ ★ Example:',
                '┃│ .genimg a cat sitting on a chair',
                '┃',
                '┗▣'
            ].join('\n')
        );
    }

    const text = args.join(' ');

    await m.reply(
        [
            '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗚𝗘𝗡𝗜𝗠𝗚* ◈',
            '┃',
            `┃│ 🎨 Prompt : ${text}`,
            '┃│',
            '┃│ ⏳ Generating image...',
            '┃',
            '┗▣'
        ].join('\n')
    );

    try {

        const imageUrl =
            `https://api-abztech.zone.id/ai/genimg?text=${encodeURIComponent(text)}`;

        const response = await axios({
            method: 'get',
            url: imageUrl,
            responseType: 'arraybuffer',
            timeout: 30000
        });

        const buffer = Buffer.from(response.data);

        await m.reply(buffer, {
            caption: [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗* ◈',
                '┃',
                '┃│ 🖼️ Image Generated',
                '┃│ 🟢 Status : Complete',
                '┃│ 🤖 Bot : FREEZER MD BOT',
                '┃',
                '┗▣'
            ].join('\n')
        });

    } catch (err) {

        console.error('[FREEZER-MD] genimg error:', err);

        await m.reply(
            [
                '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗚𝗘𝗡𝗜𝗠𝗚* ◈',
                '┃',
                '┃│ ❌ Generation Failed',
                '┃│',
                `┃│ Error : ${err.message}`,
                '┃',
                '┗▣'
            ].join('\n')
        );
    }
});
