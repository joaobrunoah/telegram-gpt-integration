import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import { getLastMessagesOfFunctionNameAndChatId, saveLastMessagesOfFunctionNameAndChatId } from "./last-messages-db.service";
import { ChatItem } from "../interfaces/chat.types";
import { isContext } from "vm";
import { InvocationContext } from "@azure/functions";

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT;
const AZURE_OPENAI_KEY = process.env.AZURE_OPENAI_KEY;
const AZURE_OPENAI_DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
const client = new OpenAIClient(
    AZURE_OPENAI_ENDPOINT,
    new AzureKeyCredential(AZURE_OPENAI_KEY)
);

const AZURE_SEARCH_ENDPOINT = process.env.AZURE_SEARCH_ENDPOINT;
const AZURE_SEARCH_KEY = process.env.AZURE_SEARCH_KEY;
const AZURE_SEARCH_INDEX = process.env.AZURE_SEARCH_INDEX;

const MAX_INTERACTIONS = 3;

export const getChatgptCompletion = async ({chatId, message, systemMessage, context} : {
    chatId: number, message: string, systemMessage: string, context?: InvocationContext
}) => {
    const lastMessages = await getLastMessagesOfFunctionNameAndChatId({functionName: 'leilaoComVictorTelegram', chatId});
    const selectedMessages = [];
    let userMessages = 0;
    for (let i = lastMessages.length - 1; i >= 0; i--) {
        const currentMessage = lastMessages[i];
        selectedMessages.push(currentMessage);
        if (currentMessage.role == 'user') {
            userMessages++;
            if (userMessages >= MAX_INTERACTIONS) {
                break;
            }
        }
    }

    const messages: ChatItem[] = [
        ...selectedMessages.reverse(),
        { role: "user", content: message },
    ]

    const events = await client.listChatCompletions(
        AZURE_OPENAI_DEPLOYMENT_NAME, // assumes a matching model deployment or model name,
        messages,
        { 
            azureExtensionOptions: {
                extensions: [{
                    type: 'AzureCognitiveSearch',
                    parameters: {
                        "endpoint": AZURE_SEARCH_ENDPOINT,
                        "key": AZURE_SEARCH_KEY,
                        "indexName": AZURE_SEARCH_INDEX,
                        "roleInformation": systemMessage,
                        strictness: 3,
                        topNDocuments: 5,
                        queryType: "simple"
                    }
                }]
            },
            temperature: 0,
            topP: 1,
            maxTokens: 500, 
        }
    );

    let answer = '';
    for await (const event of events) {
        for (const choice of event.choices) {
            const delta = choice.delta;
            if (delta?.content !== undefined) {
                answer += delta?.content;
            }
        }
    }

    messages.push({role: 'assistant', content: answer});

    context?.info(messages);

    await saveLastMessagesOfFunctionNameAndChatId({
        functionName: 'leilaoComVictorTelegram',
        chatId,
        messages
    })

    return answer;
}