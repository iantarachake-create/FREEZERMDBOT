'use strict';

const axios = require('axios');
const { cmd } = require('../arslan');
const { box } = require('../lib/groupTools');

cmd({
    pattern: 'gen2',
    name: 'gen2',
    category: 'AI',
    description: 'Generate an AI image (Flux engine)',
    aliases: ['flux', 'imagine'],
    filename: __filename
}, async (sock, m, args) => {
    const prompt = args.join(' ').trim();
    const p = global.BOT_PREFIX || '.';

    if (!prompt) {
        return m.reply(box('GEN2', [
            '🎨 AI image generator',
            '',
            `★ ${p}gen2 a lion wearing a crown`
        ]));
    }

    await m.react('⌛').catch(() => {});

    const seed = Math.floor(Math.random() * 1e9);
    const enc = encodeURIComponent(prompt);
    const urls = [
        `https://image.pollinations.ai/prompt/${enc}?model=flux&width=1024&height=1024&nologo=true&seed=${seed}`,
        `https://image.pollinations.ai/prompt/${enc}?width=1024&height=1024&nologo=true&seed=${seed}`
    ];

    let buffer = null;
    let lastErr = null;
    for (const url of urls) {
        try {
            const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 90000 });
            if (!String(res.headers['content-type'] || '').startsWith('image/')) throw new Error('Not an image');
            buffer = Buffer.from(res.data);
            break;
        } catch (err) {
            lastErr = err;
        }
    }

    if (!buffer) {
        await m.react('❌').catch(() => {});
        return m.reply(box('GEN2', ['❌ Generation failed', `📛 ${lastErr?.message || 'Unknown error'}`]));
    }

    await m.reply(buffer, { caption: box('GEN2', ['🖼️ Image generated', `📝 ${prompt.slice(0, 120)}`]) });
    await m.react('✅').catch(() => {});
});
