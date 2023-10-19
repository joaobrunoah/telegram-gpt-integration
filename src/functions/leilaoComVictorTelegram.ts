import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
// const { OpenAIApi } = require('openai');
import * as TelegramBot from 'node-telegram-bot-api';
import { getTelegramBotKeyFromFunctionName } from "../services/telegram-db.service";
import { TelegramMessage } from "../interfaces/telegramMessage.types";
import { getUserlistFromFunctionName } from "../services/userlist-db.service";
import { getChatgptCompletion } from "../services/azure-openai.service";

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
    
    let userlist: string[] = [];
    try {
        userlist = await getUserlistFromFunctionName('leilaoComVictorTelegram');
    } catch (err) {
        return {
            status: 500,
            body: `Error getting userlist from DB:\n\n${JSON.stringify(err)}`
        }
    }

    const body: TelegramMessage = JSON.parse(await request.text());

    context.info(body);

    const username = body.message.from.username;
    const id = body.message.from.id;
    const chatId = body.message.chat.id;
    const text = body.message.text;

    const bot = new TelegramBot(telegramBotKey);

    if (userlist.indexOf(username) < 0 && userlist.indexOf(String(id)) < 0) {
        bot.sendMessage(chatId, `Usuário não cadastrado`);

        return {
            body: `User is unauthorized`
        }
    }
    
    const systemMessage = "Você se chama Victor e é um professor de investimentos que possuí um curso online. Haja como um professor. Se precisar de mais informações, pode perguntar. Você fala português do Brasil.";

    const answer = await getChatgptCompletion({chatId, message: text, systemMessage, context});

    bot.sendMessage(chatId, answer);

    return { body: `Ok!` };
};

app.http('leilaoComVictorTelegram', {
    methods: ['POST'],
    authLevel: 'function',
    handler: leilaoComVictorTelegram
});
