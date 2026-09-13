import React, { useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';
import {
  AIWritingTopicOption,
  AIWritingGeneratedQuestion,
  EvaluationResult,
  LearningTopicSummary,
} from '../../types';
import { PracticeResultPanel } from '../components/PracticeResultPanel';
import { Send, RotateCcw, ArrowRight, Settings2, Sparkles } from 'lucide-react';

const CEFR_LEVELS: { value: string; label: string }[] = [
  { value: 'A1', label: 'A1 - Sơ cấp' },
  { value: 'A2', label: 'A2 - Tiền trung cấp' },
  { value: 'B1', label: 'B1 - Trung cấp' },
  { value: 'B2', label: 'B2 - Trung cao cấp' },
  { value: 'C1', label: 'C1 - Cao cấp' },
  { value: 'C2', label: 'C2 - Thành thạo' },
];

interface AIWritingSelection {
  tenseSlug: string;
  customTopic: string;
  level: string;
}

export const PracticePage: React.FC = () => {
  // Config form state
  const [topicInput, setTopicInput] = useState('');
  const [level, setLevel] = useState('A1');
  const [tenseSlug, setTenseSlug] = useState('');

  // Generated question + evaluation state
  const [question, setQuestion] = useState<AIWritingGeneratedQuestion | null>(null);
  const [activeSelection, setActiveSelection] = useState<AIWritingSelection | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const generatingRef = useRef(false);

  const { data: topicSuggestions } = useQuery<AIWritingTopicOption[]>({
    queryKey: ['learning', 'ai-writing-topics'],
    queryFn: async () => (await api.get('/learning/ai-writing/topics')).data.data,
    staleTime: Infinity,
  });

  const { data: allTopics } = useQuery<LearningTopicSummary[]>({
    queryKey: ['learning', 'topics'],
    queryFn: async () => (await api.get('/learning/topics')).data.data,
    staleTime: Infinity,
  });
  const tenses = (allTopics || []).filter((t) => t.category === 'grammar');

  const generateMutation = useMutation({
    mutationFn: async (selection: AIWritingSelection) => {
      const res = await api.post('/learning/ai-writing/generate', {
        tenseSlug: selection.tenseSlug,
        customTopic: selection.customTopic,
        level: selection.level,
      });
      return res.data.data as AIWritingGeneratedQuestion;
    },
    onSuccess: (data, selection) => {
      setQuestion(data);
      setActiveSelection(selection);
      setAnswer('');
      setEvaluation(null);
      setGenError(null);
    },
    onError: (err: any) => {
      setGenError(err?.response?.data?.message || 'AI không thể tạo đề bài. Vui lòng thử lại.');
    },
  });

  const generate = (selection: AIWritingSelection) => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setGenError(null);
    generateMutation.mutate(selection, {
      onSettled: () => {
        generatingRef.current = false;
      },
    });
  };

  const canGenerate = !!topicInput.trim() && !!level && !!tenseSlug;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canGenerate) return;
    generate({ tenseSlug, customTopic: topicInput.trim(), level });
  };

  const handleTryAnother = () => {
    if (!activeSelection) return;
    generate(activeSelection);
  };

  const handleChangeConfig = () => {
    setQuestion(null);
    setActiveSelection(null);
    setAnswer('');
    setEvaluation(null);
    setGenError(null);
  };

  const handleRewrite = () => {
    setEvaluation(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || isSubmitting || !question) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/writing/attempts', {
        questionId: question.questionId,
        answer: answer.trim(),
        userAnswer: answer.trim(),
      });
      if (res.data.success) {
        setEvaluation(res.data.data.evaluation || res.data.data);
      }
    } catch (err) {
      // no-op: user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const isGenerating = generateMutation.isPending;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <span>✍️ AI Luyện viết tiếng Anh</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Nhập chủ đề bạn muốn luyện, chọn cấp độ và thì ngữ pháp. AI sẽ tạo một đề bài phù hợp bằng tiếng Việt để bạn viết câu trả lời bằng tiếng Anh.
        </p>
      </div>

      {!question ? (
        <form onSubmit={handleGenerate} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">Chủ đề muốn viết</label>
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="Nhập chủ đề bạn muốn viết..."
              maxLength={100}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            />
            {topicSuggestions && topicSuggestions.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-xs font-semibold text-slate-400">Gợi ý:</span>
                {topicSuggestions.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTopicInput(opt.label)}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">Chọn cấp độ muốn viết</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none font-semibold"
            >
              {CEFR_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-800">Chọn thì muốn luyện</label>
            <select
              value={tenseSlug}
              onChange={(e) => setTenseSlug(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none font-semibold"
            >
              <option value="">-- Chọn một thì --</option>
              {tenses.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.title} — {t.titleVi}
                </option>
              ))}
            </select>
          </div>

          {genError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{genError}</div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <button
              type="submit"
              disabled={!canGenerate || isGenerating}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>AI đang tạo đề...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>AI sinh đề</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60">
                  {question.level}
                </span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {question.topic}
                </span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {question.tense} — {question.tenseVi}
                </span>
              </div>
              <button
                type="button"
                onClick={handleChangeConfig}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
              >
                <Settings2 className="h-3.5 w-3.5" />
                <span>Đổi chủ đề & cấp độ</span>
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">✨ Đề bài AI tạo</span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">{question.promptVi}</p>
            </div>
          </div>

          {!evaluation ? (
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-4">
              <label htmlFor="ai-writing-answer" className="text-sm font-semibold text-slate-800">
                Câu trả lời của bạn
              </label>
              <textarea
                id="ai-writing-answer"
                rows={3}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Viết câu trả lời tiếng Anh của bạn tại đây..."
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-sans"
                autoFocus
              />
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-400">
                  {wordCount} từ · {answer.length} ký tự
                </div>
                <button
                  type="submit"
                  disabled={!answer.trim() || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>AI đang chấm điểm...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Nộp bài & AI chấm</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <PracticeResultPanel evaluation={evaluation} />

              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleRewrite}
                  className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-amber-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Sửa lại & Nộp lại</span>
                </button>
                <button
                  type="button"
                  onClick={handleTryAnother}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  {isGenerating ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  <span>Đề khác</span>
                </button>
                <button
                  type="button"
                  onClick={handleChangeConfig}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span>Đổi chủ đề & cấp độ</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PracticePage;
