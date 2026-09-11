import { ParagraphLevelTier } from "./paragraph-topic.model";

export type ParagraphDifficulty = "easy" | "medium" | "hard";

export interface IParagraphDifficultyDef {
    levelTier: ParagraphLevelTier;
    minWords: number;
    maxWords: number;
    label: string;
    labelVi: string;
}

// Word-count bands are fixed by product spec — the AI still writes the actual
// instruction text, this only bounds length/complexity expectations per difficulty.
export const PARAGRAPH_DIFFICULTY_MAP: Record<ParagraphDifficulty, IParagraphDifficultyDef> = {
    easy: { levelTier: "Beginner", minWords: 50, maxWords: 70, label: "Easy", labelVi: "Dễ" },
    medium: { levelTier: "Intermediate", minWords: 80, maxWords: 120, label: "Medium", labelVi: "Trung bình" },
    hard: { levelTier: "Advanced", minWords: 120, maxWords: 180, label: "Hard", labelVi: "Khó" },
};

const TIER_TO_DIFFICULTY: Record<ParagraphLevelTier, ParagraphDifficulty> = {
    Beginner: "easy",
    Intermediate: "medium",
    Advanced: "hard",
};

export const difficultyFromLevelTier = (tier: ParagraphLevelTier): ParagraphDifficulty => TIER_TO_DIFFICULTY[tier];
