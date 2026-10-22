'use strict';

const fs = require('fs');
const path = require('path');
const { cmd } = require('../arslan');
const { makeBox, isOwner } = require('../lib/freezer-ui');

const box = makeBox('Settings');

// index.js (loadPrefix) already reads { "prefix": "..." } from this file on startup
const CONFIG_FILE = path.join(__dirname, '..', 'config.json');
const DEFAULT_PREFIX = '.';
const MAX_LEN = 3;

function readConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) || {};
    } catch (_) { /* start fresh if the file is damaged */ }
    return {};
}

function writeConfig(data) {
    const tmp = `${CONFIG_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, CONFIG_FILE);
}

// symbols / emoji only, 1-3 characters, no spaces, no letters or digits
function validate(value) {
    const chars = [...value];
    if (!chars.length) return 'Prefix cannot be empty.';
    if (chars.length > MAX_LEN) return `Maximum ${MAX_LEN} characters.`;
    if (/\s/.test(value)) return 'No spaces allowed.';
    if (/[\p{L}\p{N}]/u.test(value)) return 'Use symbols or emoji, not letters or numbers.';
    if (value.includes('@')) return '@ is used for mentions, pick another one.';
    return null;
}

cmd({
    pattern: 'setprefix',
    name: 'setprefix',
    category: 'Owner',
    aliases: ['prefix', 'changeprefix'],
    description: 'Change the bot command prefix',
    filename: __filename
}, async (sock, m, args) => {
    const current = global.BOT_PREFIX || DEFAULT_PREFIX;

    if (!isOwner(m)) {
        return m.reply(box('❌ *𝗢𝗪𝗡𝗘𝗥 𝗢𝗡𝗟𝗬*', '➤ Only the bot owner can change the prefix.'));
    }

    const value = (args?.[0] || '').trim();

    if (!value) {
        return m.reply(box(
            '⚙️ *𝗣𝗥𝗘𝗙𝗜𝗫*',
            `➤ Current : ${current}`,
            '',
            `➤ ${current}setprefix !`,
            `➤ ${current}setprefix #`,
            `➤ ${current}setprefix reset  (back to ${DEFAULT_PREFIX})`
        ));
    }

    const isReset = value.toLowerCase() === 'reset';
    const next = isReset ? DEFAULT_PREFIX : value;

    if (!isReset) {
        const problem = validate(next);
        if (problem) return m.reply(box('❌ *𝗜𝗡𝗩𝗔𝗟𝗜𝗗 𝗣𝗥𝗘𝗙𝗜𝗫*', `➤ ${problem}`));
    }

    try {
        const config = readConfig();
        if (isReset) delete config.prefix; else config.prefix = next;
        writeConfig(config);

        global.BOT_PREFIX = next;   // takes effect immediately, no restart needed

        await m.reply(box(
            '✅ *𝗣𝗥𝗘𝗙𝗜𝗫 𝗨𝗣𝗗𝗔𝗧𝗘𝗗*',
            `➤ Old : ${current}`,
            `➤ New : ${next}`,
            '',
            `➤ Try: ${next}menu`,
            `➤ Forgot it? Type ${next}prefix`
        ));
    } catch (err) {
        console.error('[SETPREFIX] Error:', err);
        await m.reply(box('❌ *𝗖𝗢𝗨𝗟𝗗 𝗡𝗢𝗧 𝗦𝗔𝗩𝗘*', `➤ ${String(err.message || err).slice(0, 120)}`));
    }
});
