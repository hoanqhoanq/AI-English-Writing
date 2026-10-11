import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { ScoreBadge } from '../components/ScoreBadge';
import {
  LearningTopicSummary,
  Topic,
  QuizGenerateResponse,
  QuizSubmitResult,
} from '../../types';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ListChecks,
  Check,
} from 'lucide-react';

// Các cấp độ CEFR có thể chọn
const DIFFICULTIES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
// Các lựa chọn số câu hỏi (API cho phép từ 10 đến 50 câu)
const QUESTION_COUNTS = [10, 20, 30, 40, 50];
// Giá trị đặc biệt có nghĩa là tất cả chủ đề
const ALL_LABEL = 'All';

// Ba màn hình của trang: cấu hình bài, làm bài, xem kết quả (chỉ khác nhau ở biến phase)
type Phase = 'config' | 'quiz' | 'result';

// Dữ liệu cấu hình gửi lên server khi tạo Quiz
interface QuizConfig {
  difficulty: string;
  tenses: string[];
  topic: string;
  questionCount: number;
}

export const GrammarQuizPage: React.FC = () => {
  // Đọc tham số trên đường dẫn (ví dụ /quiz?tense=present-simple) để chọn sẵn thì
  const [searchParams] = useSearchParams();
  // Trạng thái cấu hình: màn hình hiện tại, mức độ, các thì đã chọn, chủ đề, số câu
  const [phase, setPhase] = useState<Phase>('config');
  const [difficulty, setDifficulty] = useState('A1');
  const [selectedTenses, setSelectedTenses] = useState<string[]>([]);
  const prefilledFromUrlRef = useRef(false);
  const [topic, setTopic] = useState(ALL_LABEL);
  const [questionCount, setQuestionCount] = useState(10);

  // Trạng thái bài làm: bộ câu hỏi, câu hiện tại, đáp án đã chọn, kết quả, cờ xem lại đáp án và thông báo lỗi
  const [quiz, setQuiz] = useState<QuizGenerateResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizSubmitResult | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const generatingRef = useRef(false);

  // Lấy danh sách chủ đề học (GET /learning/topics) để có 12 thì làm các nút chọn thì
  const { data: allTopicsForGrammar } = useQuery<LearningTopicSummary[]>({
    queryKey: ['learning', 'topics'],
    queryFn: async () => (await api.get('/learning/topics')).data.data,
    staleTime: Infinity,
  });
  const tenses = (allTopicsForGrammar || []).filter((t) => t.category === 'grammar');
  // Bảng tra tên thì tiếng Anh sang tên tiếng Việt, dùng để hiện nhãn cho từng câu
  // Tense title (e.g. "Present Simple", as returned per-question by the API)
  // -> Vietnamese label, for the per-question badges on the quiz/review screens.
  const titleViByTitle = new Map(tenses.map((t) => [t.title, t.titleVi]));

  // Nếu vào từ trang học ngữ pháp thì chọn sẵn thì đó (chỉ chạy một lần, sau đó người dùng tự đổi được)
  // Coming from a Grammar Learning page ("Làm Quiz Present Simple") — pre-check
  // just that one tense once the tense list has loaded. Only runs once; the
  // user can freely change the selection afterwards.
  useEffect(() => {
    if (prefilledFromUrlRef.current || tenses.length === 0) return;
    const tenseFromUrl = searchParams.get('tense');
    if (tenseFromUrl && tenses.some((t) => t.slug === tenseFromUrl)) {
      setSelectedTenses([tenseFromUrl]);
    }
    prefilledFromUrlRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenses.length]);

  // Lấy danh sách chủ đề nội dung (GET /topics) cho ô chọn chủ đề
  const { data: subjectTopics } = useQuery<Topic[]>({
    queryKey: ['topics'],
    queryFn: async () => (await api.get('/topics')).data.data,
    staleTime: Infinity,
  });

  // Tạo Quiz (POST /quiz/generate): thành công thì lưu bộ câu hỏi, đặt lại trạng thái và chuyển sang màn hình làm bài
  const generateMutation = useMutation({
    mutationFn: async (config: QuizConfig) => {
      const res = await api.post('/quiz/generate', config);
      return res.data.data as QuizGenerateResponse;
    },
    onSuccess: (data) => {
      setQuiz(data);
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
      setReviewOpen(false);
      setGenError(null);
      setPhase('quiz');
    },
    onError: (err: any) => {
      setGenError(err?.response?.data?.message || 'Không thể tạo Quiz lúc này. Vui lòng thử lại.');
    },
  });

  // Nộp bài (POST /quiz/:quizId/submit): gửi các đáp án đã chọn, server chấm điểm; thành công thì chuyển sang màn hình kết quả
  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!quiz) throw new Error('Chưa có Quiz');
      const payload = {
        answers: Object.entries(answers).map(([questionId, selectedAnswer]) => ({
          questionId,
          selectedAnswer,
        })),
      };
      const res = await api.post(`/quiz/${quiz.quizId}/submit`, payload);
      return res.data.data as QuizSubmitResult;
    },
    onSuccess: (data) => {
      setResult(data);
      setSubmitError(null);
      setPhase('result');
    },
    onError: (err: any) => {
      setSubmitError(err?.response?.data?.message || 'Không thể nộp bài Quiz. Vui lòng thử lại.');
    },
  });

  // Cờ đang chờ server tạo hoặc chấm bài
  const isGenerating = generateMutation.isPending;
  const isSubmitting = submitMutation.isPending;

  // Bấm một nút thì: chọn hoặc bỏ chọn thì đó (chọn được nhiều thì)
  const handleToggleTense = (slug: string) => {
    setSelectedTenses((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  // Kiểm tra đã chọn đủ 12 thì chưa để tô sáng nút Tất cả 12 thì
  const allTenseSlugs = tenses.map((t) => t.slug);
  const isAllSelected = allTenseSlugs.length > 0 && allTenseSlugs.every((s) => selectedTenses.includes(s));

  // Bấm Tất cả 12 thì: chọn hết hoặc bỏ chọn hết
  const handleToggleAllTenses = () => {
    setSelectedTenses((prev) => (prev.length === allTenseSlugs.length ? [] : allTenseSlugs));
  };

  // Bấm Tạo Quiz: cần chọn ít nhất một thì, đồng thời chặn bấm lặp
  const handleGenerate = () => {
    if (generatingRef.current || selectedTenses.length === 0) return;
    generatingRef.current = true;
    setGenError(null);
    generateMutation.mutate(
      { difficulty, tenses: selectedTenses, topic, questionCount },
      { onSettled: () => (generatingRef.current = false) }
    );
  };

  // Ghi lại đáp án người dùng chọn cho một câu
  const handleSelectAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  // Bấm Nộp bài ở câu cuối
  const handleSubmit = () => {
    if (isSubmitting) return;
    submitMutation.mutate();
  };

  // Làm Quiz khác: xóa toàn bộ bài cũ và quay về màn hình cấu hình
  const handleRetakeConfig = () => {
    setPhase('config');
    setQuiz(null);
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
    setReviewOpen(false);
    setGenError(null);
    setSubmitError(null);
  };

  // MÀN HÌNH 2, làm bài: hiển thị từng câu một với thanh tiến độ và 4 đáp án
  if (phase === 'quiz' && quiz) {
    const question = quiz.questions[currentIndex];
    const total = quiz.questions.length;
    const progressPct = Math.round(((currentIndex + 1) / total) * 100);
    const isLast = currentIndex === total - 1;
    const selected = answers[question.questionId];

    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Tiêu đề trang Quiz và thông tin bài đang làm (mức độ, thì, chủ đề) */}
        <div className="border-b border-slate-200/80 pb-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-indigo-600" />
            <span>Grammar Quiz</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {quiz.difficulty} • {quiz.grammar} • {quiz.topic}
          </p>
        </div>

        {/* Thẻ câu hỏi hiện tại */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          {/* Thanh tiến độ: Câu N / tổng và phần trăm */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>
                Câu {currentIndex + 1} / {total}
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Nhãn thì và nội dung câu hỏi */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60">
              {question.grammar}
              {titleViByTitle.get(question.grammar) ? ` — ${titleViByTitle.get(question.grammar)}` : ''}
            </span>
            <p className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">{question.question}</p>
          </div>

          {/* Bốn đáp án A đến D, bấm để chọn (đáp án đang chọn được tô màu) */}
          <div className="space-y-2">
            {question.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectAnswer(question.questionId, idx)}
                className={`w-full text-left rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                  selected === idx
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50/50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold ${
                      selected === idx
                        ? 'border-indigo-500 bg-indigo-600 text-white'
                        : 'border-slate-300 text-slate-500'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </span>
              </button>
            ))}
          </div>

          {/* Thông báo lỗi khi nộp bài không thành công */}
          {submitError && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {submitError}
            </div>
          )}

          {/* Hàng nút điều hướng: Câu trước và Câu tiếp theo (ở câu cuối thì thành Nộp bài) */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Câu trước
            </button>

            {/* Ở câu cuối hiện nút Nộp bài; các câu khác hiện nút Câu tiếp theo */}
            {isLast ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Đang nộp bài...</span>
                  </>
                ) : (
                  <span>Nộp bài</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))}
                className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
              >
                Câu tiếp theo
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MÀN HÌNH 3, kết quả: điểm, số câu đúng, xem lại đáp án và giải thích từng câu
  if (phase === 'result' && result) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Tiêu đề màn hình kết quả */}
        <div className="border-b border-slate-200/80 pb-4">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ListChecks className="h-6 w-6 text-indigo-600" />
            <span>Quiz hoàn thành</span>
          </h1>
        </div>

        {/* Thẻ điểm tổng và hai nút: Xem lại đáp án, Làm Quiz khác */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 text-center">
          <ScoreBadge score={result.score} size="xl" showLabel />
          <p className="text-sm text-slate-600">
            {result.correctCount} / {result.totalQuestions} câu đúng
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setReviewOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {reviewOpen ? 'Ẩn đáp án' : 'Xem lại đáp án'}
            </button>
            <button
              type="button"
              onClick={handleRetakeConfig}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Làm Quiz khác
            </button>
          </div>
        </div>

        {/* Danh sách xem lại: từng câu đúng (xanh) hoặc sai (đỏ), câu người dùng chọn, đáp án đúng và giải thích */}
        {reviewOpen && (
          <div className="space-y-3">
            {result.questions.map((q, idx) => (
              <div
                key={q.questionId}
                className={`rounded-2xl border p-4 sm:p-5 ${
                  q.isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'
                }`}
              >
                <div className="flex items-start gap-2">
                  {q.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
                  )}
                  <div className="space-y-1.5 flex-1">
                    <span className="inline-block rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      {q.tense}
                      {titleViByTitle.get(q.tense) ? ` — ${titleViByTitle.get(q.tense)}` : ''}
                    </span>
                    <p className="text-sm font-bold text-slate-900">
                      Câu {idx + 1}: {q.question}
                    </p>
                    <p className="text-xs text-slate-600">
                      Bạn chọn:{' '}
                      <span className="font-semibold">
                        {q.selectedAnswer !== null ? q.options[q.selectedAnswer] : '(chưa trả lời)'}
                      </span>
                    </p>
                    {/* Chỉ hiện đáp án đúng khi người dùng làm sai câu đó */}
                    {!q.isCorrect && (
                      <p className="text-xs text-slate-600">
                        Đáp án đúng: <span className="font-semibold">{q.options[q.correctAnswer]}</span>
                      </p>
                    )}
                    <p className="text-xs text-slate-500 pt-1">{q.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // MÀN HÌNH 1, cấu hình: chọn mức độ, thì, chủ đề, số câu rồi bấm Tạo Quiz
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Tiêu đề và mô tả màn hình cấu hình */}
      <div className="border-b border-slate-200/80 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-indigo-600" />
          <span>Grammar Quiz</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Chọn mức độ, thì ngữ pháp, chủ đề và số câu. AI sẽ tạo một bộ đề trắc nghiệm để bạn luyện tập.
        </p>
      </div>

      {/* Khung cấu hình bài Quiz */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        {/* Chọn mức độ CEFR */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-800">Mức độ</label>
          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`rounded-xl px-4 py-2 text-sm font-bold border transition-all ${
                  difficulty === d
                    ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* Chọn thì ngữ pháp (nhiều thì, hoặc Tất cả 12 thì) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-slate-800">Ngữ pháp</label>
            <span className="text-xs text-slate-400">Có thể chọn nhiều thì cùng lúc</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleToggleAllTenses}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border transition-all ${
                isAllSelected
                  ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isAllSelected && <Check className="h-3.5 w-3.5" />}
              Tất cả 12 thì
            </button>
            {/* Các nút chọn từng thì; thì đang chọn được tô màu và có dấu tích */}
            {tenses.map((t) => {
              const active = selectedTenses.includes(t.slug);
              return (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => handleToggleTense(t.slug)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border transition-all ${
                    active
                      ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                  }`}
                  title={t.titleVi}
                >
                  {active && <Check className="h-3.5 w-3.5" />}
                  {t.title}
                </button>
              );
            })}
          </div>
          {/* Nhắc phải chọn ít nhất một thì */}
          {selectedTenses.length === 0 && (
            <p className="text-xs font-medium text-rose-600 pt-1">Vui lòng chọn ít nhất một thì.</p>
          )}
        </div>

        {/* Chọn chủ đề */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-800">Chủ đề</label>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none font-semibold"
          >
            <option value={ALL_LABEL}>Tất cả chủ đề</option>
            {(subjectTopics || []).map((t) => (
              <option key={t._id} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Chọn số câu */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-800">Số câu</label>
          <div className="flex flex-wrap gap-2">
            {QUESTION_COUNTS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setQuestionCount(c)}
                className={`rounded-xl px-4 py-2 text-sm font-bold border transition-all ${
                  questionCount === c
                    ? 'border-indigo-500 bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Thông báo lỗi khi không tạo được Quiz */}
        {genError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{genError}</div>
        )}

        {/* Nút Tạo Quiz (khóa khi chưa chọn thì hoặc đang tạo) */}
        <div className="pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || selectedTenses.length === 0}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Đang tạo Quiz...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Tạo Quiz</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrammarQuizPage;
