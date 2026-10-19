'use strict';

const axios = require('axios');
const { cmd } = require('../arslan');
const { box } = require('../lib/groupTools');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

async function fromBing(q) {
    const { data } = await axios.get('https://www.bing.com/images/search', {
        params: { q, form: 'HDRSC2', first: 1, adlt: 'strict' },
        headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
        timeout: 15000
    });
    const urls = [];
    const re = /murl&quot;:&quot;(.*?)&quot;/g;
    let x;
    while ((x = re.exec(String(data)))) urls.push(x[1].replace(/&amp;/g, '&'));
    return urls;
}

async function fromDDG(q) {
    const page = await axios.get('https://duckduckgo.com/', {
        params: { q, iax: 'images', ia: 'images' }, headers: { 'User-Agent': UA }, timeout: 15000
    });
    const vqd = /vqd=["']?([\d-]+)["']?/.exec(String(page.data))?.[1];
    if (!vqd) return [];
    const { data } = await axios.get('https://duckduckgo.com/i.js', {
        params: { l: 'us-en', o: 'json', q, vqd, f: ',,,,,', p: '1' },
        headers: { 'User-Agent': UA, Referer: 'https://duckduckgo.com/' },
        timeout: 15000
    });
    return (data?.results || []).map(r => r.image).filter(Boolean);
}

async function download(url) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer', timeout: 10000, maxContentLength: 6 * 1024 * 1024,
        headers: { 'User-Agent': UA, Referer: new URL(url).origin }
    });
    const type = String(res.headers['content-type'] || '');
    if (!/^image\/(jpe?g|png|webp)/i.test(type)) throw new Error('not a usable image');
    const buf = Buffer.from(res.data);
    if (buf.length < 2000) throw new Error('too small');
    return buf;
}

cmd({
    pattern: 'img',
    name: 'img',
    category: 'Downloaders',
    description: 'Search and send images',
    aliases: ['image', 'imgsearch', 'pic'],
    filename: __filename
}, async (sock, m, args) => {
    const p = global.BOT_PREFIX || '.';
    const raw = args.join(' ').trim();
    const [queryPart, countPart] = raw.split('|').map(s => s.trim());
    const query = queryPart || '';
    const count = Math.min(Math.max(parseInt(countPart, 10) || 4, 1), 8);

    if (!query) {
        return m.reply(box('IMAGE SEARCH', [
            '🔎 Search the web for images',
            '',
            `★ ${p}img maasai mara sunset`,
            `★ ${p}img lion cubs | 6   (1-8 images)`
        ]));
    }

    await m.react('⌛').catch(() => {});

    let candidates = [];
    for (const source of [fromBing, fromDDG]) {
        try {
            candidates = [...new Set(await source(query))];
            if (candidates.length) break;
        } catch (err) {
            console.error(`[FREEZER-MD] img ${source.name} error:`, err.message);
        }
    }

    if (!candidates.length) {
        await m.react('❌').catch(() => {});
        return m.reply(box('IMAGE SEARCH', ['❌ No images found.']));
    }

    const results = await Promise.allSettled(candidates.slice(0, count * 3).map(download));
    const images = results.filter(r => r.status === 'fulfilled').map(r => r.value).slice(0, count);

    if (!images.length) {
        await m.react('❌').catch(() => {});
        return m.reply(box('IMAGE SEARCH', ['❌ Could not download any image.', 'Try different keywords.']));
    }

    for (let i = 0; i < images.length; i++) {
        const caption = i === 0 ? box('IMAGE SEARCH', [`🔎 ${query}`, `🖼️ ${images.length} result(s)`]) : '';
        if (i === 0) await m.reply(images[i], { caption });
        else await sock.sendMessage(m.from, { image: images[i] });
    }
    await m.react('✅').catch(() => {});
});
