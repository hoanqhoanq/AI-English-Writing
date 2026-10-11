// Pure helper functions for Grammar Quiz: text normalization, near-duplicate
// detection (simple token-overlap heuristic — no NLP/embedding dependency),
// and even distribution of a question count across selected tenses.

export const normalizeQuestionText = (text: string): string => {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

export const tokenize = (text: string): Set<string> => {
    const normalized = normalizeQuestionText(text);
    return new Set(normalized.length > 0 ? normalized.split(" ") : []);
};

export const jaccardSimilarity = (a: Set<string>, b: Set<string>): number => {
    if (a.size === 0 && b.size === 0) return 1;
    let intersectionSize = 0;
    for (const token of a) {
        if (b.has(token)) intersectionSize++;
    }
    const unionSize = a.size + b.size - intersectionSize;
    return unionSize === 0 ? 0 : intersectionSize / unionSize;
};

// Two sentences of length n differing only in 1 token (e.g. subject-swap)
// have Jaccard similarity (n-1)/(n+1) — for a typical 6-10 word MCQ stem
// that's ~0.71-0.82, so 0.65 reliably catches subject/single-word-swap
// variants while staying well clear of genuinely different sentences (which
// in practice land well under 0.5, see quiz.service.ts's near-dup tests).
export const DEFAULT_SIMILARITY_THRESHOLD = 0.65;

// True if `candidate` is an exact or near-duplicate (by token-overlap) of any
// question already accepted for this quiz — catches subject-swap-only
// variants like "She goes to school every day." vs "He goes to school every
// day." vs "Tom goes to school every day." (differ in 1 of 7 tokens, Jaccard
// ~0.86) while leaving genuinely different sentences untouched.
export const isNearDuplicate = (
    candidate: Set<string>,
    acceptedSets: Set<string>[],
    threshold: number = DEFAULT_SIMILARITY_THRESHOLD
): boolean => {
    for (const accepted of acceptedSets) {
        if (jaccardSimilarity(candidate, accepted) >= threshold) return true;
    }
    return false;
};

export interface TenseDistributionEntry {
    tense: string;
    count: number;
}

// Fisher-Yates shuffle — used to randomize which tenses receive the "+1"
// remainder, which tenses are selected when questionCount < tenseCount, and
// (by quiz.service.ts) to interleave the final question order across tenses.
export const shuffle = <T>(items: T[]): T[] => {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

export const buildDistributionPlan = (tenses: string[], questionCount: number): TenseDistributionEntry[] => {
    if (tenses.length === 0) return [];

    if (questionCount < tenses.length) {
        // Not enough questions to cover every tense — randomly pick a subset,
        // each gets exactly 1 question.
        const selected = shuffle(tenses).slice(0, questionCount);
        return selected.map((tense) => ({ tense, count: 1 }));
    }

    const base = Math.floor(questionCount / tenses.length);
    const remainder = questionCount % tenses.length;
    const bonusTenses = new Set(shuffle(tenses).slice(0, remainder));

    return tenses.map((tense) => ({
        tense,
        count: base + (bonusTenses.has(tense) ? 1 : 0),
    }));
};
