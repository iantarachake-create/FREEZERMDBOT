const axios = require('axios');
const { cmd } = require('../arslan');
const { makeBox, UA, FOOTER, quotedText } = require('../lib/freezer-ui');

const box = makeBox('Image Center');

const GIMAGE_API = 'https://api.delirius.online/search/gimage';
const MAX_IMAGES = 5;

const isUrl = (u) => /^https?:\/\//i.test(String(u || ''));

async function viaApi(query) {
    const { data } = await axios.get(GIMAGE_API, { params: { query }, timeout: 30000 });
    const list = data?.data || data?.result || data?.results || [];
    return list
        .map(i => (typeof i === 'string' ? i : i?.url || i?.image || i?.link))
        .filter(isUrl);
}

// Backup source if the API is down
async function viaBing(query) {
    const { data } = await axios.get('https://www.bing.com/images/search', {
        params: { q: query, form: 'HDRSC2' },
        headers: { 'User-Agent': UA },
        timeout: 30000
    });
    const urls = [];
    const re = /murl&quot;:&quot;(.*?)&quot;/g;
    let hit;
    while ((hit = re.exec(String(data)))) urls.push(hit[1].replace(/&amp;/g, '&'));
    return urls.filter(isUrl);
}

async function findImages(query) {
    try {
        const r = await viaApi(query);
        if (r.length) return r;
    } catch (_) { /* fall back to bing */ }
    return viaBing(query);
}

cmd({
    pattern: 'img',
    name: 'img',
    category: 'Downloaders',
    aliases: ['image', 'gimage', 'imgsearch'],
    description: 'Search images on the web',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';
    let count = 3;
    const words = [];
    for (const a of args || []) {
        const hit = /^-([1-5])$/.exec(a);
        if (hit) count = Number(hit[1]); else words.push(a);
    }
    const query = words.join(' ').trim() || quotedText(m);

    if (!query) {
        return m.reply(box(
            '🖼️ *𝗜𝗠𝗔𝗚𝗘 𝗦𝗘𝗔𝗥𝗖𝗛*',
            '➤ Enter what you want to search.',
            '',
            '📌 *𝗘𝗫𝗔𝗠𝗣𝗟𝗘𝗦*',
            `➤ ${prefix}img lamborghini`,
            `➤ ${prefix}img black cat -5  (up to ${MAX_IMAGES})`
        ));
    }

    try {
        await m.react('🔎');
        const urls = await findImages(query);
        if (!urls.length) throw new Error(`No images found for: ${query}`);

        let sent = 0;
        for (const url of urls.slice(0, 15)) {
            if (sent >= count) break;
            try {
                await m.reply({ image: { url }, caption: `🖼️ ${query}\n\n${FOOTER}` });
                sent++;
            } catch (_) { /* bad link, try the next one */ }
        }
        if (!sent) throw new Error('Could not load any of the images');
        await m.react('✅');
    } catch (err) {
        console.error('[IMG] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗜𝗠𝗚 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`, '➤ Please try again.'));
    }
});
