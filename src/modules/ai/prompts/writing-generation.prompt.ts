import { CefrLevel, DifficultyLevel } from "../../../types";

export const buildWritingGenerationPrompt = (params: {
    level: CefrLevel;
    topic: string;
    grammarTopic?: string;
    difficulty?: DifficultyLevel;
    count?: number;
}): string => {
    const count = params.count || 5;
    return `You are a professional ESL curriculum designer. Generate exactly ${count} English writing practice questions suitable for Vietnamese learners.
Target Level: ${params.level}
Topic: ${params.topic}
Grammar Focus: ${params.grammarTopic || "General grammar corresponding to level"}
Difficulty: ${params.difficulty || "medium"}

Requirements:
1. "vietnameseSentence": A natural Vietnamese sentence appropriate for translation into English at CEFR level ${params.level}.
2. "referenceAnswer": The most natural standard English translation.
3. "alternativeAnswers": Array of 2-3 other valid, natural English translations (different word order, synonyms).
4. "level": "${params.level}"
5. "topic": "${params.topic}"
6. "grammarTopic": "${params.grammarTopic || "Grammar"}"
7. "difficulty": "${params.difficulty || "medium"}"
8. "keywords": 2-4 key English vocabulary words or grammar structures expected in the answer.

Output format: Return ONLY a raw JSON array of objects. Do NOT use markdown code blocks (\`\`\`json).
Schema for each object:
{
  "vietnameseSentence": string,
  "referenceAnswer": string,
  "alternativeAnswers": string[],
  "level": string,
  "topic": string,
  "grammarTopic": string,
  "difficulty": string,
  "keywords": string[]
}`;
};
