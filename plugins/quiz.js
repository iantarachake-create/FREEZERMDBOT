'use strict';

const { cmd } = require('../arslan');
const { makeBox } = require('../lib/freezer-ui');

const box = makeBox('Quiz Zone');

const TIME_MS = Number(process.env.QUIZ_TIME_MS) || 30000;
const LETTERS = ['A', 'B', 'C', 'D'];

// [question, correct answer, [3 wrong answers]]
const BANK = {
    general: [
        ['Which is the largest planet in our solar system?', 'Jupiter', ['Saturn', 'Neptune', 'Earth']],
        ['How many continents are there?', '7', ['5', '6', '8']],
        ['What is the chemical symbol for gold?', 'Au', ['Ag', 'Gd', 'Go']],
        ['Which animal is the tallest in the world?', 'Giraffe', ['Elephant', 'Ostrich', 'Camel']],
        ['How many days are in a leap year?', '366', ['365', '364', '367']],
        ['Which is the largest ocean?', 'Pacific', ['Atlantic', 'Indian', 'Arctic']]
    ],
    science: [
        ['Which gas do plants take in from the air?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Hydrogen']],
        ['What is the hardest natural substance?', 'Diamond', ['Quartz', 'Granite', 'Iron']],
        ['How many bones does an adult human have?', '206', ['201', '212', '198']],
        ['Which planet is known as the Red Planet?', 'Mars', ['Venus', 'Mercury', 'Jupiter']],
        ['About how fast does light travel?', '300,000 km/s', ['150,000 km/s', '30,000 km/s', '3,000,000 km/s']],
        ['Which blood cells carry oxygen?', 'Red blood cells', ['White blood cells', 'Platelets', 'Plasma']]
    ],
    geography: [
        ['What is the capital of Ghana?', 'Accra', ['Kumasi', 'Tamale', 'Lagos']],
        ['Which is the longest river in Africa?', 'Nile', ['Congo', 'Niger', 'Zambezi']],
        ['What is the capital of Japan?', 'Tokyo', ['Kyoto', 'Osaka', 'Seoul']],
        ['What is the capital of Nigeria?', 'Abuja', ['Lagos', 'Kano', 'Accra']],
        ['Which country has the largest population?', 'India', ['China', 'USA', 'Indonesia']],
        ['In which country is Mount Kilimanjaro?', 'Tanzania', ['Kenya', 'Uganda', 'Ethiopia']]
    ],
    tech: [
        ['What does HTML stand for?', 'HyperText Markup Language', ['HighText Machine Language', 'HyperTool Multi Language', 'Home Text Markup Language']],
        ['Who co-founded Microsoft?', 'Bill Gates', ['Steve Jobs', 'Larry Page', 'Elon Musk']],
        ['What does CPU stand for?', 'Central Processing Unit', ['Central Program Utility', 'Computer Power Unit', 'Core Processing Update']],
        ['Which language runs natively in web browsers?', 'JavaScript', ['Python', 'C++', 'Java']],
        ['What does WWW stand for?', 'World Wide Web', ['World Web Window', 'Wide World Web', 'Web World Wire']],
        ['Which company develops the Android OS?', 'Google', ['Apple', 'Microsoft', 'Nokia']]
    ],
    football: [
        ['Which country won the 2022 FIFA World Cup?', 'Argentina', ['France', 'Brazil', 'Croatia']],
        ['How many players per team are on the pitch?', '11', ['10', '9', '12']],
        ['Which country hosted the 2018 World Cup?', 'Russia', ['Qatar', 'Brazil', 'Germany']],
        ['Who won the 2023 Ballon d\'Or?', 'Lionel Messi', ['Erling Haaland', 'Kylian Mbappe', 'Karim Benzema']],
        ['Which club plays at Camp Nou?', 'FC Barcelona', ['Real Madrid', 'Atletico Madrid', 'Valencia']],
        ['How long is regular time in a football match?', '90 minutes', ['80 minutes', '100 minutes', '120 minutes']]
    ]
};

const CATEGORY_ALIASES = { sci: 'science', geo: 'geography', gk: 'general', soccer: 'football', it: 'tech', computer: 'tech' };

const pending = new Map();      // cardMessageId -> quiz state
const activeByChat = new Map(); // chat -> cardMessageId
const handled = new Set();      // reply ids already processed (hook can fire once per alias)

const shuffle = (list) => {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// "b" / "B)" / "2"  ->  0..3  (or null)
function parseAnswer(text) {
    const t = String(text || '').trim().toLowerCase().replace(/[.)\s]+$/g, '');
    if (/^[a-d]$/.test(t)) return 'abcd'.indexOf(t);
    if (/^[1-4]$/.test(t)) return Number(t) - 1;
    return null;
}

