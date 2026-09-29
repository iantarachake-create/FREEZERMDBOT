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
        // ─────────────────────────────────────────────
        // 1. PREFIX, DATE, TIME & GREETING
        // ─────────────────────────────────────────────
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

        // ─────────────────────────────────────────────
        // 2. BOT INFO
        // ─────────────────────────────────────────────
        const botName  = global.BOT_NAME || 'FREEZER-MD';
        const botOwner = global.ownerName || 'Freezer';
        const user     = m.pushName || m.sender?.split('@')[0] || 'User';

        // ─────────────────────────────────────────────
        // 3. UPTIME & RAM
        // ─────────────────────────────────────────────
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

        // ─────────────────────────────────────────────
        // 4. LAYOUT
        // ─────────────────────────────────────────────
        const RULE = '─'.repeat(20);

        const openBox = (title) =>
            `╭──「 ${title} 」`;

        const row = (text) =>
            `│ ${text}`;

        const spacer = '│';

        const closeBox =
            `╰${RULE}`;

        // ─────────────────────────────────────────────
        // 5. CATEGORIES
        // ─────────────────────────────────────────────
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

        // ─────────────────────────────────────────────
        // 6. LOAD & GROUP PLUGINS
        // ─────────────────────────────────────────────
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

        // ─────────────────────────────────────────────
        // 7. CATEGORY ORDER
        // ─────────────────────────────────────────────
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

        // ─────────────────────────────────────────────
        // 8. COMMAND SECTIONS
        // ─────────────────────────────────────────────
        const commandSections = totalPlugins === 0

            ? [
                openBox('📭 EMPTY'),
                row('No commands loaded'),
                closeBox
            ].join('\n')

            : allCategories.map(category => {

                const icon =
                    CATEGORY_ICONS[category] || '📂';

                const list =
                    [...grouped[category]]
                    .sort((a, b) => a.localeCompare(b));

                return [
                    openBox(
                        `${icon} ${category.toUpperCase()} • ${list.length}`
                    ),

                    spacer,

                    ...list.map(
                        name => row(`★ ${prefix}${name}`)
                    ),

                    spacer,

                    closeBox

                ].join('\n');

            }).join('\n\n');

        // ─────────────────────────────────────────────
        // 9. HEADER
        // ─────────────────────────────────────────────
        const header = [
            `╭──「 ❄️ *${botName}* ❄️ 」`,
            spacer,

            row(`${greeting}, *${user}* ★`),

            spacer,

            row(`👑 *Owner*   ─ ${botOwner}`),
            row(`🧩 *Plugins* ─ ${totalPlugins}`),
            row(`🔧 *Prefix*  ─ ${prefix}`),
            row(`⚡ *Uptime*  ─ ${uptimeStr}`),
            row(`📊 *RAM*     ─ ${ramStr}`),
            row(`📅 *Date*    ─ ${date}`),
            row(`🕐 *Time*    ─ ${time}`),

            spacer,
            closeBox
        ].join('\n');

        // ─────────────────────────────────────────────
        // 10. FOOTER
        // ─────────────────────────────────────────────
        const footer = [
            `╭──「 💠 *${botName}* 」`,
            spacer,

            row('★ Fast  •  ★ Secure  •  ★ Stable'),
            row(`★ Type *${prefix}<command>* to use`),

            spacer,
            closeBox
        ].join('\n');

        // ─────────────────────────────────────────────
        // 11. FINAL MENU
        // ─────────────────────────────────────────────
        const menuText = [
            header,
            '',
            commandSections,
            '',
            footer
        ].join('\n').trim();

        // ─────────────────────────────────────────────
        // 12. SEND MENU
        // ─────────────────────────────────────────────
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
                    '╭──「 ❌ MENU ERROR 」',
                    '│',
                    `│ ★ ${error.message}`,
                    '│',
                    `╰${'─'.repeat(20)}`
                ].join('\n')
            );

        } catch (_) {
            // Ignore reply errors
        }
    }
});
