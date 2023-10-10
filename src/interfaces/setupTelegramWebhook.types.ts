export interface ISetupTelegramWebhookBody {
    telegramBotToken: string,
    azureFunctionName: string,
    azureFunctionCode: string
}