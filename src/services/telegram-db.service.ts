import { getTextFromAzureFile, saveTextIntoAzureFile } from "./azure-storage.service";

const TELEGRAM_BOT_DB_FILE_NAME = process.env.TELEGRAM_BOT_DB_FILE_NAME;

export const saveNewEntryToTelegramDb = async (functionName: string, telegramBotKey: string) => {
    const jsonDb = await getJsonDb();

    jsonDb[functionName] = telegramBotKey;
    const newJsonTextDb = JSON.stringify(jsonDb);
    await saveTextIntoAzureFile(TELEGRAM_BOT_DB_FILE_NAME, newJsonTextDb);
}

export const getTelegramBotKeyFromFunctionName = async (functionName: string): Promise<string> => {
    const jsonDb = await getJsonDb();
    
    return jsonDb[functionName] || '';
}

const getJsonDb = async () => {
    if (!TELEGRAM_BOT_DB_FILE_NAME) {
        throw new Error('"TELEGRAM_BOT_DB_FILE_NAME" env is missing.');
    }
    
    const jsonTextDb = await getTextFromAzureFile(TELEGRAM_BOT_DB_FILE_NAME);
    return jsonTextDb ? JSON.parse(jsonTextDb) : {};
}