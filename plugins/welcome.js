'use strict';

const fs = require('fs');
const path = require('path');
const { cmd } = require('../arslan');
const { box } = require('../lib/groupTools');

// The welcome/goodbye messages themselves are sent by index.js whenever
// global.welcomeConfig.enabled is true. This command only flips that switch
// (and remembers it across restarts in lib/welcome.json).
const FILE = path.join(__dirname, '..', 'lib', 'welcome.json');

try {
    const saved = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    global.welcomeConfig = { ...(global.welcomeConfig || {}), enabled: !!saved.enabled };
} catch { /* first run */ }

const save = () => {
    try { fs.writeFileSync(FILE, JSON.stringify({ enabled: !!global.welcomeConfig?.enabled })); } catch {}
};

cmd({
    pattern: 'welcome',
    name: 'welcome',
    category: 'Group',
    description: 'Turn welcome / goodbye messages on or off',
    aliases: ['greet'],
    filename: __filename
}, async (sock, m, args) => {
    if (!(m.isOwner || m.isDev)) {
        return m.reply(box('WELCOME', ['❌ Owner only.']));
    }

    const p = global.BOT_PREFIX || '.';
    const opt = (args[0] || '').toLowerCase();
    global.welcomeConfig = global.welcomeConfig || { enabled: false };

    if (opt === 'on' || opt === 'off') {
        global.welcomeConfig.enabled = opt === 'on';
        save();
    } else if (opt && opt !== 'status') {
        return m.reply(box('WELCOME', [`★ ${p}welcome on`, `★ ${p}welcome off`, `★ ${p}welcome status`]));
    }

    await m.reply(box('WELCOME', [
        `${global.welcomeConfig.enabled ? '🟢' : '🔴'} Status : ${global.welcomeConfig.enabled ? 'ON' : 'OFF'}`,
        '🌍 Applies to every group the bot is in'
    ]));
});
