// Prompts for the AI Quiz Solver. The fixed rules come first and the quiz
// content last, so the shared prefix is identical across batches (cheaper
// with providers that cache prompt prefixes). Explanations are kept short on
// purpose — output tokens dominate the cost and latency of a solve.

const COMMON_RULES = `- Solve using only the given content. Use a shared [CONTEXT] block only for the questions that reference it.
- Multiple choice: "answer" is ONLY the option letter (e.g. "B").
- Fill-in-the-blank / rewrite / open questions: "answer" is the answer itself, in the quiz's language.
- If more than one answer is acceptable, put the best one in "answer" and the others in "alternatives".
- If a question depends on something missing or unreadable (image, picture, audio, chart, table, missing options, garbled text), set "answer": null, "needsReview": true and say in "explanation" what is missing. NEVER invent content or guess a letter in that case.
- "confidence": "high" = certain, "medium" = probably right, "low" = unsure. Set "needsReview": true when confidence is "low" or answer is null.
- "explanation": Vietnamese, 1-2 short sentences giving the rule/reason. No lectures, no restating the question.`;

export const buildQuizSolveBatchPrompt = (params: { contextBlocks: string[]; questionBlocks: string[]; numbers: number[] }): string => `You are an expert English teacher solving a quiz for a Vietnamese learner.

RULES:
- Answer EVERY question listed, exactly once, using the given question numbers (Q<number>). Do not skip uncertain questions.
${COMMON_RULES}

Return ONLY this JSON (no markdown):
{"answers":[{"number":1,"answer":"B","alternatives":[],"explanation":"...","confidence":"high","needsReview":false}]}

Question numbers to answer: ${params.numbers.join(", ")}

${params.contextBlocks.length ? `${params.contextBlocks.join("\n\n")}\n\n` : ""}QUESTIONS:
${params.questionBlocks.join("\n\n")}`;

// Used only when the code parser found no question boundaries: the model
// must first identify the questions, then solve them.
export const buildQuizDetectAndSolvePrompt = (text: string): string => `You are an expert English teacher. The text below was extracted from a quiz file, but its question numbering could not be detected automatically.

TASK:
- Identify every question in order (number them 1, 2, 3...). Copy each question's text and its options exactly as written; do not add questions that are not in the text.
- Then solve each question.
${COMMON_RULES}

Return ONLY this JSON (no markdown):
{"questions":[{"number":1,"question":"She _____ to school every day.","options":[{"label":"A","text":"go"},{"label":"B","text":"goes"}],"answer":"B","alternatives":[],"explanation":"...","confidence":"high","needsReview":false}]}
Use "options": [] for questions without options.

QUIZ TEXT:
${text}`;
