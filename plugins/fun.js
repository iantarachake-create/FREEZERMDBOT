'use strict';

const { cmd } = require('../arslan');
const { makeBox } = require('../lib/freezer-ui');

const box = makeBox('Fun Zone');

/* =========================================================
   CONTENT (all offline, so it never fails)
========================================================= */
const JOKES = [
    "Why don't scientists trust atoms? Because they make up everything.",
    "I told my phone I needed space. Now it keeps saying 'Storage Full'.",
    'Why did the computer go to the doctor? It caught a virus.',
    "I'm reading a book about anti-gravity. It's impossible to put down.",
    'Why do programmers prefer dark mode? Because light attracts bugs.',
    'Why did the scarecrow win an award? He was outstanding in his field.',
    'My Wi-Fi and I have a lot in common. We both disconnect when things get serious.',
    'What do you call a fake noodle? An impasta.',
    'Why was the math book sad? It had too many problems.',
    'Parallel lines have so much in common. Shame they will never meet.',
    'Why did the freezer get promoted? It was always cool under pressure. ❄️',
    'I would tell you a UDP joke, but you might not get it.'
];

const FACTS = [
    'Honey never spoils. Edible honey has been found in ancient Egyptian tombs.',
    'Octopuses have three hearts.',
    "Bananas are berries, but strawberries aren't.",
    'A day on Venus is longer than a year on Venus.',
    'Sharks are older than trees.',
    'Wombat droppings are cube-shaped.',
    "Scotland's national animal is the unicorn.",
    'Lightning strikes the Earth roughly 100 times every second.',
    'The Eiffel Tower can grow several centimetres taller in summer because metal expands in heat.',
    'Your stomach lining renews itself every few days.'
];

const QUOTES = [
    'Stay cool, stay focused, stay Freezer. ❄️',
    'Small steps every day beat big plans someday.',
    "You don't need to be fast, you just need to keep moving.",
    'Be the calm in the chaos.',
    'Discipline is choosing what you want most over what you want now.',
    'A smooth sea never made a skilled sailor.',
    'Do it tired. Do it scared. Just do it.',
    'Your future self is watching what you do today.'
];

const TRUTHS = [
    'What is the most embarrassing thing in your phone gallery?',
    'Who was your first crush?',
    'What is a lie you told that you still remember?',
    'What is the silliest fear you have?',
    'What is the last thing you searched on Google?',
    'Which of your habits would annoy you if someone else had it?',
    'What is the worst gift you ever received?',
    'Who in this group would you trust with a secret?',
    'What is your most used emoji, and why?',
    'What is something you pretend to like but actually dislike?'
];

const DARES = [
    'Send a voice note singing the chorus of any song.',
    'Change your WhatsApp status to "I love Mondays" for one hour.',
    'Text the 5th contact in your list "good morning ☀️".',
    'Speak in rhymes for the next 5 minutes.',
    'Send the 7th photo in your gallery (if it is safe to share).',
    'Do 10 push-ups and send proof.',
    'Say the alphabet backwards in a voice note.',
    'Use only emojis to talk for the next 3 messages.',
    'Compliment every person who replies in the next 5 minutes.',
    'Send a voice note doing your best animal impression.'
];

const ROASTS = [
    "You're the reason shampoo bottles have instructions.",
    "You bring everyone so much joy... when you leave the room.",
    'If laziness was a sport, you would send someone to compete for you.',
    "You're like a cloud: when you disappear, it's a beautiful day.",
    'Your phone has a 1% battery and still more life than your jokes.',
    "I'd agree with you, but then we'd both be wrong.",
    "You're proof that even autocorrect gives up sometimes.",
    "You have the energy of a phone on low-power mode."
];

const WYR = [
    ['be able to fly', 'be invisible'],
    ['never use social media again', 'never watch a movie again'],
    ['have unlimited data', 'have unlimited food'],
    ['live in the past', 'live in the future'],
    ['speak every language', 'talk to animals'],
    ['always be 10 minutes late', 'always be 20 minutes early'],
    ['lose your phone for a month', 'lose your wallet for a month'],
    ['be famous', 'be rich but unknown']
];

const RIDDLES = [
    ['What has hands but cannot clap?', 'A clock'],
    ['What gets wetter the more it dries?', 'A towel'],
    ['What has keys but no locks?', 'A keyboard'],
    ['What can you catch but not throw?', 'A cold'],
    ['The more you take, the more you leave behind. What am I?', 'Footsteps'],
    ['What has a neck but no head?', 'A bottle']
];

