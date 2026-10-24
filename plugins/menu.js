'use strict';

const fs = require('fs');
const { cmd } = require('../arslan');

/* =========================================================
   STYLE
========================================================= */
const LINE_W = '━━━━━━━━━━━━━━━━━━━━━━━━━━';
const FOOTER = [
    '*◈ A NEW UNIVERSE OF COMMANDS ◈*',
    '*© FREEZER-MD 🥶*'
];

function formatUptime(sec) {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ');
}

function getTimeInfo() {
    const tz = global.timezone || 'Africa/Accra';
    const now = new Date();
    const hour = Number(new Intl.DateTimeFormat('en-GB', {
        hour: 'numeric', hourCycle: 'h23', timeZone: tz
    }).format(now));

    const greeting =
        hour >= 5  && hour < 12 ? '🌅 Good Morning' :
        hour >= 12 && hour < 17 ? '☀️ Good Afternoon' :
        hour >= 17 && hour < 21 ? '🌆 Good Evening' :
                                  '🌙 Good Night';

    const time = now.toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true, timeZone: tz
    }).replace(/am|pm/i, s => s.toUpperCase());

    return { greeting, time };
}

/* =========================================================
   CATEGORY LABELS + ORDER
   Key = category name (case-insensitive). Add your own here.
========================================================= */
const CATEGORIES = [
    ['general',     '🚀', 'SYSTEM'],
    ['creative',    '🎨', 'CREATIVE'],
    ['logo',        '🖼️', 'LOGO MENU'],
    ['football',    '⚽', 'FOOTBALL'],
    ['tools',       '🛠️', 'TOOLS'],
    ['downloaders', '📥', 'DOWNLOADERS'],
    ['ai',          '🤖', 'AI SYSTEM'],
    ['fun',         '🎮', 'FUN ZONE'],
    ['group',       '👥', 'GROUP CONTROL'],
    ['status',      '📡', 'STATUS'],
    ['channel',     '📢', 'CHANNEL'],
    ['admin',       '👑', 'ADMIN PANEL'],
    ['security',    '🛡️', 'SECURITY'],
    ['owner',       '🔐', 'OWNER ACCESS']
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
    retag: 'group', tagme: 'group', welcome: 'group', poll: 'group',

    // owner controls
    mode: 'owner', sudo: 'owner', cmdreact: 'owner', autobio: 'owner',
    setpp: 'owner', join: 'owner', update: 'owner', channelid: 'owner',
    pair: 'owner',

    // channel
    chr: 'channel',

    // status
    togstatus: 'status',

    // tools
    getpp: 'tools', ocr: 'tools', tts: 'tools', tourl: 'tools',
    compress: 'tools', img: 'tools', shazam: 'tools', toaudio: 'tools',

    // downloaders
    facebook: 'downloaders', instagram: 'downloaders',
    mediafire: 'downloaders', ytsearch: 'downloaders',

    // creative
    tweet: 'creative',

    // fun zone
    lyrics: 'fun', ppcouple: 'fun', wyr: 'fun',

    // logo menu
    advancedglow: 'logo', americanflag: 'logo', blackpinklogo: 'logo',
    blackpinkstyle: 'logo', bluearchive: 'logo', cartoonstyle: 'logo',
    deletingtext: 'logo', effectclouds: 'logo', galaxy: 'logo',
    galaxystyle: 'logo', glitchtext: 'logo', glossysilver: 'logo',
    glowingtext: 'logo', gradienttext: 'logo', lighteffect: 'logo',
    logo1917: 'logo', luxurygold: 'logo', makingneon: 'logo',
    neonglitch: 'logo', nigerianflag: 'logo', papercut: 'logo',
    pixelglitch: 'logo', sandsummer: 'logo', summerbeach: 'logo',
    typographytext: 'logo', underwater: 'logo', writetext: 'logo',
    logomaker: 'logo', logolist: 'logo', textpro: 'logo'
};

