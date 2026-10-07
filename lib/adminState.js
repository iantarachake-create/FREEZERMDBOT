'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'admin-state.json');

const REACT_EMOJIS = ['⚡', '🔥', '✅', '🤖', '💯', '✨', '👌', '🚀'];
const num = jid => (jid || '').split('@')[0].split(':')[0];

const state = { mode: 'public', cmdReact: false, autoBio: false, bioText: '', sudo: [] };
let bioTimer = null;

function load() {
    try {
        if (fs.existsSync(FILE)) Object.assign(state, JSON.parse(fs.readFileSync(FILE, 'utf8')));
    } catch (err) {
        console.error('adminState load error:', err.message);
    }
    sync();
}

function save() {
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
    } catch (err) {
        console.error('adminState save error:', err.message);
    }
    sync();
}

// Keep the globals your other plugins/index.js already read in sync
function sync() {
    global.botMode = state.mode;
    global.cmdReactEnabled = state.cmdReact;
    global.autoBio = state.autoBio;
    global.sudoUsers = state.sudo;
}

/* ---------- auto bio ---------- */
function buildBio() {
    if (state.bioText) return state.bioText;
    const up = process.uptime();
    const h = Math.floor(up / 3600), mi = Math.floor((up % 3600) / 60);
    return `🤖 Online | ⏱️ ${h}h ${mi}m | ${new Date().toLocaleTimeString()}`;
}

function stopAutoBio() {
    if (bioTimer) clearInterval(bioTimer);
    bioTimer = null;
}

function startAutoBio(sock) {
    stopAutoBio();
    if (!state.autoBio) return;
    const tick = async () => {
        try { await sock.updateProfileStatus(buildBio().slice(0, 139)); } catch {}
    };
    tick();
    bioTimer = setInterval(tick, 60 * 1000);
}

// Call once when the connection opens
function init(sock) {
    load();
    startAutoBio(sock);
}

/* ---------- message gate (call from index.js) ---------- */
// Returns true when the message must be ignored (private mode).
function gate(sock, m, rawMsg) {
    const isSudo = state.sudo.includes(num(m.sender));
    m.isSudo = isSudo;
    if (isSudo) m.isOwner = true;

    const prefix = global.BOT_PREFIX || '.';
    const isCmd = typeof m.body === 'string' && m.body.startsWith(prefix);
    if (!isCmd) return false;

    const privileged = m.isOwner || m.isDev || rawMsg.key.fromMe;
    if (state.mode === 'private' && !privileged) return true;

    if (state.cmdReact) {
        const emoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];
        sock.sendMessage(m.from, { react: { text: emoji, key: rawMsg.key } }).catch(() => {});
    }
    return false;
}

module.exports = { state, load, save, init, gate, startAutoBio, stopAutoBio, num };
