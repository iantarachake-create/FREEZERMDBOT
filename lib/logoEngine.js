'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('./groupTools');
const LOGOS = require('./logoList');

async function render(url, texts) {
    let mumaker;
    try { mumaker = require('mumaker'); } catch {
        throw new Error('Run: npm install mumaker');
    }
    const res = await mumaker.ephoto(url, texts.length > 1 ? texts : texts[0]);
    const image = res?.image || res?.url;
    if (!image) throw new Error('no image returned (effect link may be outdated)');
    return image;
}

// Registers one command for one effect from logoList.js
function makeLogo(key, filename) {
    const effect = LOGOS[key];
    cmd({
        pattern: key,
        name: key,
        description: `${effect.label} text effect`,
        filename
    }, async (sock, m, args) => {
        await goOnline(sock, m);

        const raw = args.join(' ').trim();
        const texts = effect.texts > 1
            ? raw.split('|').map(s => s.trim()).filter(Boolean)
            : [raw];

        if (!raw || texts.length < effect.texts) {
            return m.reply(box(effect.label.toUpperCase(), [
                effect.texts > 1
                    ? `❌ Usage: ${global.BOT_PREFIX}${key} Text1 | Text2`
                    : `❌ Usage: ${global.BOT_PREFIX}${key} Popkid`
            ]));
        }

        try {
            await m.reply(box(effect.label.toUpperCase(), ['⏳ Creating your logo...']));
            const image = await render(effect.url, texts.slice(0, effect.texts));
            await sock.sendMessage(m.from, {
                image: { url: image },
                caption: box(effect.label.toUpperCase(), [`✍️ ${texts.join(' | ')}`, '✅ Done'])
            });
        } catch (err) {
            await m.reply(box(effect.label.toUpperCase(), [`❌ Failed: ${err.message}`]));
        }
    });
}

module.exports = { makeLogo, render, LOGOS };
