const axios = require('axios');
const { cmd } = require('../arslan');
const { makeBox, UA, toOpus, quotedText } = require('../lib/freezer-ui');

const box = makeBox('Voice Center');
const MAX_CHARS = 600;
const CHUNK = 180;

// split on spaces so no word is cut, each piece <= CHUNK chars
function chunkText(text) {
    const out = [];
    let cur = '';
    for (const word of text.split(/\s+/)) {
        if ((cur + ' ' + word).trim().length > CHUNK) {
            if (cur) out.push(cur);
            cur = word.slice(0, CHUNK);
        } else {
            cur = (cur + ' ' + word).trim();
        }
    }
    if (cur) out.push(cur);
    return out;
}

async function speak(piece, lang) {
    const res = await axios.get('https://translate.google.com/translate_tts', {
        params: { ie: 'UTF-8', q: piece, tl: lang, client: 'tw-ob' },
        headers: { 'User-Agent': UA },
        responseType: 'arraybuffer',
        timeout: 30000
    });
    return Buffer.from(res.data);
}

cmd({
    pattern: 'tts',
    name: 'tts',
    category: 'Tools',
    aliases: ['say', 'speak', 'texttospeech'],
    description: 'Turn text into a voice note',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';
    const list = [...(args || [])];

    // language is picked with a dash:  .tts -es hola amigo
    let lang = global.ttsLang || 'en';
    const flag = /^-([a-z]{2}(?:-[a-zA-Z]{2})?)$/.exec(list[0] || '');
    if (flag) { lang = flag[1]; list.shift(); }

    const text = list.join(' ').trim() || quotedText(m);

    if (!text) {
        return m.reply(box(
            '🗣️ *𝗧𝗘𝗫𝗧 𝗧𝗢 𝗦𝗣𝗘𝗘𝗖𝗛*',
            `➤ ${prefix}tts hello how are you`,
            `➤ ${prefix}tts -es hola amigo  (language)`,
            `➤ ${prefix}tts -fr bonjour`,
            '',
            '➤ Or reply to a text message.',
            `➤ Default language: ${lang}`
        ));
    }
    if (text.length > MAX_CHARS) {
        return m.reply(box('❌ *𝗧𝗘𝗫𝗧 𝗧𝗢𝗢 𝗟𝗢𝗡𝗚*', `➤ Max ${MAX_CHARS} characters.`));
    }

    try {
        await m.react('🗣️');
        const parts = [];
        for (const piece of chunkText(text)) parts.push(await speak(piece, lang));
        const mp3 = Buffer.concat(parts);

        try {
            const ogg = await toOpus(mp3, 'mp3');
            await m.reply({ audio: ogg, mimetype: 'audio/ogg; codecs=opus', ptt: true });
        } catch (convErr) {
            console.error('[TTS] Opus conversion failed, sending mp3:', convErr.message);
            await m.reply({ audio: mp3, mimetype: 'audio/mpeg', ptt: true });
        }
        await m.react('✅');
    } catch (err) {
        console.error('[TTS] Error:', err.message);
        await m.react('❌').catch(() => {});
        await m.reply(box('❌ *𝗧𝗧𝗦 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`, '➤ Check the language code and try again.'));
    }
});
