import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';

const AZURE_STORAGE_TG_CONNECTION_STRING = process.env.AZURE_STORAGE_TG_CONNECTION_STRING;
const AZURE_STORAGE_TG_CONTAINER_NAME = process.env.AZURE_STORAGE_TG_CONTAINER_NAME;

export const getTextFromAzureFile = async (fileName: string):Promise<string> => {
    const blockBlobClient = getBlockBlobClient(fileName);

    try {
        const blobResponse = await blockBlobClient.download(0);
        const text = await streamToString(blobResponse.readableStreamBody);

        return text;
    } catch (error) {
        if(error.code === 'BlobNotFound') {
            return '';
        }
        console.error(error);
        throw error;
    }
}

export const saveTextIntoAzureFile = async (fileName: string, content: string) => {
    const blockBlobClient = getBlockBlobClient(fileName);

    try {
        await blockBlobClient.upload(content, content.length);
        return;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

const getBlockBlobClient = (fileName: string): BlockBlobClient => {
    if (!AZURE_STORAGE_TG_CONNECTION_STRING) {
        throw new Error('"AZURE_STORAGE_TG_CONNECTION_STRING" env variable is missing');
    }

    if (!AZURE_STORAGE_TG_CONTAINER_NAME) {
        throw new Error('"AZURE_STORAGE_TG_CONTAINER_NAME" env variable is missing');
    }
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_TG_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_TG_CONTAINER_NAME);
    return containerClient.getBlockBlobClient(fileName);
}

// Helper function to convert a readable stream to a string
const streamToString = async (readableStream: NodeJS.ReadableStream): Promise<string> => {
    const chunks: string[] = [];
    for await (const chunk of readableStream) {
      chunks.push(chunk.toString());
    }
    return chunks.join("");
  }