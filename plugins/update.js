const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync, spawn } = require('child_process');

// ╔══════════════════════════════════════════════════════════════════════╗
// ║                     FREEZER MD • UPDATE SYSTEM                     ║
// ╚══════════════════════════════════════════════════════════════════════╝

// ── GitHub Configuration ───────────────────────────────────────────────
const GITHUB = {
    owner: 'iantarachake-create',
    repo: 'FREEZERMDBOT',
    branch: 'main'
};

// ── Project Paths ──────────────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '..');
const COMMIT_FILE = path.join(PROJECT_ROOT, '.last_update_commit');

// ── Protected Files & Directories ──────────────────────────────────────
// These paths are NEVER overwritten, deleted, or entered during updates.
const PROTECTED_PATHS = [
    'config.js',
    '.env',

    // Sessions / authentication
    'session',
    'sessions',
    'auth_info',

    // Persistent data
    'database',
    'db',
    'data',

    // Dependencies
    'node_modules',
    'package-lock.json',

    // Update system
    '.last_update_commit',
    '.git',

    // Temporary/runtime files
    'tmp',
    'temp',
    'logs',
    'media'
];

// ── Protected Path Checker ────────────────────────────────────────────
function isProtected(relPath) {
    const normalized = relPath
        .split(path.sep)
        .join('/');

    return PROTECTED_PATHS.some(
        protectedPath =>
            normalized === protectedPath ||
            normalized.startsWith(protectedPath + '/')
    );
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║                         GITHUB HELPERS                              ║
// ╚══════════════════════════════════════════════════════════════════════╝

async function getLatestCommit() {
    const apiUrl =
        `https://api.github.com/repos/` +
        `${GITHUB.owner}/${GITHUB.repo}/commits/${GITHUB.branch}`;

    const response = await fetch(apiUrl, {
        headers: {
            'User-Agent': 'FREEZER-MD-Updater',
            'Accept': 'application/vnd.github+json'
        }
    });

    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();

    return {
        sha: data.sha,
        message: (data.commit?.message || 'No commit message')
            .split('\n')[0],
        date:
            data.commit?.committer?.date ||
            data.commit?.author?.date ||
            null
    };
}

function getLocalCommit() {
    try {
        return (
            fs.readFileSync(COMMIT_FILE, 'utf8').trim() ||
            null
        );
    } catch {
        return null;
    }
}

function saveLocalCommit(sha) {
    fs.writeFileSync(
        COMMIT_FILE,
        sha,
        'utf8'
    );
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║                         DOWNLOAD SYSTEM                             ║
// ╚══════════════════════════════════════════════════════════════════════╝

async function downloadZip(destination) {
    const zipUrl =
        `https://github.com/${GITHUB.owner}/` +
        `${GITHUB.repo}/archive/refs/heads/${GITHUB.branch}.zip`;

    const response = await fetch(zipUrl, {
        headers: {
            'User-Agent': 'FREEZER-MD-Updater'
        }
    });

    if (!response.ok) {
        throw new Error(
            `Failed to download update ZIP: ${response.status}`
        );
    }

    const buffer = Buffer.from(
        await response.arrayBuffer()
    );

    fs.writeFileSync(destination, buffer);
}

function extractZip(zipPath, destination) {
    let AdmZip;

    try {
        AdmZip = require('adm-zip');
    } catch {
        throw new Error(
            'Missing dependency "adm-zip". Run: npm install adm-zip'
        );
    }

    const zip = new AdmZip(zipPath);

    zip.extractAllTo(destination, true);

    const directories = fs
        .readdirSync(destination, {
            withFileTypes: true
        })
        .filter(entry => entry.isDirectory());

    if (directories.length !== 1) {
        throw new Error(
            'Unexpected GitHub ZIP structure after extraction.'
        );
    }

    return path.join(
        destination,
        directories[0].name
    );
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║                           VALIDATION                                ║
// ╚══════════════════════════════════════════════════════════════════════╝

function validateExtractedSource(sourceRoot) {
    const requiredFiles = [
        'index.js',
        'package.json'
    ];

    for (const file of requiredFiles) {
        const filePath = path.join(
            sourceRoot,
            file
        );

        if (!fs.existsSync(filePath)) {
            throw new Error(
                `Downloaded update is missing "${file}". ` +
                `Update cancelled before changing the bot.`
            );
        }
    }
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║                         FILE SYNC SYSTEM                            ║
// ╚══════════════════════════════════════════════════════════════════════╝

function syncDirectory(
    sourceDir,
    destinationDir,
    relativePath = ''
) {
    fs.mkdirSync(
        destinationDir,
        { recursive: true }
    );

    const sourceEntries = fs.existsSync(sourceDir)
        ? fs.readdirSync(sourceDir, {
            withFileTypes: true
        })
        : [];

    const destinationEntries = fs.existsSync(destinationDir)
        ? fs.readdirSync(destinationDir, {
            withFileTypes: true
        })
        : [];

    // ── Remove files deleted upstream ─────────────────────────────────
    for (const entry of destinationEntries) {
        const entryRelativePath = path.join(
            relativePath,
            entry.name
        );

        if (isProtected(entryRelativePath)) {
            continue;
        }

        const existsUpstream = sourceEntries.some(
            sourceEntry =>
                sourceEntry.name === entry.name
        );

        if (!existsUpstream) {
            fs.rmSync(
                path.join(
                    destinationDir,
                    entry.name
                ),
                {
                    recursive: true,
                    force: true
                }
            );

            console.log(
                `🗑️ FREEZER UPDATE • Removed: ${entryRelativePath}`
            );
        }
    }

    // ── Copy new / updated files ──────────────────────────────────────
    for (const entry of sourceEntries) {
        const entryRelativePath = path.join(
            relativePath,
            entry.name
        );

        if (isProtected(entryRelativePath)) {
            console.log(
                `🛡️ FREEZER UPDATE • Protected: ${entryRelativePath}`
            );
            continue;
        }

        const sourcePath = path.join(
            sourceDir,
            entry.name
        );

        const destinationPath = path.join(
            destinationDir,
            entry.name
        );

        if (entry.isDirectory()) {
            syncDirectory(
                sourcePath,
                destinationPath,
                entryRelativePath
            );
        } else {
            fs.mkdirSync(
                path.dirname(destinationPath),
                { recursive: true }
            );

            fs.copyFileSync(
                sourcePath,
                destinationPath
            );
        }
    }
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║                         FILE HASHING                                ║
// ╚══════════════════════════════════════════════════════════════════════╝

function fileHash(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }

    return crypto
        .createHash('sha1')
        .update(fs.readFileSync(filePath))
        .digest('hex');
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║                          UPDATE LOCK                                ║
// ╚══════════════════════════════════════════════════════════════════════╝

function isUpdateLocked() {
    return global.__freezerUpdateInProgress === true;
}

function setUpdateLock(value) {
    global.__freezerUpdateInProgress = value;
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║                         SAFE RESTART                                ║
// ╚══════════════════════════════════════════════════════════════════════╝

function restartBot({ onFailure } = {}) {
    return new Promise(resolve => {

        const failRestart = async reason => {
            try {
                if (
                    global.__freezerServer &&
                    !global.__freezerServer.listening &&
                    global.__freezerPort
                ) {
                    global.__freezerServer.listen(
                        global.__freezerPort
                    );
                }
            } catch (_) {}

            if (onFailure) {
                try {
                    await onFailure(reason);
                } catch (_) {}
            }

            resolve(false);
        };

        const spawnReplacement = () => {
            let child;

            try {
                child = spawn(
                    process.argv[0],
                    process.argv.slice(1),
                    {
                        cwd: PROJECT_ROOT,
                        detached: true,
                        stdio: 'inherit',
                        env: process.env
                    }
                );
            } catch (error) {
                return failRestart(
                    `Failed to start new process: ${error.message}`
                );
            }

            let settled = false;

            // Startup verification window
            const STARTUP_TIMEOUT = 6000;

            const startupTimer = setTimeout(() => {
                if (settled) return;

                settled = true;

                child.unref();

                // New process survived the startup window.
                resolve(true);

                process.exit(0);
            }, STARTUP_TIMEOUT);

            child.once('exit', (code, signal) => {
                if (settled) return;

                settled = true;
                clearTimeout(startupTimer);

                failRestart(
                    `New process exited during startup ` +
                    `(code ${code}, signal ${signal || 'none'}).`
                );
            });

            child.once('error', error => {
                if (settled) return;

                settled = true;
                clearTimeout(startupTimer);

                failRestart(
                    `Failed to start replacement process: ${error.message}`
                );
            });
        };

        try {
            const server = global.__freezerServer;

            if (server && server.listening) {
                server.close(() => {
                    spawnReplacement();
                });
            } else {
                spawnReplacement();
            }
        } catch (error) {
            failRestart(
                `Restart error: ${error.message}`
            );
        }
    });
}

// ╔══════════════════════════════════════════════════════════════════════╗
// ║                          UPDATE COMMAND                             ║
// ╚══════════════════════════════════════════════════════════════════════╝

const { cmd } = require('../arslan');

cmd({
    pattern: 'update',
    name: 'update',
    category: 'Owner',
    aliases: ['upgrade', 'patch'],
    description:
        'Owner only — check GitHub and update the bot safely',
    filename: __filename

}, async (sock, m, args) => {

    // ── Owner / Developer Protection ──────────────────────────────────
    if (!m.isOwner && !m.isDev) {
        return m.reply(
            '❌ *ACCESS DENIED*\n\n' +
            'This command is restricted to the bot owner.'
        );
    }

    // ── Prevent duplicate updates ─────────────────────────────────────
    if (isUpdateLocked()) {
        return m.reply(
            '⏳ *UPDATE ALREADY RUNNING*\n\n' +
            'Please wait for the current update to finish.'
        );
    }

    setUpdateLock(true);

    // ── Initial status message ─────────────────────────────────────────
    const loadingMsg = await m.reply(
        '╭━━━〔 ❄️ *FREEZER MD* 〕━━━╮\n' +
        '┃ 🔍 Checking for updates...\n' +
        '╰━━━━━━━━━━━━━━━━━━━━━━━━╯'
    );

    // ── Message editor helper ──────────────────────────────────────────
    const editOrSend = async text => {
        try {
            await sock.sendMessage(
                m.from,
                {
                    text,
                    edit: loadingMsg.key
                }
            );
        } catch {
            await sock.sendMessage(
                m.from,
                { text },
                { quoted: m }
            );
        }
    };

    let tempDirectory = null;

    try {

        // ═══════════════════════════════════════════════════════════════
        // 1. CHECK GITHUB
        // ═══════════════════════════════════════════════════════════════

        const latest = await getLatestCommit();
        const localCommit = getLocalCommit();

        // No changes detected
        if (
            localCommit &&
            localCommit === latest.sha
        ) {
            setUpdateLock(false);

            return editOrSend(
                '╭━━━〔 ❄️ *FREEZER MD* 〕━━━╮\n' +
                '┃\n' +
                '┃ ✅ *BOT IS UP TO DATE*\n' +
                '┃\n' +
                '┃ No new updates were found.\n' +
                '┃\n' +
                '╰━━━━━━━━━━━━━━━━━━━━━━━━╯'
            );
        }

        const formattedDate = latest.date
            ? new Date(latest.date).toLocaleString()
            : 'Unknown';

        await editOrSend(
            '╭━━━〔 🚀 *UPDATE FOUND* 〕━━━╮\n' +
            '┃\n' +
            `┃ 📝 *Commit:* ${latest.message || 'No message'}\n` +
            `┃ 📅 *Date:* ${formattedDate}\n` +
            '┃\n' +
            '┃ 📥 Downloading update...\n' +
            '┃\n' +
            '╰━━━━━━━━━━━━━━━━━━━━━━━━╯'
        );

        // ═══════════════════════════════════════════════════════════════
        // 2. CREATE TEMP DIRECTORY
        // ═══════════════════════════════════════════════════════════════

        tempDirectory = fs.mkdtempSync(
            path.join(
                os.tmpdir(),
                'freezer-md-update-'
            )
        );

        const zipPath = path.join(
            tempDirectory,
            'update.zip'
        );

        const extractionPath = path.join(
            tempDirectory,
            'extracted'
        );

        fs.mkdirSync(
            extractionPath,
            { recursive: true }
        );

        // ═══════════════════════════════════════════════════════════════
        // 3. DOWNLOAD UPDATE
        // ═══════════════════════════════════════════════════════════════

        await downloadZip(zipPath);

        const sourceRoot = extractZip(
            zipPath,
            extractionPath
        );

        // ═══════════════════════════════════════════════════════════════
        // 4. VALIDATE UPDATE
        // ═══════════════════════════════════════════════════════════════

        validateExtractedSource(sourceRoot);

        // ═══════════════════════════════════════════════════════════════
        // 5. CHECK DEPENDENCY CHANGES
        // ═══════════════════════════════════════════════════════════════

        const oldPackageHash = fileHash(
            path.join(
                PROJECT_ROOT,
                'package.json'
            )
        );

        const newPackageHash = fileHash(
            path.join(
                sourceRoot,
                'package.json'
            )
        );

        const dependenciesChanged =
            oldPackageHash !== newPackageHash;

        // ═══════════════════════════════════════════════════════════════
        // 6. APPLY UPDATE
        // ═══════════════════════════════════════════════════════════════

        await editOrSend(
            '╭━━━〔 📦 *INSTALLING UPDATE* 〕━━━╮\n' +
            '┃\n' +
            '┃ 🔄 Updating bot files...\n' +
            '┃ 🛡️ Protected data will remain untouched.\n' +
            '┃\n' +
            '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯'
        );

        syncDirectory(
            sourceRoot,
            PROJECT_ROOT
        );

        // ═══════════════════════════════════════════════════════════════
        // 7. INSTALL DEPENDENCIES IF NEEDED
        // ═══════════════════════════════════════════════════════════════

        if (dependenciesChanged) {

            await editOrSend(
                '╭━━━〔 🔧 *DEPENDENCIES* 〕━━━╮\n' +
                '┃\n' +
                '┃ 📦 package.json changed\n' +
                '┃ ⚙️ Installing dependencies...\n' +
                '┃\n' +
                '┃ ⏳ Please wait...\n' +
                '┃\n' +
                '╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯'
            );

            try {
                execSync(
                    'npm install --omit=dev',
                    {
                        cwd: PROJECT_ROOT,
                        stdio: 'pipe'
                    }
                );

            } catch (error) {

                console.error(
                    '❌ FREEZER UPDATE • npm install failed:',
                    error.message
                );

                await editOrSend(
                    '╭━━━〔 ⚠️ *DEPENDENCY ERROR* 〕━━━╮\n' +
                    '┃\n' +
                    '┃ Files were updated successfully,\n' +
                    '┃ but dependency installation failed.\n' +
                    '┃\n' +
                    `┃ ❌ ${error.message}\n` +
                    '┃\n' +
                    '┃ Run *npm install* manually, then\n' +
                    '┃ restart the bot.\n' +
                    '┃\n' +
                    '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯'
                );

                setUpdateLock(false);

                return;
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // 8. CLEAN TEMP FILES
        // ═══════════════════════════════════════════════════════════════

        fs.rmSync(
            tempDirectory,
            {
                recursive: true,
                force: true
            }
        );

        tempDirectory = null;

        // ═══════════════════════════════════════════════════════════════
        // 9. SAVE COMMIT
        // ═══════════════════════════════════════════════════════════════

        saveLocalCommit(
            latest.sha
        );

        // ═══════════════════════════════════════════════════════════════
        // 10. RESTART & VERIFY
        // ═══════════════════════════════════════════════════════════════

        await editOrSend(
            '╭━━━〔 🔄 *RESTARTING* 〕━━━╮\n' +
            '┃\n' +
            '┃ ✅ Update installed successfully!\n' +
            '┃\n' +
            '┃ 🔄 Restarting FREEZER MD...\n' +
            '┃ 🔍 Verifying startup...\n' +
            '┃\n' +
            '╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯'
        );

        const restarted = await restartBot({

            onFailure: async reason => {

                console.error(
                    '❌ FREEZER UPDATE • Restart failed:',
                    reason
                );

                await editOrSend(
                    '╭━━━〔 ⚠️ *RESTART FAILED* 〕━━━╮\n' +
                    '┃\n' +
                    '┃ The files were updated, but the\n' +
                    '┃ new process failed to start cleanly.\n' +
                    '┃\n' +
                    `┃ ❌ ${reason}\n` +
                    '┃\n' +
                    '┃ 🟢 The current bot process is still\n' +
                    '┃ running.\n' +
                    '┃\n' +
                    '┃ Fix the issue, push the correction,\n' +
                    '┃ then run *update* again.\n' +
                    '┃\n' +
                    '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯'
                );
            }
        });

        // New process successfully took over.
        if (restarted === false) {
            setUpdateLock(false);
        }

    } catch (error) {

        console.error(
            '❌ FREEZER UPDATE • Fatal error:',
            error
        );

        // ── Clean temporary files on failure ──────────────────────────
        if (tempDirectory) {
            try {
                fs.rmSync(
                    tempDirectory,
                    {
                        recursive: true,
                        force: true
                    }
                );
            } catch (_) {}
        }

        await editOrSend(
            '╭━━━〔 ❌ *UPDATE FAILED* 〕━━━╮\n' +
            '┃\n' +
            '┃ The update could not be completed.\n' +
            '┃\n' +
            `┃ ⚠️ ${error.message}\n` +
            '┃\n' +
            '┃ 🛡️ Your protected files were not\n' +
            '┃ intentionally modified by the updater.\n' +
            '┃\n' +
            '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯'
        );

        setUpdateLock(false);
    }
});
