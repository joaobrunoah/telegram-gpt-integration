import { getTextFromAzureFile } from "./azure-storage.service";

const USERLIST_DB_FILE_NAME = process.env.USERLIST_DB_FILE_NAME;

export const getUserlistFromFunctionName = async (functionName: string): Promise<string[]> => {
    const jsonDb = await getJsonDb();
    
    return jsonDb[functionName] || [];
}

const getJsonDb = async () => {
    if (!USERLIST_DB_FILE_NAME) {
        throw new Error('"USERLIST_DB_FILE_NAME" env is missing.');
    }
    
    const jsonTextDb = await getTextFromAzureFile(USERLIST_DB_FILE_NAME);
    return jsonTextDb ? JSON.parse(jsonTextDb) : {};
}