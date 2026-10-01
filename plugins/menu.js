'use strict';

const { cmd } = require('../arslan');

cmd({
    pattern: 'menu',
    name: 'menu',
    hidden: true,
    description: 'Show available Freezer-MD commands',
    aliases: ['help', 'cmdlist', 'commands'],
    filename: __filename
}, async (sock, m) => {

    try {
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 1. PREFIX, DATE, TIME & GREETING
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const TZ = 'Africa/Nairobi';
        const prefix = global.BOT_PREFIX || '.';
        const now = new Date();

        const date = now.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: TZ
        });

        const time = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: TZ
        });

        const hour = Number(
            new Intl.DateTimeFormat('en-GB', {
                hour: '2-digit',
                hour12: false,
                timeZone: TZ
            }).format(now)
        ) % 24;

        const greeting =
            hour < 12 ? '🌅 Good Morning' :
            hour < 17 ? '☀️ Good Afternoon' :
            hour < 21 ? '🌇 Good Evening' :
                        '🌙 Good Night';

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 2. BOT INFO
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const botName  = global.BOT_NAME || 'FREEZER-MD';
        const botOwner = global.ownerName || 'Freezer';
        const user     = m.pushName || m.sender?.split('@')[0] || 'User';

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 3. UPTIME & RAM
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const up = Math.floor(process.uptime());

        const d = Math.floor(up / 86400);
        const h = Math.floor((up % 86400) / 3600);
        const min = Math.floor((up % 3600) / 60);
        const s = up % 60;

        const uptimeStr = [
            d && `${d}d`,
            h && `${h}h`,
            min && `${min}m`,
            `${s}s`
        ].filter(Boolean).join(' ');

        const ramStr =
            `${(process.memoryUsage().rss / 1024 / 1024).toFixed(1)} MB`;

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 4. CATEGORY ORDER
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const CATEGORY_ORDER = [
            'General',
            'Downloaders',
            'Tools',
            'AI',
            'Fun',
            'Group',
            'Status',
            'Channel',
            'Admin',
            'Owner',
            'Security'
        ];

        const CATEGORY_ICONS = {
            General: '⚡',
            Downloaders: '📥',
            Tools: '🛠️',
            AI: '🤖',
            Fun: '🎮',
            Group: '👥',
            Status: '📡',
            Channel: '📢',
            Admin: '👑',
            Owner: '🔐',
            Security: '🛡️'
        };

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 5. LOAD & GROUP PLUGINS
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const grouped = {};
        const seen = new Set();

        let totalPlugins = 0;

        if (global.plugins instanceof Map) {

            for (const plugin of new Set(global.plugins.values())) {

                if (!plugin || !plugin.name || plugin.hidden)
                    continue;

                const pluginName =
                    String(plugin.name).trim();

                if (!pluginName)
                    continue;

                const key =
                    pluginName.toLowerCase();

                if (seen.has(key))
                    continue;

                seen.add(key);

                const category =
                    String(plugin.category || 'General').trim()
                    || 'General';

                (grouped[category] ||= []).push(pluginName);

                totalPlugins++;
            }
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 6. CATEGORY LIST
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const allCategories = [
            ...CATEGORY_ORDER.filter(
                c => grouped[c]?.length
            ),

            ...Object.keys(grouped).filter(
                c =>
                    !CATEGORY_ORDER.includes(c) &&
                    grouped[c]?.length
            )
        ];

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 7. COMMAND SECTIONS
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const commandSections = totalPlugins === 0

            ? [
                '┏▣ ◈ *📭 EMPTY* ◈',
                '┃',
                '┃│ No commands loaded',
                '┃',
                '┗▣'
            ].join('\n')

            : allCategories.map(category => {

                const icon =
                    CATEGORY_ICONS[category] || '📂';

                const list =
                    [...grouped[category]]
                    .sort((a, b) => a.localeCompare(b));

                return [
                    `┏▣ ◈ *${icon} ${category.toUpperCase()}* ◈`,
                    '┃',

                    ...list.map(
                        name => `┃│ ★ ${prefix}${name}`
                    ),

                    '┃',
                    '┗▣'
                ].join('\n');

            }).join('\n\n');

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 8. MAIN HEADER
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const header = [
            `┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗* ◈`,
            '┃',
            `┃│ ${greeting}, *${user}* ★`,
            '┃',
            '┃┌─ STATUS OVERVIEW ───',
            `┃│ 🕒 Time      : ${date}, ${time}`,
            '┃│ 🟢 Status    : Online & Ready',
            `┃│ ⚡ Prefix    : ${prefix}`,
            `┃│ 👑 Owner     : ${botOwner}`,
            `┃│ 🧩 Plugins   : ${totalPlugins}`,
            `┃│ ⚡ Uptime    : ${uptimeStr}`,
            `┃│ 📊 RAM       : ${ramStr}`,
            '┃└─────────────',
            '┃',
            `┃📌 ${botName} • Command Center`,
            '┃',
            '┗▣'
        ].join('\n');

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 9. FOOTER
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const footer = [
            '┏▣ ◈ *𝗙𝗥𝗘𝗘𝗭𝗘𝗥 𝗠𝗗* ◈',
            '┃',
            '┃│ ★ Fast',
            '┃│ ★ Secure',
            '┃│ ★ Stable',
            '┃',
            `┃│ 💡 Use *${prefix}<command>*`,
            '┃',
            '┗▣'
        ].join('\n');

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 10. FINAL MENU
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const menuText = [
            header,
            '',
            commandSections,
            '',
            footer
        ].join('\n').trim();

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 11. SEND MENU
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (!global.menuImage) {
            return await m.reply(menuText);
        }

        try {

            let imageBuffer;

            if (/^https?:\/\//i.test(global.menuImage)) {

                const res = await fetch(
                    global.menuImage,
                    {
                        signal: AbortSignal.timeout(15000)
                    }
                );

                if (!res.ok)
                    throw new Error(`HTTP ${res.status}`);

                imageBuffer =
                    Buffer.from(
                        await res.arrayBuffer()
                    );

            } else {

                imageBuffer =
                    require('fs')
                    .readFileSync(global.menuImage);
            }

            if (!imageBuffer?.length)
                throw new Error('Empty image buffer');

            await m.reply(
                imageBuffer,
                {
                    caption: menuText
                }
            );

        } catch (imgError) {

            console.error(
                '[FREEZER-MD] Menu image failed:',
                imgError.message
            );

            await m.reply(menuText);
        }

    } catch (error) {

        console.error(
            '[FREEZER-MD] Menu command error:',
            error
        );

        try {

            await m.reply(
                [
                    '┏▣ ◈ *❌ MENU ERROR* ◈',
                    '┃',
                    `┃│ ★ ${error.message}`,
                    '┃',
                    '┗▣'
                ].join('\n')
            );

        } catch (_) {
            // Ignore reply errors
        }
    }
});
