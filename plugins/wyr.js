'use strict';

const { cmd } = require('../arslan');
const { box, goOnline } = require('../lib/groupTools');

// Used if the online API is down
const BACKUP = [
    'Would you rather be able to fly OR be invisible?',
    'Would you rather never use social media again OR never watch TV again?',
    'Would you rather always be 10 minutes late OR always be 20 minutes early?',
    'Would you rather have unlimited money OR unlimited time?',
    'Would you rather live without music OR live without movies?',
    'Would you rather speak every language OR play every instrument?',
    'Would you rather have no phone for a year OR no internet for a month?',
    'Would you rather be famous OR be rich and unknown?',
    'Would you rather lose all your memories OR never make new ones?',
    'Would you rather eat your favourite food every day OR never eat it again?',
    'Would you rather travel to the past OR the future?',
    'Would you rather always tell the truth OR always lie?'
];

cmd({
    pattern: 'wyr',
    name: 'wyr',
    description: 'Would you rather question',
    aliases: ['wouldyourather'],
    filename: __filename
}, async (sock, m) => {
    await goOnline(sock, m);

    let question;
    try {
        const res = await fetch('https://api.truthordarebot.xyz/v1/wyr');
        const data = await res.json();
        question = data?.question;
    } catch {}
    if (!question) question = BACKUP[Math.floor(Math.random() * BACKUP.length)];

    await m.reply(box('WOULD YOU RATHER', [`🤔 ${question}`, '', '💬 Reply with your choice!']));
});
