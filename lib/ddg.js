'use strict';

const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36' };

async function searchImages(query) {
    const enc = encodeURIComponent(query);
    const html = await (await fetch(`https://duckduckgo.com/?q=${enc}&iax=images&ia=images`, { headers: UA })).text();
    const vqd = html.match(/vqd=["']?([\d-]+)["']?/)?.[1];
    if (!vqd) throw new Error('search token not found');
    const res = await fetch(
        `https://duckduckgo.com/i.js?l=us-en&o=json&q=${enc}&vqd=${vqd}&f=,,,,,&p=1`,
        { headers: { ...UA, Referer: 'https://duckduckgo.com/' } }
    );
    const data = await res.json();
    return (data.results || []).map(r => r.image).filter(Boolean);
}

module.exports = { searchImages };
