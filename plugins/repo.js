'use strict';

const { cmd } = require('../arslan');
const fs = require('fs');

cmd({
    pattern: 'repo',
    name: 'repo',
    category: 'General',
    aliases: ['sourcecode', 'script', 'sc', 'github'],
    description: 'Show live Freezer-MD GitHub information',
    filename: __filename
}, async (sock, m) => {

    const REPO_OWNER = 'iantarachake-create';
    const REPO_NAME = 'FREEZERMDBOT';

    const REPO_URL =
        `https://github.com/${REPO_OWNER}/${REPO_NAME}`;

    const API_URL =
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

    let s = {
        desc: 'A modern WhatsApp bot built on Baileys.',
        stars: '—',
        forks: '—',
        watchers: '—',
        issues: '—',
        lang: 'JavaScript',
        lic: 'MIT',
        updated: 'N/A',
        branch: 'main'
    };

    try {
        const res = await fetch(API_URL, {
            headers: {
                'User-Agent': 'Freezer-MD',
                'Accept': 'application/vnd.github+json'
            }
        });

        if (res.ok) {
            const d = await res.json();

            s.desc = d.description || s.desc;
            s.stars = d.stargazers_count ?? s.stars;
            s.forks = d.forks_count ?? s.forks;
            s.watchers = d.watchers_count ?? s.watchers;
            s.issues = d.open_issues_count ?? s.issues;
            s.lang = d.language || s.lang;
            s.lic = d.license?.spdx_id ||
                    d.license?.name ||
                    s.lic;

            s.branch = d.default_branch || s.branch;

            s.updated = d.pushed_at
                ? new Date(d.pushed_at).toLocaleString(
                    'en-GB',
                    { timeZone: 'Africa/Nairobi' }
                )
                : s.updated;
        }

    } catch (e) {
        console.error(
            '[FREEZER-MD] GitHub API Error:',
            e.message
        );
    }

    const info = [
        '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗕𝗢𝗧* ◈',
        '┃',
        '┃│ 📦 *SOURCE CODE*',
        '┃│ ★ FREEZER MD BOT',
        '┃',
        '┃│ 📝 *DESCRIPTION*',
        `┃│ ${s.desc}`,
        '┃',
        '┃│ 🔗 *REPOSITORY*',
        `┃│ ${REPO_URL}`,
        '┃',
        '┃│ ⭐ Stars     : ' + s.stars,
        '┃│ 🍴 Forks     : ' + s.forks,
        '┃│ 👁️ Watchers  : ' + s.watchers,
        '┃│ 🐛 Issues    : ' + s.issues,
        '┃│ 💻 Language  : ' + s.lang,
        '┃│ 📄 License   : ' + s.lic,
        '┃│ 🌿 Branch    : ' + s.branch,
        '┃│ 🕒 Updated   : ' + s.updated,
        '┃',
        '┗▣',
        '',
        '❄️ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗 𝗕𝗢𝗧*',
        '> *𝗙𝗔𝗦𝗧 • 𝗦𝗧𝗔𝗕𝗟𝗘 • 𝗣𝗢𝗪𝗘𝗥𝗙𝗨𝗟*',
        '> *𝗕𝗨𝗜𝗟𝗧 𝗗𝗜𝗙𝗙𝗘𝗥𝗘𝗡𝗧.*'
    ].join('\n');

    try {

        if (!global.menuImage) {
            throw new Error('global.menuImage is not set');
        }

        const img = /^https?:\/\//i.test(global.menuImage)
            ? Buffer.from(
                await (
                    await fetch(global.menuImage, {
                        signal: AbortSignal.timeout(8000)
                    })
                ).arrayBuffer()
            )
            : fs.readFileSync(global.menuImage);

        await m.reply(img, {
            caption: info
        });

    } catch (e) {

        console.error(
            '[FREEZER-MD] Repo image error:',
            e.message
        );

        try {
            await sock.sendMessage(m.from, {
                text: info
            });
        } catch (fe) {
            console.error(
                '[FREEZER-MD] Repo fallback error:',
                fe.message
            );
        }
    }
});
