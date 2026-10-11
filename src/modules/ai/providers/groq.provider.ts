import { config } from "../../../config/env";
import { OpenAICompatibleProvider } from "./openai-compatible.provider";

// Groq's OpenAI-compatible endpoint. Model comes strictly from GROQ_MODEL —
// never assumed/hard-coded to a different (possibly paid) model.
export class GroqProvider extends OpenAICompatibleProvider {
    constructor() {
        super({
            name: "groq",
            baseURL: "https://api.groq.com/openai/v1",
            apiKey: config.groqApiKey,
            model: config.groqModel,
            // reasoning_effort is only understood by the gpt-oss reasoning
            // models — sending it to another Groq model could be rejected with
            // a 400, so it is only added for those.
            extraBody: /gpt-oss/i.test(config.groqModel) ? { reasoning_effort: config.groqReasoningEffort } : {},
        });
    }
}
