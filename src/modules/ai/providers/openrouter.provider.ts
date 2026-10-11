import { config } from "../../../config/env";
import { OpenAICompatibleProvider } from "./openai-compatible.provider";

// OpenRouter's OpenAI-compatible endpoint. Model comes strictly from
// OPENROUTER_MODEL — never assumed/hard-coded to a different (possibly paid)
// model.
export class OpenRouterProvider extends OpenAICompatibleProvider {
    constructor() {
        super({
            name: "openrouter",
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: config.openrouterApiKey,
            model: config.openrouterModel,
        });
    }
}
