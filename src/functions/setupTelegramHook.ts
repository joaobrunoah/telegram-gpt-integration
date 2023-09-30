import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import * as TelegramBot from 'node-telegram-bot-api';
import * as path from 'path';

import { ISetupTelegramWebhookBody } from "../modules/setupTelegramWebhook/setupTelegramWebhook.types";
import { saveNewEntryToTelegramDb } from "../services/telegram-db.service";

const FUNCTION_BASE_URL = process.env.FUNCTION_BASE_URL;
const IGNORE_TELEGRAM_INTEGRATION = process.env.IGNORE_TELEGRAM_INTEGRATION;

export async function setupTelegramHook(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const body: ISetupTelegramWebhookBody = JSON.parse(await request.text());
    
    if (!FUNCTION_BASE_URL) {
        return { status: 500, body: '"FUNCTION_BASE_URL" env is missing.' }
    }

    if (!body.telegramBotToken || !body.azureFunctionName || !body.azureFunctionCode) {
        return {
            status: 400,
            body: '"telegramBotToken", "azureFunctionName" and "azureFunctionCode" are required in the body of the request.'
        }
    }

    const webhookUrlObject = new URL(FUNCTION_BASE_URL);
    webhookUrlObject.pathname = path.posix.join('/api', body.azureFunctionName);
    const webhookUrl = `${webhookUrlObject.toString()}?code=${body.azureFunctionCode}`;

    try {
        await saveNewEntryToTelegramDb(body.azureFunctionName, body.telegramBotToken);
    } catch (err) {
        return {
            status: 500,
            body: `Not possible to save the relation of function and telegram bot into the DB:\n\n${JSON.stringify(err)}`
        }
    }
    
    if (IGNORE_TELEGRAM_INTEGRATION) {
        return {
            body: `Test finished with webhook URL ${webhookUrl}`
        }
    }

    const telegramBot = new TelegramBot(body.telegramBotToken, { polling: true });

    try {
        await telegramBot.setWebHook(webhookUrl);
        return {
            body: `Telegram Webhook successfully configured to the webhook ${webhookUrl}`
        }
    } catch (err) {
        return {
            status: 500,
            body: `Failed configuring webhook:\n\n${JSON.stringify(err)}`
        }
    }
};

app.http('setupTelegramHook', {
    methods: ['POST'],
    authLevel: 'function',
    handler: setupTelegramHook
});
