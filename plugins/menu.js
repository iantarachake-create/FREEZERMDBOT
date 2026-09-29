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
        // 1. PREFIX, DATE & TIME
        // ─────────────────────────────────────────────
        const prefix = global.BOT_PREFIX || '.';
        const now = new Date();

        const date = now.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'Africa/Nairobi'
        });

        const time = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'Africa/Nairobi'
        });

        // ─────────────────────────────────────────────
        // 2. BOT INFO & USER
        // ─────────────────────────────────────────────
        const botName = global.BOT_NAME || 'FREEZER-MD';
        const botOwner = global.ownerName || '🥶 Freezer 🥶';
        const user = m.pushName || m.sender?.split('@')[0] || 'User';

        // ─────────────────────────────────────────────
        // 3. UPTIME & RAM
        // ─────────────────────────────────────────────
        const uptimeSec = Math.floor(process.uptime());

        const days = Math.floor(uptimeSec / 86400);
        const hours = Math.floor((uptimeSec % 86400) / 3600);
        const minutes = Math.floor((uptimeSec % 3600) / 60);
        const seconds = uptimeSec % 60;

        const uptimeParts = [];

        if (days) uptimeParts.push(`${days}d`);
        if (hours) uptimeParts.push(`${hours}h`);
        if (minutes) uptimeParts.push(`${minutes}m`);

        uptimeParts.push(`${seconds}s`);

        const uptimeStr = uptimeParts.join(' ');
        const ramStr = `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)}MB`;

        // ─────────────────────────────────────────────
        // 4. MODERN DOUBLE BOX
        // ─────────────────────────────────────────────
        const TOP = '╔═══════════════════╗';
        const MID = '╠═══════════════════╣';
        const BOTTOM = '╚═══════════════════╝';

        // ─────────────────────────────────────────────
        // 5. CATEGORIES & ICONS
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
            const uniquePlugins = new Set(global.plugins.values());

            for (const plugin of uniquePlugins) {
                if (!plugin || !plugin.name || plugin.hidden) continue;

                const pluginName = String(plugin.name).trim();
                if (!pluginName) continue;

                const uniqueKey = pluginName.toLowerCase();

                if (seen.has(uniqueKey)) continue;

                seen.add(uniqueKey);

                const category = String(
                    plugin.category || 'General'
                ).trim();

                if (!grouped[category]) {
                    grouped[category] = [];
                }

                grouped[category].push(pluginName);
                totalPlugins++;
            }
        }

        // ─────────────────────────────────────────────
        // 7. BUILD CATEGORY SECTIONS
        // ─────────────────────────────────────────────
        const allCategories = [
            ...CATEGORY_ORDER.filter(cat => grouped[cat]?.length),
            ...Object.keys(grouped).filter(cat =>
                !CATEGORY_ORDER.includes(cat) &&
                grouped[cat]?.length
            )
        ];

        let commandSections = '';

        if (totalPlugins === 0) {

            commandSections = `${TOP}
║
║  📭 ❍ *NO COMMANDS LOADED*
║
╚════════════════════╝`;

        } else {

            commandSections = allCategories.map(category => {

                const catIcon = CATEGORY_ICONS[category] || '📂';

                const commands = grouped[category]
                    .sort((a, b) => a.localeCompare(b))
                    .map(cmdName =>
                        `║  ❍ ${prefix}${cmdName}`
                    )
                    .join('\n');

                return `${TOP}
║
║  ${catIcon} ❍ *${category.toUpperCase()}*
║
╠═══════════════════╣
${commands}
║
${BOTTOM}`;

            }).join('\n\n');
        }

        // ─────────────────────────────────────────────
        // 8. FINAL MENU
        // ─────────────────────────────────────────────
        const menuText = `
╔════════════════════╗
║   ❄️  *${botName}*  ❄️
╠════════════════════╣
║
║  👑 ❍ *OWNER*
║     × ${botOwner}
║
║  👤 ❍ *USER*
║     × ${user}
║
║  🧩 ❍ *PLUGINS*
║     × ${totalPlugins}
║
║  ⚡ ❍ *UPTIME*
║     × ${uptimeStr}
║
║  📅 ❍ *DATE*
║     × ${date}
║
║  🕐 ❍ *TIME*
║     × ${time}
║
║  📊 ❍ *RAM*
║     × ${ramStr}
║
║  🔧 ❍ *PREFIX*
║     × ${prefix}
║
╚═══════════════════╝

${commandSections}

╔════════════════════╗
║
║   ❄️  *${botName}*  ❄️
║
╠═══════════════════╣
║
║  🚀 ❍ *FAST* × *STABLE*
║  💠 ❍ *POWERED BY FREEZER*
║  🛡️ ❍ *SECURE & RELIABLE*
║  🧊 ❍ *BUILT DIFFERENT*
║
╚═══════════════════╝`.trim();

        // ─────────────────────────────────────────────
        // 9. SEND – IMAGE OR TEXT ONLY
        // ─────────────────────────────────────────────
        if (!global.menuImage) {
            return await m.reply(menuText);
        }

        let imageBuffer = null;

        try {

            if (/^https?:\/\//i.test(global.menuImage)) {

                imageBuffer = Buffer.from(
                    await (
                        await fetch(
                            global.menuImage,
                            {
                                signal: AbortSignal.timeout(15000)
                            }
                        )
                    ).arrayBuffer()
                );

            } else {

                imageBuffer = require('fs').readFileSync(
                    global.menuImage
                );

            }

            if (!imageBuffer || imageBuffer.length === 0) {
                throw new Error('Empty image buffer');
            }

            await m.reply(imageBuffer, {
                caption: menuText
            });

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
                `╔════════════════════╗
║  ❌ ❍ *MENU ERROR*
╠════════════════════╣
║
║  × ${error.message}
║
╚════════════════════╝`
            );

        } catch (_) {
            /* ignore */
        }
    }
});
