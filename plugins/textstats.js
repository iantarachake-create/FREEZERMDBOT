'use strict';

const { cmd } = require('../arslan');
const { makeBox, quotedText } = require('../lib/freezer-ui');

const box = makeBox('Text Tools');

const STOP = new Set(('the and for that this with you are was were have has had not but from they your what when will ' +
    'would there their been them then than into about which could should just also its our out can all one').split(' '));

const clock = (sec) => {
    if (sec < 1) return 'under 1s';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return m ? `${m}m ${s}s` : `${s}s`;
};

function analyse(text) {
    const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || [];
    const lower = words.map(w => w.toLowerCase());
    const unique = new Set(lower);

    const freq = new Map();
    for (const w of lower) if (w.length >= 3 && !STOP.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
    const top = [...freq.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 3);

    const sentences = text.split(/[.!?…]+(?:\s|$)/).filter(s => s.trim()).length;
    const lines = text.split(/\r?\n/).filter(l => l.trim()).length;
    const paragraphs = text.split(/\r?\n\s*\r?\n/).filter(p => p.trim()).length;
    const longest = words.reduce((a, b) => (b.length > a.length ? b : a), '');

    return {
        chars: [...text].length,
        charsNoSpace: [...text.replace(/\s/g, '')].length,
        words: words.length,
        unique: unique.size,
        sentences, lines, paragraphs,
        avg: words.length ? (words.reduce((n, w) => n + w.length, 0) / words.length).toFixed(1) : '0',
        longest,
        read: clock(words.length / 200 * 60),
        speak: clock(words.length / 130 * 60),
        emojis: (text.match(/\p{Extended_Pictographic}/gu) || []).length,
        links: (text.match(/https?:\/\/\S+/gi) || []).length,
        top
    };
}

cmd({
    pattern: 'textstats',
    name: 'textstats',
    category: 'Tools',
    aliases: ['wordcount', 'wc', 'countwords'],
    description: 'Count words, characters, sentences and reading time',
    filename: __filename
}, async (sock, m) => {
    const prefix = global.BOT_PREFIX || '.';

    // keep the original line breaks: drop only the command word from the message
    const typed = String(m.body || '').replace(/^\S+\s*/, '').trim();
    const text = typed || quotedText(m);

    if (!text) {
        return m.reply(box(
            '📝 *𝗧𝗘𝗫𝗧 𝗦𝗧𝗔𝗧𝗦*',
            '➤ Type some text after the command,',
            '➤ or reply to any text message.',
            '',
            `➤ ${prefix}textstats The quick brown fox jumps.`
        ));
    }

    try {
        const s = analyse(text);
        await m.reply(box(
            '📝 *𝗧𝗘𝗫𝗧 𝗦𝗧𝗔𝗧𝗦*',
            `➤ Characters : ${s.chars} (${s.charsNoSpace} without spaces)`,
            `➤ Words      : ${s.words}  (${s.unique} unique)`,
            `➤ Sentences  : ${s.sentences}`,
            `➤ Lines      : ${s.lines}`,
            `➤ Paragraphs : ${s.paragraphs}`,
            `➤ Avg word   : ${s.avg} letters`,
            s.longest ? `➤ Longest    : ${s.longest.slice(0, 30)} (${s.longest.length})` : null,
            `➤ Read time  : ${s.read}`,
            `➤ Speak time : ${s.speak}`,
            `➤ Emojis     : ${s.emojis}`,
            `➤ Links      : ${s.links}`,
            s.top.length ? `➤ Top words  : ${s.top.map(([w, n]) => `${w} (${n})`).join(', ')}` : null
        ));
    } catch (err) {
        console.error('[TEXTSTATS] Error:', err.message);
        await m.reply(box('❌ *𝗧𝗘𝗫𝗧𝗦𝗧𝗔𝗧𝗦 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
