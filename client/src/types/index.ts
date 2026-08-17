export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  target: 'General English' | 'TOEIC' | 'IELTS' | 'Communication' | 'Academic English';
  dailyGoal: number;
  streak: number;
  totalWriting: number;
  averageScore: number;
}

export interface Topic {
  _id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
}

export interface GrammarTopic {
  _id: string;
  name: string;
  description: string;
  level: string;
  order: number;
}

export interface WritingQuestion {
  _id: string;
  id?: string;
  vietnameseSentence: string;
  referenceAnswer: string;
  alternativeAnswers?: string[];
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  topic: string;
  grammarTopic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  keywords: string[];
}

export interface WritingErrorDetail {
  type: string;
  category?: string;
  wrongText: string;
  correctText: string;
  explanation: string;
}

export interface EvaluationResult {
  score: number;
  finalScore?: number;
  status: 'correct' | 'partially_correct' | 'incorrect';
  accuracy?: number;
  vocabulary?: number;
  naturalness?: number;
  errors: WritingErrorDetail[];
  strengths: string[];
  overallFeedback: string;
  recommendations: string[];
  referenceAnswer?: string;
  alternativeAnswers?: string[];
  provider?: string;
}

export interface AttemptRecord {
  _id: string;
  userId: string;
  questionId: string;
  vietnameseSentence: string;
  referenceAnswer: string;
  userAnswer: string;
  status: 'correct' | 'partially_correct' | 'incorrect';
  aiScore: number;
  finalScore: number;
  errors: WritingErrorDetail[];
  strengths: string[];
  overallFeedback: string;
  recommendations: string[];
  level: string;
  topic: string;
  grammarTopic: string;
  createdAt: string;
}

export interface AnalyticsOverview {
  totalWriting: number;
  averageScore: number;
  currentStreak: number;
  dailyGoal: number;
  todayCompleted: number;
  statusBreakdown: {
    correct: number;
    partially_correct: number;
    incorrect: number;
  };
}

export interface ErrorCategoryStat {
  type: string;
  count: number;
  percentage: number;
  examples: Array<{
    wrongText: string;
    correctText: string;
    explanation: string;
  }>;
}

export interface TrendStat {
  date: string;
  averageScore: number;
  count: number;
}

export interface AIWeaknessAnalysis {
  _id?: string;
  overallLevel: string;
  strengths: string[];
  weaknesses: string[];
  repeatedErrors: Array<{
    pattern: string;
    frequency: number;
    suggestion: string;
  }>;
  progress: 'improving' | 'stable' | 'needs_attention';
  analysis: string;
  recommendations: string[];
  createdAt?: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  target: string;
  dailyTarget?: number;
  streak?: number;
  isActive: boolean;
  totalAttempts?: number;
  averageScore?: number;
  totalSentencesWritten?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CefrLevelDef {
  code: string;
  name: string;
  cefr: string;
  description: string;
  targetVocab: string;
  grammarFocus: string;
  recommendedDaily: number;
  questionCount: number;
  usersCount: number;
  color: string;
}

export interface SystemStats {
  users: {
    total: number;
    active: number;
    locked: number;
    admins: number;
    learners: number;
  };
  questions: {
    total: number;
    active: number;
    byLevel: Record<string, number>;
  };
  attempts: {
    total: number;
    averageScore: number;
    accuracy: number;
    correctCount: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
  };
}

export interface AdminEvaluationRecord extends AttemptRecord {
  userName?: string;
  userEmail?: string;
}

