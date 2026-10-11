import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  AIWritingTopicOption,
  AIWritingGeneratedQuestion,
  EvaluationResult,
  LearningTopicSummary,
} from '../../types';
import { PracticeResultPanel } from '../components/PracticeResultPanel';
import { Send, RotateCcw, ArrowRight, Settings2, Sparkles } from 'lucide-react';

// Danh sách cấp độ CEFR để người dùng chọn
const CEFR_LEVELS: { value: string; label: string }[] = [
  { value: 'A1', label: 'A1 - Sơ cấp' },
  { value: 'A2', label: 'A2 - Tiền trung cấp' },
  { value: 'B1', label: 'B1 - Trung cấp' },
  { value: 'B2', label: 'B2 - Trung cao cấp' },
  { value: 'C1', label: 'C1 - Cao cấp' },
  { value: 'C2', label: 'C2 - Thành thạo' },
];

// Lựa chọn của người dùng gửi cho AI: thì ngữ pháp, chủ đề tự nhập và cấp độ
interface AIWritingSelection {
  tenseSlug: string;
  customTopic: string;
  level: string;
}

export const PracticePage: React.FC = () => {
  const queryClient = useQueryClient();
  // refreshUser: làm mới thông tin người dùng (streak, số bài) sau khi nộp bài
  const { refreshUser } = useAuth();

  // Trạng thái biểu mẫu cấu hình: chủ đề tự nhập, cấp độ, thì ngữ pháp
  const [topicInput, setTopicInput] = useState('');
  const [level, setLevel] = useState('A1');
  const [tenseSlug, setTenseSlug] = useState('');

  // Trạng thái đề AI vừa tạo và bài làm: đề, lựa chọn đang dùng, câu trả lời, cờ đang nộp, kết quả chấm, lỗi và cờ chống bấm lặp
  const [question, setQuestion] = useState<AIWritingGeneratedQuestion | null>(null);
  const [activeSelection, setActiveSelection] = useState<AIWritingSelection | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const generatingRef = useRef(false);

  // Lấy các chủ đề gợi ý (GET /learning/ai-writing/topics), giữ trong bộ nhớ đệm
  const { data: topicSuggestions } = useQuery<AIWritingTopicOption[]>({
    queryKey: ['learning', 'ai-writing-topics'],
    queryFn: async () => (await api.get('/learning/ai-writing/topics')).data.data,
    staleTime: Infinity,
  });

  // Lấy danh sách chủ đề học (GET /learning/topics) để lọc ra 12 thì cho ô chọn thì
  const { data: allTopics } = useQuery<LearningTopicSummary[]>({
    queryKey: ['learning', 'topics'],
    queryFn: async () => (await api.get('/learning/topics')).data.data,
    staleTime: Infinity,
  });
  // Chỉ giữ các chủ đề thuộc nhóm ngữ pháp (12 thì)
  const tenses = (allTopics || []).filter((t) => t.category === 'grammar');

  // Gọi AI sinh đề (POST /learning/ai-writing/generate); thành công thì lưu đề mới và xóa bài làm cũ
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

  // Hàm sinh đề dùng chung, chặn bấm lặp trong lúc đang gọi AI
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

  // Chỉ cho sinh đề khi đã nhập chủ đề, chọn cấp độ và thì
  const canGenerate = !!topicInput.trim() && !!level && !!tenseSlug;

  // Bấm AI sinh đề trong biểu mẫu cấu hình
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canGenerate) return;
    generate({ tenseSlug, customTopic: topicInput.trim(), level });
  };

  // Đề khác: sinh lại một đề với cùng chủ đề, cấp độ và thì
  const handleTryAnother = () => {
    if (!activeSelection) return;
    generate(activeSelection);
  };

  // Đổi chủ đề và cấp độ: xóa đề và kết quả để quay về biểu mẫu cấu hình
  const handleChangeConfig = () => {
    setQuestion(null);
    setActiveSelection(null);
    setAnswer('');
    setEvaluation(null);
    setGenError(null);
  };

  // Sửa lại và nộp lại: giữ nguyên đề, chỉ xóa kết quả để nhập lại câu trả lời
  const handleRewrite = () => {
    setEvaluation(null);
  };

  // Nộp bài (POST /writing/attempts): server lấy đáp án chuẩn, AI chấm; thành công thì hiện kết quả, làm mới thống kê và streak
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
        queryClient.invalidateQueries({ queryKey: ['analytics', 'overview'] });
        refreshUser();
      }
    } catch (err) {
      // Lỗi thì bỏ qua, người dùng có thể bấm nộp lại
    } finally {
      setIsSubmitting(false);
    }
  };

  // Đếm số từ của câu đang gõ
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const isGenerating = generateMutation.isPending;

  // Giao diện trang: chưa có đề thì hiện biểu mẫu cấu hình; có đề thì hiện đề bài, ô trả lời hoặc kết quả chấm
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Tiêu đề trang */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <span>✍️ AI Luyện viết tiếng Anh</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Nhập chủ đề bạn muốn luyện, chọn cấp độ và thì ngữ pháp. AI sẽ tạo một đề bài phù hợp bằng tiếng Việt để bạn viết câu trả lời bằng tiếng Anh.
        </p>
      </div>

      {/* Chưa có đề thì hiện biểu mẫu cấu hình; đã có đề thì hiện đề bài và phần làm bài */}
      {!question ? (
        <form onSubmit={handleGenerate} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          {/* Ô nhập chủ đề muốn viết */}
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
            {/* Các nút chủ đề gợi ý, bấm để điền nhanh vào ô chủ đề */}
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

          {/* Chọn cấp độ CEFR */}
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

          {/* Chọn thì ngữ pháp muốn luyện (12 thì) */}
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

          {/* Thông báo lỗi khi AI không tạo được đề */}
          {genError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{genError}</div>
          )}

          {/* Nút AI sinh đề (khóa khi chưa nhập đủ thông tin hoặc đang tạo) */}
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
        // Đã có đề: thẻ đề bài và phần làm bài
        <div className="space-y-6">
          {/* Thẻ đề bài: cấp độ, chủ đề, thì, nút đổi chủ đề và đề tiếng Việt */}
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

            {/* Nội dung đề bài tiếng Việt do AI tạo */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">✨ Đề bài AI tạo</span>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">{question.promptVi}</p>
            </div>
          </div>

          {/* Chưa nộp thì hiện ô nhập câu trả lời; đã nộp thì hiện kết quả chấm và các nút tiếp theo */}
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
              {/* Bộ đếm từ/ký tự và nút Nộp bài */}
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
              {/* Bảng kết quả dùng chung: điểm, 5 chỉ tiêu, lỗi, gợi ý và so sánh với lần nộp trước */}
              <PracticeResultPanel evaluation={evaluation} />

              {/* Ba nút sau khi có kết quả: Sửa lại & Nộp lại, Đề khác, Đổi chủ đề & cấp độ */}
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
