'use strict';

const fs = require('fs');
const { cmd } = require('../arslan');

/* =========================================================
   STYLE (matches the Freezer-MD card)
========================================================= */
const TOP_BANNER = '✧･ﾟ: ✧･ﾟ: ✦ :･ﾟ✧ :･ﾟ✧';
const DIVIDER    = '──────────────────';
const TAGLINE    = 'Beyond Ordinary Automation';
const FOOTER     = 'A NEW UNIVERSE OF COMMANDS.';

/* =========================================================
   CATEGORY LABELS + ORDER
   Key = category name (case-insensitive). Add your own here.
========================================================= */
const CATEGORIES = [
    ['general',     '🚀', 'SYSTEM'],
    ['creative',    '🎨', 'CREATIVE'],
    ['football',    '⚽', 'FOOTBALL'],
    ['tools',       '🛠️', 'TOOLS'],
    ['downloaders', '📥', 'DOWNLOADERS'],
    ['ai',          '🤖', 'AI'],
    ['fun',         '🎮', 'FUN'],
    ['group',       '👥', 'GROUP'],
    ['status',      '📡', 'STATUS'],
    ['channel',     '📢', 'CHANNEL'],
    ['admin',       '👑', 'ADMIN'],
    ['security',    '🛡️', 'SECURITY'],
    ['owner',       '🔐', 'OWNER']
];

/* =========================================================
   PER-COMMAND CATEGORY OVERRIDES
   Many plugins have no category set, so they all land in
   SYSTEM. Move them here without touching the plugin files.
   command name -> category key above
========================================================= */
const OVERRIDES = {
    // group management
    add: 'group', kick: 'group', promote: 'group', demote: 'group',
    left: 'group', tagall: 'group', gclink: 'group',
    // owner controls
    mode: 'owner', sudo: 'owner', cmdreact: 'owner', autobio: 'owner',
    setpp: 'owner', join: 'owner', update: 'owner', channelid: 'owner',
    // tools
    getpp: 'tools'
};

/* =========================================================
   NATIVE COMMANDS (handled inside index.js, not plugins)
========================================================= */
const NATIVE = {
    creative: ['sticker'],
    security: ['anticall', 'antispam', 'warn', 'resetwarn'],
    owner:    ['broadcast', 'backup', 'restore']
};

/* Commands pinned to the top of their category, in this order */
const PINNED = {
    general: ['menu', 'alive', 'ping']
};

/* =========================================================
   BUILD
========================================================= */
function buildMenu() {
    const prefix = global.BOT_PREFIX || '.';
    const botName = String(global.BOT_NAME || 'FREEZER-MD').toUpperCase();
    const grouped = {};
    const seen = new Set();

    const add = (name, category) => {
        const n = String(name || '').trim().toLowerCase();
        if (!n || seen.has(n)) return;
        seen.add(n);
        const key = (OVERRIDES[n] || String(category || 'general')).trim().toLowerCase() || 'general';
        (grouped[key] ||= []).push(n);
    };

    if (global.plugins instanceof Map) {
        for (const plugin of new Set(global.plugins.values())) {
            if (!plugin || !plugin.name || plugin.hidden) continue;
            add(plugin.name, plugin.category);
        }
    }

    for (const [category, names] of Object.entries(NATIVE)) {
        names.forEach(n => add(n, category));
    }

    const known = CATEGORIES.map(c => c[0]);
    const extra = Object.keys(grouped).filter(k => !known.includes(k)).sort();

    const sections = [];
    for (const key of [...known, ...extra]) {
        const list = grouped[key];
        if (!list?.length) continue;

        const meta = CATEGORIES.find(c => c[0] === key);
        const icon = meta ? meta[1] : '📂';
        const label = meta ? meta[2] : key.toUpperCase();

        const pinned = (PINNED[key] || []).filter(n => list.includes(n));
        const rest = list.filter(n => !pinned.includes(n)).sort((a, b) => a.localeCompare(b));

        sections.push(
            [`〔 ${icon} *${label}* 〕`, ...[...pinned, ...rest].map(n => `➤ ${prefix}${n}`)].join('\n')
        );
    }

    return [
        TOP_BANNER,
        `🌌 *${botName}* 🌌`,
        `_${TAGLINE}_`,
        DIVIDER,
        '',
        sections.length ? sections.join('\n\n') : '📭 No commands loaded',
        '',
        DIVIDER,
        `_${FOOTER}_`
    ].join('\n');
}

/* =========================================================
   COMMAND
========================================================= */
cmd({
    pattern: 'menu',
    name: 'menu',
    category: 'General',
    description: 'Show available Freezer-MD commands',
    aliases: ['help', 'cmdlist', 'commands'],
    filename: __filename
}, async (sock, m) => {
    try {
        const menuText = buildMenu();

        // Text only if no image is configured
        if (!global.menuImage) {
            return await m.reply(menuText);
        }

        try {
            let imageBuffer;

            if (/^https?:\/\//i.test(global.menuImage)) {
                const res = await fetch(global.menuImage, { signal: AbortSignal.timeout(15000) });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                imageBuffer = Buffer.from(await res.arrayBuffer());
            } else {
                imageBuffer = fs.readFileSync(global.menuImage);
            }

            if (!imageBuffer?.length) throw new Error('Empty image buffer');

            await m.reply(imageBuffer, { caption: menuText });
        } catch (imgError) {
            console.error('[FREEZER-MD] Menu image failed:', imgError.message);
            await m.reply(menuText);
        }
    } catch (error) {
        console.error('[FREEZER-MD] Menu command error:', error);
        try {
            await m.reply('❌ Menu error: ' + error.message);
        } catch (_) {}
    }
});
