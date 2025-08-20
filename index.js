const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const token = process.env.BOT_TOKEN || "8156024025:AAF9YE6n6CJv_KjCURZeMO1_h83K4_dM57s";
const url = process.env.APP_URL || "https://your-heroku-app.herokuapp.com";
const port = process.env.PORT || 3000;

const bot = new TelegramBot(token, { polling: false });
const app = express();

// Webhook
bot.setWebHook(`${url}/bot${token}`);

app.use(express.json());

// Endpoint for Telegram
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Example command
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "Hello! I'm your Node.js Telegram bot 🚀");
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