function close(cardId) {
    const quiz = pending.get(cardId);
    if (!quiz) return null;
    clearTimeout(quiz.timer);
    pending.delete(cardId);
    if (activeByChat.get(quiz.chat) === cardId) activeByChat.delete(quiz.chat);
    return quiz;
}

const registered = cmd({
    pattern: 'quiz',
    name: 'quiz',
    category: 'Fun',
    aliases: ['trivia', 'question'],
    description: 'Play a quick quiz: reply A, B, C or D',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';
    const first = String(args?.[0] || '').toLowerCase();
    const categories = Object.keys(BANK);

    const showList = (note) => m.reply(box(
        '🧠 *𝗤𝗨𝗜𝗭*',
        note || null,
        `➤ ${prefix}quiz            (random)`,
        ...categories.map(c => `➤ ${prefix}quiz ${c}`),
        '',
        '➤ Reply to the question with A, B, C or D.'
    ));

    if (first === 'list' || first === 'help') return showList();

    let category;
    if (!first) category = categories[Math.floor(Math.random() * categories.length)];
    else category = categories.includes(first) ? first : CATEGORY_ALIASES[first];
    if (!category) return showList(`❌ Unknown category: ${first.slice(0, 20)}`);

    if (activeByChat.has(m.from)) {
        return m.reply(box('⏳ *𝗤𝗨𝗜𝗭 𝗜𝗡 𝗣𝗥𝗢𝗚𝗥𝗘𝗦𝗦*', '➤ Answer the current question first.'));
    }

    try {
        const [question, correct, wrong] = BANK[category][Math.floor(Math.random() * BANK[category].length)];
        const options = shuffle([correct, ...wrong]);
        const answer = options.indexOf(correct);

        const card = await m.reply(box(
            `🧠 *𝗤𝗨𝗜𝗭 • ${category.toUpperCase()}*`,
            `➤ ${question}`,
            '',
            ...options.map((o, i) => `*${LETTERS[i]})* ${o}`),
            '',
            '➤ Reply to this message with A, B, C or D',
            `➤ ⏱️ ${Math.round(TIME_MS / 1000)} seconds`
        ));

        const cardId = card?.key?.id;
        if (!cardId) throw new Error('Could not send the question');

        const quiz = { chat: m.from, answer, correct, options, tried: new Set(), timer: null };
        quiz.timer = setTimeout(() => {
            if (!close(cardId)) return;
            sock.sendMessage(m.from, {
                text: box('⏰ *𝗧𝗜𝗠𝗘 𝗨𝗣*', '➤ Nobody got it this time.', `➤ Answer: *${LETTERS[answer]}) ${correct}*`)
            }).catch(() => {});
        }, TIME_MS);

        pending.set(cardId, quiz);
        activeByChat.set(m.from, cardId);
    } catch (err) {
        console.error('[QUIZ] Error:', err.message);
        await m.reply(box('❌ *𝗤𝗨𝗜𝗭 𝗘𝗥𝗥𝗢𝗥*', `➤ ${err.message}`));
    }
});

// Runs on every message: catches the A/B/C/D reply to a quiz card
registered.onMessage = async (sock, m) => {
    try {
        const cardId = m.quoted?.key?.id;
        if (!cardId || !pending.has(cardId)) return false;

        const quiz = pending.get(cardId);
        if (quiz.chat !== m.from) return false;

        const pick = parseAnswer(m.body);
        if (pick === null) return false;                // not an answer, let it pass

        if (handled.has(m.id)) return true;             // same reply seen again (alias duplicate)
        handled.add(m.id);
        if (handled.size > 500) handled.clear();

        if (quiz.tried.has(m.sender)) {                 // one try per person
            await m.react('🚫').catch(() => {});
            return true;
        }
        quiz.tried.add(m.sender);

        if (pick !== quiz.answer) {
            await m.react('❌').catch(() => {});
            return true;
        }

        close(cardId);
        await m.react('✅').catch(() => {});
        await sock.sendMessage(m.from, {
            text: box(
                '🏆 *𝗖𝗢𝗥𝗥𝗘𝗖𝗧*',
                `➤ @${String(m.sender).split('@')[0].split(':')[0]} got it!`,
                `➤ Answer: *${LETTERS[quiz.answer]}) ${quiz.correct}*`
            ),
            mentions: [m.sender]
        });
        return true;
    } catch (err) {
        console.error('[QUIZ] onMessage error:', err.message);
        return false;
    }
};