const PICKUPS = [
    'Are you Wi-Fi? Because I am feeling a connection.',
    'Are you a keyboard? Because you are my type.',
    'Do you have a map? I keep getting lost in your eyes.',
    "Are you a charger? Because I'm dead without you.",
    'Is your name Google? Because you have everything I have been searching for.',
    'Are you made of copper and tellurium? Because you are Cu-Te.'
];

const EIGHTBALL = [
    'It is certain.', 'Without a doubt.', 'Yes, definitely.', 'You may rely on it.',
    'Most likely.', 'Outlook good.', 'Signs point to yes.', 'Yes.',
    'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.', 'Cannot predict now.',
    "Don't count on it.", 'My reply is no.', 'Outlook not so good.', 'Very doubtful.'
];

/* =========================================================
   HELPERS
========================================================= */
const pick = (list) => list[Math.floor(Math.random() * list.length)];

// same text -> same number (so ship / rate results stay stable)
function hash(text) {
    let h = 0;
    for (const ch of String(text).toLowerCase().trim()) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
}

const bar = (pct) => {
    const full = Math.round(pct / 10);
    return '█'.repeat(full) + '░'.repeat(10 - full);
};

const cleanName = (s) => String(s || '').replace(/@/g, '').replace(/\s+/g, ' ').trim();

/* =========================================================
   ACTIONS  (each returns a ready-to-send message)
========================================================= */
const ACTIONS = {
    joke:   () => box('😂 *𝗝𝗢𝗞𝗘*', `➤ ${pick(JOKES)}`),
    fact:   () => box('🧠 *𝗙𝗨𝗡 𝗙𝗔𝗖𝗧*', `➤ ${pick(FACTS)}`),
    quote:  () => box('💬 *𝗤𝗨𝗢𝗧𝗘*', `➤ ${pick(QUOTES)}`),
    truth:  () => box('🎭 *𝗧𝗥𝗨𝗧𝗛*', `➤ ${pick(TRUTHS)}`),
    dare:   () => box('🔥 *𝗗𝗔𝗥𝗘*', `➤ ${pick(DARES)}`),
    roast:  () => box('🌶️ *𝗥𝗢𝗔𝗦𝗧*', `➤ ${pick(ROASTS)}`, '', '➤ (just for fun 😄)'),
    pickup: () => box('😏 *𝗣𝗜𝗖𝗞𝗨𝗣 𝗟𝗜𝗡𝗘*', `➤ ${pick(PICKUPS)}`),
    wyr: () => {
        const [a, b] = pick(WYR);
        return box('🤔 *𝗪𝗢𝗨𝗟𝗗 𝗬𝗢𝗨 𝗥𝗔𝗧𝗛𝗘𝗥*', `➤ 🅰️ ${a}`, '➤ or', `➤ 🅱️ ${b}`);
    },
    flip: () => box('🪙 *𝗖𝗢𝗜𝗡 𝗙𝗟𝗜𝗣*', `➤ ${Math.random() < 0.5 ? '🟡 HEADS' : '⚪ TAILS'}`),
    dice: (rest) => {
        const sides = Math.min(1000, Math.max(2, parseInt(rest, 10) || 6));
        return box('🎲 *𝗗𝗜𝗖𝗘*', `➤ d${sides} ➜ *${1 + Math.floor(Math.random() * sides)}*`);
    },
    '8ball': (rest, p) => {
        if (!rest) return box('🎱 *𝗠𝗔𝗚𝗜𝗖 𝟴-𝗕𝗔𝗟𝗟*', `➤ Ask a question: ${p}fun 8ball will I win today?`);
        return box('🎱 *𝗠𝗔𝗚𝗜𝗖 𝟴-𝗕𝗔𝗟𝗟*', `➤ Q: ${rest.slice(0, 120)}`, `➤ A: ${pick(EIGHTBALL)}`);
    },
    rate: (rest, p, m) => {
        const what = cleanName(rest) || cleanName(m.pushName) || 'you';
        const pct = hash(what) % 101;
        return box('⭐ *𝗥𝗔𝗧𝗘*', `➤ ${what.slice(0, 40)}`, `➤ ${bar(pct)} ${pct}%`);
    },
    ship: (rest, p, m) => {
        const parts = rest.split(/\s*(?:\||&|\band\b|\+)\s*/i).map(cleanName).filter(Boolean);
        let a = parts[0];
        let b = parts[1];
        if (a && !b) { b = a; a = cleanName(m.pushName) || 'You'; }
        if (!a || !b) return box('💘 *𝗦𝗛𝗜𝗣*', `➤ ${p}fun ship Name1 | Name2`);
        const pct = hash([a, b].sort().join('+')) % 101;
        const verdict = pct > 85 ? 'Perfect match! 💞' : pct > 60 ? 'Looking good 😍' : pct > 35 ? 'Could work 🙂' : 'Just friends 😅';
        return box('💘 *𝗦𝗛𝗜𝗣*', `➤ ${a.slice(0, 25)} ❤️ ${b.slice(0, 25)}`, `➤ ${bar(pct)} ${pct}%`, `➤ ${verdict}`);
    },
    choose: (rest, p) => {
        const options = rest.split('|').map(s => s.trim()).filter(Boolean);
        if (options.length < 2) return box('🧭 *𝗖𝗛𝗢𝗢𝗦𝗘*', `➤ ${p}fun choose pizza | burger | rice`);
        return box('🧭 *𝗖𝗛𝗢𝗢𝗦𝗘*', `➤ I pick: *${pick(options).slice(0, 60)}*`);
    }
};

