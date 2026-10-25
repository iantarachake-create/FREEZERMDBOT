'use strict';

// ESPN public soccer JSON (no API key needed).
const SITE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const V2 = 'https://site.api.espn.com/apis/v2/sports/soccer';

// name/alias -> ESPN league code
const LEAGUES = {
    epl:        { code: 'eng.1',          name: 'Premier League',     alias: ['pl', 'premier', 'premierleague', 'england'] },
    laliga:     { code: 'esp.1',          name: 'La Liga',            alias: ['spain', 'pd'] },
    bundesliga: { code: 'ger.1',          name: 'Bundesliga',         alias: ['germany', 'bl1'] },
    seriea:     { code: 'ita.1',          name: 'Serie A',            alias: ['italy', 'sa'] },
    ligue1:     { code: 'fra.1',          name: 'Ligue 1',            alias: ['france', 'fl1'] },
    ucl:        { code: 'uefa.champions', name: 'Champions League',   alias: ['cl', 'champions', 'championsleague'] },
    uel:        { code: 'uefa.europa',    name: 'Europa League',      alias: ['el', 'europa'] },
    kpl:        { code: 'ken.1',          name: 'Kenyan Premier League', alias: ['kenya'] },
    mls:        { code: 'usa.1',          name: 'MLS',                alias: ['usa'] },
    eredivisie: { code: 'ned.1',          name: 'Eredivisie',         alias: ['netherlands', 'dutch'] },
    portugal:   { code: 'por.1',          name: 'Primeira Liga',      alias: ['liga', 'primeira'] },
    championship: { code: 'eng.2',        name: 'EFL Championship',   alias: ['efl'] },
    facup:      { code: 'eng.fa',         name: 'FA Cup',             alias: ['fa'] },
    worldcup:   { code: 'fifa.world',     name: 'FIFA World Cup',     alias: ['wc', 'fifa'] }
};

const DEFAULT_LEAGUE = 'epl';
const LIVE_LEAGUES = ['epl', 'laliga', 'seriea', 'bundesliga', 'ligue1', 'ucl', 'uel', 'kpl'];

function resolveLeague(input) {
    const q = String(input || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
    if (!q) return { key: DEFAULT_LEAGUE, ...LEAGUES[DEFAULT_LEAGUE] };
    for (const [key, l] of Object.entries(LEAGUES)) {
        if (key === q || l.alias.includes(q)) return { key, ...l };
    }
    // raw ESPN code such as "eng.1" or "uefa.champions"
    if (/^[a-z]+\.[a-z0-9_]+$/.test(q)) return { key: q, code: q, name: q.toUpperCase() };
    return null;
}

/* ---------- tiny cache + fetch ---------- */
const cache = new Map();

async function getJSON(url, ttlMs = 45 * 1000) {
    const hit = cache.get(url);
    if (hit && Date.now() - hit.at < ttlMs) return hit.data;

    let lastErr;
    for (let i = 0; i < 2; i++) {
        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
                signal: AbortSignal.timeout(12000)
            });
            if (!res.ok) throw new Error(`ESPN responded ${res.status}`);
            const data = await res.json();
            cache.set(url, { at: Date.now(), data });
            return data;
        } catch (err) {
            lastErr = err;
        }
    }
    throw lastErr;
}

const ymd = d => d.toISOString().slice(0, 10).replace(/-/g, '');

const scoreboard = (code, range) =>
    getJSON(`${SITE}/${code}/scoreboard${range ? `?dates=${range}` : ''}`);

const standings = code => getJSON(`${V2}/${code}/standings`, 5 * 60 * 1000);
const news = code => getJSON(`${SITE}/${code}/news`, 5 * 60 * 1000);

/* ---------- formatting ---------- */
const tz = () => global.timezone || 'Africa/Nairobi';

function fmtTime(iso) {
    return new Date(iso).toLocaleString('en-GB', {
        weekday: 'short', day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz()
    });
}

function parseEvent(ev) {
    const comp = ev.competitions?.[0] || {};
    const home = comp.competitors?.find(c => c.homeAway === 'home') || comp.competitors?.[0] || {};
    const away = comp.competitors?.find(c => c.homeAway === 'away') || comp.competitors?.[1] || {};
    const st = ev.status?.type || {};
    return {
        id: ev.id,
        date: ev.date,
        state: st.state,                 // pre | in | post
        detail: st.shortDetail || '',    // "67'" / "HT" / "FT"
        home: home.team?.displayName || home.team?.name || '?',
        away: away.team?.displayName || away.team?.name || '?',
        hs: home.score ?? '-',
        as: away.score ?? '-'
    };
}

function line(ev) {
    const e = parseEvent(ev);
    if (e.state === 'in') return `🟢 ${e.detail}  ${e.home} ${e.hs}-${e.as} ${e.away}`;
    if (e.state === 'post') return `✅ FT  ${e.home} ${e.hs}-${e.as} ${e.away}`;
    return `🕒 ${fmtTime(e.date)}  ${e.home} vs ${e.away}`;
}

module.exports = {
    LEAGUES, LIVE_LEAGUES, DEFAULT_LEAGUE, resolveLeague,
    getJSON, scoreboard, standings, news, ymd, fmtTime, parseEvent, line
};
