import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

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

export const getChatgptCompletion = async ({message, systemMessage} : {
    message: string, systemMessage: string
}) => {
    const messages = [
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
            temperature: 0.1,
            topP: 0.95,
            maxTokens: 500, 
        }
    );

    let answer = '';
    for await (const event of events) {
        for (const choice of event.choices) {
            const delta = choice.delta;
            if (delta?.content !== undefined && delta?.content.indexOf('[') < 0) {
                answer += delta?.content;
            }
        }
    }

    return answer;
}