const ALIASES = {
    jokes: 'joke', facts: 'fact', quotes: 'quote', truths: 'truth', dares: 'dare',
    roasts: 'roast', pickupline: 'pickup', rather: 'wyr', coin: 'flip', toss: 'flip',
    roll: 'dice', ball: '8ball', eightball: '8ball', love: 'ship', pick: 'choose'
};

const LIST = ['joke', 'fact', 'quote', 'truth', 'dare', 'roast', 'pickup', 'wyr', 'riddle', '8ball', 'flip', 'dice', 'rate', 'ship', 'choose'];

cmd({
    pattern: 'fun',
    name: 'fun',
    category: 'Fun',
    aliases: ['funzone', 'fn'],
    description: 'Jokes, facts, truth or dare, 8ball, ship, rate and more',
    filename: __filename
}, async (sock, m, args) => {
    const prefix = global.BOT_PREFIX || '.';
    const first = String(args?.[0] || '').toLowerCase();
    const rest = (args || []).slice(1).join(' ').trim();

    try {
        // ".fun list" -> menu of everything
        if (first === 'list' || first === 'help' || first === 'menu') {
            return await m.reply(box(
                '🎮 *𝗙𝗨𝗡 𝗭𝗢𝗡𝗘*',
                `➤ ${prefix}fun            (random surprise)`,
                ...LIST.map(n => `➤ ${prefix}fun ${n}`),
                '',
                `➤ Try: ${prefix}fun ship Ali | Sara`
            ));
        }

        // ".fun" alone -> a random fun item
        let name = ALIASES[first] || first;
        let input = rest;
        if (!first) {
            name = pick(['joke', 'fact', 'quote', 'truth', 'dare', 'wyr', 'riddle', 'pickup', 'roast']);
            input = '';
        }

        if (name === 'riddle') {
            const [q, a] = pick(RIDDLES);
            await m.reply(box('🧩 *𝗥𝗜𝗗𝗗𝗟𝗘*', `➤ ${q}`, '', '➤ Answer in 20 seconds... ⏳'));
            setTimeout(() => {
                m.reply(box('🧩 *𝗔𝗡𝗦𝗪𝗘𝗥*', `➤ ${a}`)).catch(() => {});
            }, 20000);
            return;
        }

        const action = ACTIONS[name];
        if (!action) {
            return await m.reply(box(
                '❌ *𝗨𝗡𝗞𝗡𝗢𝗪𝗡 𝗢𝗣𝗧𝗜𝗢𝗡*',
                `➤ "${first.slice(0, 20)}" is not a fun option.`,
                `➤ See all: ${prefix}fun list`
            ));
        }

        await m.reply(action(input, prefix, m));
    } catch (err) {
        console.error('[FUN] Error:', err);
        await m.reply(box('❌ *𝗙𝗨𝗡 𝗘𝗥𝗥𝗢𝗥*', `➤ ${String(err.message || err).slice(0, 120)}`)).catch(() => {});
    }
});
