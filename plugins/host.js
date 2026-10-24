const os = require('os');
const fs = require('fs');
const { cmd } = require('../arslan');
const { makeBox, sizeText } = require('../lib/freezer-ui');

const box = makeBox('Host Center');

function detectPlatform() {
    if (global.hostName) return String(global.hostName);
    const e = process.env;
    if (e.PREFIX && /termux/i.test(e.PREFIX)) return 'Termux';
    if (e.DYNO) return 'Heroku';
    if (e.RAILWAY_ENVIRONMENT || e.RAILWAY_PROJECT_ID) return 'Railway';
    if (e.RENDER) return 'Render';
    if (e.KOYEB_APP_NAME) return 'Koyeb';
    if (e.FLY_APP_NAME) return 'Fly.io';
    if (e.REPL_ID || e.REPL_SLUG) return 'Replit';
    if (e.CODESPACES) return 'GitHub Codespaces';
    if (e.GITPOD_WORKSPACE_ID) return 'Gitpod';
    if (e.VERCEL) return 'Vercel';
    if (e.P_SERVER_UUID || e.PTERODACTYL) return 'Pterodactyl Panel';
    try { if (fs.existsSync('/.dockerenv')) return 'Docker'; } catch (_) {}
    return os.platform() === 'win32' ? 'Windows PC / VPS' : 'VPS / Linux';
}

function uptime(sec) {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return [d && `${d}d`, h && `${h}h`, m && `${m}m`, `${s}s`].filter(Boolean).join(' ');
}

cmd({
    pattern: 'host',
    name: 'host',
    category: 'General',
    aliases: ['hosting', 'server', 'sysinfo'],
    description: 'Show where and how the bot is hosted',
    filename: __filename
}, async (sock, m) => {
    try {
        const total = os.totalmem();
        const free = os.freemem();
        const used = total - free;
        const cpus = os.cpus() || [];
        const cpu = (cpus[0]?.model || 'Unknown').replace(/\s+/g, ' ').trim();
        const load = os.loadavg().map(n => n.toFixed(2)).join(' / ');

        await m.reply(box(
            '🖥️ *𝗛𝗢𝗦𝗧 𝗜𝗡𝗙𝗢*',
            `➤ Platform : ${detectPlatform()}`,
            `➤ OS       : ${os.type()} ${os.release()} (${os.arch()})`,
            `➤ Node     : ${process.version}`,
            `➤ CPU      : ${cpu}`,
            `➤ Cores    : ${cpus.length}`,
            `➤ Load     : ${load}`,
            `➤ RAM      : ${sizeText(used)} / ${sizeText(total)}`,
            `➤ Bot RAM  : ${sizeText(process.memoryUsage().rss)}`,
            `➤ Bot up   : ${uptime(process.uptime())}`,
            `➤ Server up: ${uptime(os.uptime())}`
        ));
    } catch (err) {
        console.error('[HOST] Error:', err.message);
        await m.reply(box('❌ *𝗛𝗢𝗦𝗧 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});
