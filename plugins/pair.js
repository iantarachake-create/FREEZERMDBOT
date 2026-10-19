'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const pino = require('pino');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    fetchLatestWaWebVersion,
    Browsers,
    delay
} = require('@whiskeysockets/baileys');

const { cmd } = require('../arslan');
const { box } = require('../lib/groupTools');

// .pair 2547XXXXXXXX
//   1. asks WhatsApp for an 8-character pairing code for that number
//   2. the number's owner types it in  WhatsApp > Linked devices > Link with phone number
//   3. when linked, a FREEZER~ SESSION_ID is sent to the person who ran the command (in DM)
//
// Set to true only if you want everyone to be able to use it.
// Keep it false: a session ID gives full access to a WhatsApp account.
const PUBLIC_PAIR = false;
const TIMEOUT_MS = 3 * 60 * 1000;
const RESTART_REQUIRED = 515;
const active = new Set();

cmd({
    pattern: 'pair',
    name: 'pair',
    category: 'Owner',
    description: 'Get a pairing code + SESSION_ID for a WhatsApp number',
    aliases: ['paircode', 'getsession'],
    filename: __filename
}, async (sock, m, args) => {
    const p = global.BOT_PREFIX || '.';

    if (!PUBLIC_PAIR && !(m.isOwner || m.isDev)) {
        return m.reply(box('PAIR', ['❌ Owner only.']));
    }

    const number = args.join('').replace(/\D/g, '');
    if (number.length < 8 || number.length > 15) {
        return m.reply(box('PAIR', [
            '🔗 Link a WhatsApp number',
            '',
            `★ ${p}pair 2547XXXXXXXX`,
            '',
            'Use the full number with country',
            'code, no + or spaces.'
        ]));
    }
    if (active.has(number)) {
        return m.reply(box('PAIR', ['⏳ A pairing for this number is already running.']));
    }
    active.add(number);

    const requester = String(m.sender || '').replace(/:\d+@/, '@');
    const logger = pino({ level: 'silent' });
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'freezer-pair-'));
    let cur = null;
    let finished = false;
    let timer = null;

    const finish = async lines => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        try { cur?.end(undefined); } catch {}
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
        active.delete(number);
        if (lines) await m.reply(box('PAIR', lines)).catch(() => {});
    };

    const connect = async first => {
        const { state, saveCreds } = await useMultiFileAuthState(dir);
        let version;
        try { version = (await fetchLatestWaWebVersion()).version; } catch {}

        const s = makeWASocket({
            ...(version ? { version } : {}),
            logger,
            auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, logger) },
            printQRInTerminal: false,
            browser: Browsers.macOS('Safari'),
            markOnlineOnConnect: false,
            syncFullHistory: false
        });
        cur = s;
        s.ev.on('creds.update', saveCreds);

        s.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
            if (finished || s !== cur) return;

            if (connection === 'open') {
                await delay(5000); // let creds.json finish writing
                try {
                    const creds = fs.readFileSync(path.join(dir, 'creds.json'));
                    const session = 'FREEZER~' + zlib.gzipSync(creds).toString('base64');
                    await sock.sendMessage(requester, {
                        text: box('PAIR SUCCESS', [
                            `✅ ${number} linked`,
                            '',
                            '🔐 SESSION_ID (keep it secret):'
                        ])
                    });
                    await sock.sendMessage(requester, { text: session });
                    await finish(['✅ Paired successfully!', '📩 SESSION_ID sent to your DM.']);
                } catch (err) {
                    await finish([`❌ Could not read session: ${err.message}`]);
                }
            } else if (connection === 'close') {
                const status = lastDisconnect?.error?.output?.statusCode;
                if (status === RESTART_REQUIRED) {
                    try { await connect(false); }
                    catch (err) { await finish([`❌ ${err.message}`]); }
                } else {
                    await finish([`❌ Pairing failed (code ${status || 'unknown'}).`, 'Check the number and try again.']);
                }
            }
        });

        if (first && !s.authState.creds.registered) {
            await delay(3000);
            const code = await s.requestPairingCode(number);
            const shown = code?.match(/.{1,4}/g)?.join('-') || code;
            await m.reply(box('PAIR CODE', [
                `📱 Number : ${number}`,
                `🔑 Code   : *${shown}*`,
                '',
                'WhatsApp > Linked devices >',
                'Link with phone number, then',
                'type the code. Expires in 3 min.'
            ]));
        }
    };

    timer = setTimeout(() => finish(['⌛ Pairing timed out. Run it again.']), TIMEOUT_MS);

    try {
        await connect(true);
    } catch (err) {
        console.error('[FREEZER-MD] pair error:', err);
        await finish([`❌ ${err.message}`]);
    }
});