/* =========================================================
   NATIVE COMMANDS (handled inside index.js -> handleNativeCommand,
   not plugins). These really exist in this base.
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
    const grouped = {};
    const seen = new Set();

    const addCmd = (name, category) => {
        const n = String(name || '').trim();
        if (!n || seen.has(n)) return;
        seen.add(n);
        const key = String(OVERRIDES[n.toLowerCase()] || category || 'General').trim().toLowerCase() || 'general';
        (grouped[key] ||= []).push(n);
    };

    // Same logic as the PopKid menu: build from the plugins that are actually loaded
    if (global.plugins instanceof Map) {
        for (const plugin of global.plugins.values()) {
            if (!plugin || !plugin.name) continue;
            if (plugin.hidden) continue;
            addCmd(plugin.name, plugin.category);
        }
    }

    for (const [category, names] of Object.entries(NATIVE)) {
        names.forEach(n => addCmd(n, category));
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

        const pinned = (PINNED[key] || [])
            .map(p => list.find(n => n.toLowerCase() === p))
            .filter(Boolean);
        const rest = list
            .filter(n => !pinned.includes(n))
            .sort((a, b) => a.localeCompare(b));

        sections.push([
            `┏▣ ◈ ◈ *${icon} ${label}* ◈`,
            ...[...pinned, ...rest].map(n => `┃➤ ${prefix}${n}`),
            '┗▣'
        ].join('\n'));
    }

    const mode = global.botMode === 'private' ? 'PRIVATE' : 'PUBLIC';
    const dev = String(global.ownerName || 'FREEZER').toUpperCase();
    const version = String(global.BOT_VERSION || 'V1').toUpperCase();
    const totalCommands = seen.size; // exactly what is listed below

    const { greeting, time } = getTimeInfo();
    const ownerShown = String(global.ownerName || 'Freezer').replace(/[^\p{L}\p{N}\s._-]/gu, '').trim() || 'Freezer'; // config.js name has emojis already
    const ram = (process.memoryUsage().rss / 1024 / 1024).toFixed(1);

    const header = [
        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗* ◈',
        '┃',
        `┃│ ${greeting}, *${ownerShown}🥶* ★`,
        '┃',
        '┃┌─ *STATUS OVERVIEW* ───',
        `┃│ 🕒 Time      : ${time}`,
        '┃│ 🟢 Status    : Online & Ready',
        `┃│ ⚡ Prefix    : ${prefix}`,
        `┃│ 👑 Owner     : 🥶 ${ownerShown} 🥶`,
        `┃│ 🧩 Commands  : ${totalCommands}`,
        `┃│ ⚡ Uptime    : ${formatUptime(process.uptime())}`,
        `┃│ 📊 RAM       : ${ram} MB`,
        '┃└─────────────',
        '┃',
        '┃📌 FREEZER-MD • Command Center',
        '┃',
        '┗▣'
    ].join('\n');

    return [
        header,
        '',
        sections.length ? sections.join('\n\n') : '📭 No commands loaded',
        '',
        ...FOOTER
    ].join('\n');
}

/* =========================================================
   MENU IMAGE (loaded once, then cached so the menu opens fast)
========================================================= */
const IMAGE_TTL = 10 * 60 * 1000;
let imageCache = { source: null, buffer: null, at: 0 };

async function loadMenuImage() {
    const source = global.menuImage;
    if (!source) return null;

    if (imageCache.buffer && imageCache.source === source && Date.now() - imageCache.at < IMAGE_TTL) {
        return imageCache.buffer;
    }

    let buffer;
    if (/^https?:\/\//i.test(source)) {
        const res = await fetch(source, { signal: AbortSignal.timeout(15000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        buffer = Buffer.from(await res.arrayBuffer());
    } else {
        buffer = fs.readFileSync(source);
    }
    if (!buffer?.length) throw new Error('Empty image buffer');

    imageCache = { source, buffer, at: Date.now() };
    return buffer;
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
    let menuText;
    try {
        menuText = buildMenu();
    } catch (error) {
        console.error('[FREEZER-MD] Menu build error:', error);
        return m.reply('❌ Menu error: ' + error.message).catch(() => {});
    }

    // 1) image + menu as caption
    try {
        const image = await loadMenuImage();
        if (image) return await m.reply(image, { caption: menuText });
    } catch (imgError) {
        console.error('[FREEZER-MD] Menu image failed, sending text:', imgError.message);
    }

    // 2) plain text (no image configured, or the image could not be loaded/sent)
    try {
        await m.reply(menuText);
    } catch (error) {
        console.error('[FREEZER-MD] Menu send error:', error);
    }
});
