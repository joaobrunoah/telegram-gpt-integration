import { ChatItem } from "../interfaces/chat.types";
import { getTextFromAzureFile, saveTextIntoAzureFile } from "./azure-storage.service";

const LAST_MESSAGES_DB_FILE_NAME = process.env.LAST_MESSAGES_DB_FILE_NAME;

export const getLastMessagesOfFunctionNameAndChatId = async ({functionName, chatId}: {
    functionName: string, 
    chatId: number
}): Promise<ChatItem[]> => {
    const jsonDb = await getJsonDb();
    
    return jsonDb[functionName][chatId] || [];
}

export const saveLastMessagesOfFunctionNameAndChatId = async ({functionName, chatId, messages}: {
    functionName: string, 
    chatId: number, 
    messages: ChatItem[]
}) => {
    const jsonDb = await getJsonDb();
    
    if (!jsonDb[functionName]) {
        jsonDb[functionName] = {};
    }

    jsonDb[functionName][chatId] = messages;
    const newJsonTextDb = JSON.stringify(jsonDb);
    await saveTextIntoAzureFile(LAST_MESSAGES_DB_FILE_NAME, newJsonTextDb);

    return jsonDb[functionName][chatId] || [];
}

const getJsonDb = async () => {
    if (!LAST_MESSAGES_DB_FILE_NAME) {
        throw new Error('"LAST_MESSAGES_DB_FILE_NAME" env is missing.');
    }
    
    const jsonTextDb = await getTextFromAzureFile(LAST_MESSAGES_DB_FILE_NAME);
    return jsonTextDb ? JSON.parse(jsonTextDb) : {};
}