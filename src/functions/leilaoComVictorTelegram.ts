import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
// const { OpenAIApi } = require('openai');
import * as TelegramBot from 'node-telegram-bot-api';
import { getTelegramBotKeyFromFunctionName } from "../services/telegram-db.service";

/* const openaiApiKey = process.env.OPENAI_KEY;
const openai = new OpenAIApi({ key: openaiApiKey }); */

export async function leilaoComVictorTelegram(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    // Get telegram bot key
    let telegramBotKey: string;
    try {
        telegramBotKey = await getTelegramBotKeyFromFunctionName('leilaoComVictorTelegram');
    } catch (err) {
        return {
            status: 500,
            body: `Error getting telegram bot key from DB:\n\n${JSON.stringify(err)}`
        }
    }
    
    const body:{message: {chat: {id: string}, text: string}} = JSON.parse(await request.text());
    const chatId = body.message.chat.id;
    const text = body.message.text;

    const bot = new TelegramBot(telegramBotKey);
    bot.sendMessage(chatId, `Você enviou a mensagem ${text}`);

    return { body: `chatId: ${chatId}, text: ${text}` };
};

app.http('leilaoComVictorTelegram', {
    methods: ['POST'],
    authLevel: 'function',
    handler: leilaoComVictorTelegram
});
