require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const fetch = require("node-fetch");

// Your bot token from .env
const token = process.env.BOT_TOKEN;
// Your Ngrok HTTPS URL from .env
const url = process.env.APP_URL;
// Port for Express server
const port = process.env.PORT || 3000;
// List of channel IDs to send messages to
const channelIds = process.env.CHANNEL_IDS ? process.env.CHANNEL_IDS.split(",") : [];

// Fallback quotes array
const fallbackQuotes = [
    { content: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
    { content: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { content: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" }
];

// Function to escape MarkdownV2 reserved characters
const escapeMarkdownV2 = (text) => {
    const reserved = /[-_*()[\].!>#+=|{}]/g;
    return text.replace(reserved, "\\$&");
};

const bot = new TelegramBot(token, { polling: false });
const app = express();

// Set webhook for Telegram
bot.setWebHook(`${url}/bot${token}`).catch((error) => {
    console.error("Error setting webhook:", error);
});

// Express middleware
app.use(express.json());

// Telegram endpoint to process updates
app.post(`/bot${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Handle /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Hello! I'm your Telegram bot. I share motivational quotes to channels every 10 seconds for testing! 🌟")
        .catch((error) => console.error("Error sending /start message:", error));
});

// Function to fetch a random motivational quote
const fetchQuote = async () => {
    try {
        const response = await fetch("https://zenquotes.io/api/random");
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const data = await response.json();
        return {
            content: data[0].q,
            author: data[0].a
        };
    } catch (error) {
        //console.error("Error fetching quote from ZenQuotes:", error.message);
        // Select a random fallback quote
        const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
        return fallbackQuotes[randomIndex];
    }
};

// Function to send quote to all channels
const sendChannelMessage = async () => {
    const { content, author } = await fetchQuote();
    const date = new Date().toLocaleDateString("en-US", { dateStyle: "full", timeZone: "Asia/Kolkata" });
    const time = new Date().toLocaleTimeString("en-US", { timeStyle: "short", timeZone: "Asia/Kolkata" });
    const escapedContent = escapeMarkdownV2(content);
    const escapedAuthor = escapeMarkdownV2(author);
    const escapedDate = escapeMarkdownV2(date);
    const escapedTime = escapeMarkdownV2(time);
    const message = `*Motivational Quote \\- ${escapedDate} ${escapedTime}* 🌟\n\n_${escapedContent}_ \\- ${escapedAuthor}\n\nReflect and share your thoughts\\! \\#Motivation`;

    for (const channelId of channelIds) {
        try {
            await bot.sendMessage(channelId, message, { parse_mode: "MarkdownV2" });
            console.log(`Quote sent to channel ${channelId} at ${date} ${time}`);
        } catch (error) {
            console.error(`Error sending message to channel ${channelId}:`, error.message);
        }
    }
};

// Send quote every 10 seconds for testing
const cron = require("node-cron");
cron.schedule("0 9 * * *", sendChannelMessage, { timezone: "Asia/Kolkata" });

// Start the Express server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});