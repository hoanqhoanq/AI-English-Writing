import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { WritingQuestion, EvaluationResult, Topic, GrammarTopic } from '../types';
import { PronounceButton } from '../components/PronounceButton';
import { ScoreBadge } from '../components/ScoreBadge';
import { ErrorViewer } from '../components/ErrorViewer';
import {
  Send,
  RotateCcw,
  ArrowRight,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Filter,
  Layers,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export const PracticePage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Filters and questions state
  const [topics, setTopics] = useState<Topic[]>([]);
  const [grammars, setGrammars] = useState<GrammarTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>(user?.level || 'all');
  const [selectedGrammar, setSelectedGrammar] = useState<string>('all');

  const [questions, setQuestions] = useState<WritingQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);

  // Practice state
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Check if questions were passed in location state (e.g. from AI Generator)
  useEffect(() => {
    if (location.state?.customQuestions && location.state.customQuestions.length > 0) {
      setQuestions(location.state.customQuestions);
      setCurrentIndex(0);
      setLoadingQuestions(false);
    } else {
      fetchFiltersAndQuestions();
    }
  }, [location.state]);

  const fetchFiltersAndQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const [topicsRes, grammarRes] = await Promise.all([
        api.get('/topics'),
        api.get('/grammar'),
      ]);

      if (topicsRes.data.success) setTopics(topicsRes.data.data);
      if (grammarRes.data.success) setGrammars(grammarRes.data.data);

      await loadQuestions();
    } catch (err) {
      console.error('Error loading filters:', err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const loadQuestions = async () => {
    try {
      const params: Record<string, string> = { limit: '20' };
      if (selectedTopic !== 'all') params.topic = selectedTopic;
      if (selectedLevel !== 'all') params.level = selectedLevel;
      if (selectedGrammar !== 'all') params.grammarTopic = selectedGrammar;

      const res = await api.get('/writing/questions', { params });
      if (res.data.success && res.data.data?.questions) {
        setQuestions(res.data.data.questions);
        setCurrentIndex(0);
        setEvaluation(null);
        setUserAnswer('');
        setShowHint(false);
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  };

  const handleFilterChange = () => {
    loadQuestions();
  };

  const currentQuestion = questions[currentIndex];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userAnswer.trim() || !currentQuestion || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload = {
        questionId: currentQuestion._id || currentQuestion.id,
        answer: userAnswer.trim(),
        userAnswer: userAnswer.trim(),
      };

      const res = await api.post('/writing/attempts', payload);
      if (res.data.success) {
        setEvaluation(res.data.data.evaluation || res.data.data);
      }
    } catch (err: any) {
      console.error('Submission failed, attempting direct evaluation fallback:', err);
      try {
        const directRes = await api.post('/ai/evaluate-writing', {
          vietnameseSentence: currentQuestion.vietnameseSentence,
          referenceAnswer: currentQuestion.referenceAnswer,
          userAnswer: userAnswer.trim(),
          level: currentQuestion.level,
        });
        if (directRes.data.success) {
          setEvaluation(directRes.data.data);
        }
      } catch (innerErr) {
        alert('Không thể kết nối dịch vụ chấm bài. Vui lòng kiểm tra lại kết nối!');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer('');
      setEvaluation(null);
      setShowHint(false);
    } else {
      loadQuestions();
    }
  };

  const handleRetry = () => {
    setEvaluation(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header & Filter Toggle */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>✍️ Luyện viết câu tiếng Anh</span>
            {location.state?.fromGenerator && (
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
                <Sparkles className="h-3 w-3" /> Đề tạo bởi AI
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dịch câu tiếng Việt sang tiếng Anh. AI sẽ chấm điểm, phát hiện lỗi sai và gợi ý cách diễn đạt tự nhiên nhất.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <Filter className="h-4 w-4 text-indigo-600" />
          <span>Bộ lọc & Chủ đề</span>
          <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Chủ đề (Topic)
              </label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">Tất cả chủ đề</option>
                {topics.map((t) => (
                  <option key={t._id} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Trình độ CEFR
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">Tất cả cấp độ</option>
                <option value="A1">A1 - Sơ cấp</option>
                <option value="A2">A2 - Tiền trung cấp</option>
                <option value="B1">B1 - Trung cấp</option>
                <option value="B2">B2 - Trung cao cấp</option>
                <option value="C1">C1 - Cao cấp</option>
                <option value="C2">C2 - Thành thạo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Ngữ pháp trọng tâm
              </label>
              <select
                value={selectedGrammar}
                onChange={(e) => setSelectedGrammar(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">Tất cả ngữ pháp</option>
                {grammars.map((g) => (
                  <option key={g._id} value={g.name}>
                    {g.name} ({g.level})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/60">
            <button
              type="button"
              onClick={handleFilterChange}
              className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              Áp dụng bộ lọc
            </button>
          </div>
        </div>
      )}

      {/* Main Practice Workspace */}
      {loadingQuestions ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-20 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mb-3" />
          <p className="text-sm font-medium text-slate-600">Đang chuẩn bị đề luyện viết...</p>
        </div>
      ) : !currentQuestion ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-lg font-semibold text-slate-800">Không tìm thấy câu hỏi phù hợp</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Hãy thử chọn lại chủ đề hoặc cấp độ khác trong bộ lọc phía trên để tiếp tục luyện tập.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedTopic('all');
              setSelectedLevel('all');
              setSelectedGrammar('all');
              loadQuestions();
            }}
            className="mt-4 rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Question Card */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60">
                  {currentQuestion.level}
                </span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  {currentQuestion.topic}
                </span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  {currentQuestion.grammarTopic}
                </span>
              </div>

              <div className="text-xs font-semibold text-slate-400">
                Câu {currentIndex + 1} / {questions.length}
              </div>
            </div>

            {/* Vietnamese Prompt */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Câu tiếng Việt cần dịch:
              </span>
              <div className="flex items-start justify-between gap-4">
                <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {currentQuestion.vietnameseSentence}
                </p>
                <PronounceButton text={currentQuestion.vietnameseSentence} lang="vi-VN" size="lg" />
              </div>
            </div>

            {/* Keyword Hints toggle */}
            {currentQuestion.keywords && currentQuestion.keywords.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                {!showHint ? (
                  <button
                    type="button"
                    onClick={() => setShowHint(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
                  >
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    <span>Xem từ khóa gợi ý (Vocabulary hints)</span>
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="font-semibold text-slate-500">Từ gợi ý:</span>
                    {currentQuestion.keywords.map((kw, i) => (
                      <span key={i} className="rounded-md bg-amber-50 px-2 py-0.5 font-mono font-medium text-amber-800 border border-amber-200">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Writing Input Form */}
          {!evaluation ? (
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="user-answer" className="text-sm font-semibold text-slate-800">
                  Câu tiếng Anh của bạn:
                </label>
                <span className="text-xs text-slate-400">
                  Phím tắt: <kbd className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">Ctrl + Enter</kbd>
                </span>
              </div>

              <textarea
                id="user-answer"
                rows={3}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nhập bản dịch tiếng Anh của bạn tại đây..."
                disabled={isSubmitting}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-sans"
                autoFocus
              />

              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-400">
                  {userAnswer.trim().split(/\s+/).filter(Boolean).length} từ · {userAnswer.length} ký tự
                </div>

                <button
                  type="submit"
                  disabled={!userAnswer.trim() || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>AI đang chấm điểm & chữa lỗi...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Nộp bài & Đánh giá</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Evaluation Results Box */
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in duration-300">
              {/* Score Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Kết quả đánh giá AI</span>
                  <div className="mt-1 flex items-center gap-3">
                    <ScoreBadge score={evaluation.score || evaluation.finalScore || 0} size="xl" showLabel />
                    {evaluation.provider && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                        {evaluation.provider === 'gemini' ? '✨ Gemini AI Pro' : '⚡ Heuristic Engine'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-scores breakdown */}
                {(evaluation.accuracy !== undefined || evaluation.naturalness !== undefined) && (
                  <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Ngữ pháp</p>
                      <p className="text-sm font-bold text-indigo-600">{evaluation.accuracy ?? 85}%</p>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Từ vựng</p>
                      <p className="text-sm font-bold text-indigo-600">{evaluation.vocabulary ?? 85}%</p>
                    </div>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="text-center">
                      <p className="text-[10px] uppercase font-bold text-slate-400">Tự nhiên</p>
                      <p className="text-sm font-bold text-indigo-600">{evaluation.naturalness ?? 85}%</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submitted answer preview */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-1">
                <span className="text-xs font-semibold text-slate-500">Câu bạn đã viết:</span>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-base font-medium text-slate-900">{userAnswer}</p>
                  <PronounceButton text={userAnswer} lang="en-US" />
                </div>
              </div>

              {/* Reference and alternatives */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                    Câu mẫu chuẩn bản xứ (Reference Answer):
                  </span>
                  <PronounceButton
                    text={evaluation.referenceAnswer || currentQuestion.referenceAnswer}
                    lang="en-US"
                  />
                </div>
                <p className="text-lg font-bold text-indigo-950 font-sans">
                  {evaluation.referenceAnswer || currentQuestion.referenceAnswer}
                </p>

                {((evaluation.alternativeAnswers && evaluation.alternativeAnswers.length > 0) ||
                  (currentQuestion.alternativeAnswers && currentQuestion.alternativeAnswers.length > 0)) && (
                  <div className="pt-2 border-t border-indigo-100/80">
                    <span className="text-xs font-semibold text-indigo-700">Cách diễn đạt tương đương:</span>
                    <ul className="mt-1 space-y-1 text-sm text-slate-700">
                      {(evaluation.alternativeAnswers || currentQuestion.alternativeAnswers || []).map((alt, i) => (
                        <li key={i} className="flex items-center justify-between gap-2 pl-2 border-l-2 border-indigo-300">
                          <span>{alt}</span>
                          <PronounceButton text={alt} lang="en-US" size="sm" />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Error Details */}
              <ErrorViewer errors={evaluation.errors || []} />

              {/* Strengths & Overall Feedback */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {evaluation.strengths && evaluation.strengths.length > 0 && (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Điểm tốt (Strengths):</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {evaluation.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.recommendations && evaluation.recommendations.length > 0 && (
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
                      <Lightbulb className="h-4 w-4 text-amber-600" />
                      <span>Khuyên luyện tập (Recommendations):</span>
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {evaluation.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Thử viết lại câu này</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
                >
                  <span>{currentIndex < questions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành lượt luyện'}</span>
                  <ArrowRight className="h-4 w-4" />
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
