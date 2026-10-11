import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import {
  LearningTopicDetail,
  EvaluationResult,
  LearningSection,
  AIWritingTopicOption,
  AIWritingGeneratedQuestion,
} from '../../types';
import { MarkdownLite } from '../components/MarkdownLite';
import { PronounceButton } from '../components/PronounceButton';
import { PracticeResultPanel } from '../components/PracticeResultPanel';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Lightbulb,
  AlertTriangle,
  PenTool,
  Sparkles,
  BarChart3,
  Send,
  RotateCcw,
  ExternalLink,
  ListChecks,
} from 'lucide-react';

// Khóa của năm tab trong một chủ đề học
type TabKey = 'learn' | 'examples' | 'practice' | 'aiWriting' | 'progress';

// Các tab hiển thị: Learn (lý thuyết), Examples (ví dụ), Practice (bài luyện), AI Writing, Progress (tiến độ)
const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'learn', label: 'Learn', icon: BookOpen },
  { key: 'examples', label: 'Examples', icon: Lightbulb },
  { key: 'practice', label: 'Practice', icon: PenTool },
  { key: 'aiWriting', label: 'AI Writing', icon: Sparkles },
  { key: 'progress', label: 'Progress', icon: BarChart3 },
];

// Trang chi tiết một chủ đề Writing Learning (đường dẫn /learning/:category/:slug): phần đầu và 5 tab
export const LearningTopicPage: React.FC = () => {
  // Lấy slug của chủ đề từ đường dẫn
  const { slug } = useParams<{ category: string; slug: string }>();
  const queryClient = useQueryClient();
  // Tab đang mở (mặc định là Learn) và tập các phần đã đánh dấu xem để không gửi trùng
  const [tab, setTab] = useState<TabKey>('learn');
  const viewedRef = useRef<Set<string>>(new Set());

  // Tải chi tiết chủ đề (GET /learning/topics/:slug): lý thuyết, ví dụ, lỗi thường gặp, bài luyện và tiến độ
  const { data: topic, isLoading, isError } = useQuery<LearningTopicDetail>({
    queryKey: ['learning', 'topic', slug],
    queryFn: async () => (await api.get(`/learning/topics/${slug}`)).data.data,
    enabled: !!slug,
  });

  // Đánh dấu đã xem một phần (POST .../progress/section-viewed) để tính % hoàn thành; mỗi phần chỉ gửi một lần
  const markViewed = (section: LearningSection) => {
    if (viewedRef.current.has(section)) return;
    viewedRef.current.add(section);
    api.post(`/learning/topics/${slug}/progress/section-viewed`, { section }).catch(() => {});
  };

  // Vừa mở chủ đề thì tính là đã xem phần Learn
  useEffect(() => {
    markViewed('learn');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Đổi tab; mở Learn hoặc Examples thì tính là đã xem phần đó
  const handleTabChange = (key: TabKey) => {
    setTab(key);
    if (key === 'learn' || key === 'examples') markViewed(key);
  };

  // Làm mới dữ liệu chủ đề, danh sách chủ đề và tổng quan tiến độ sau khi nộp bài
  const refreshTopic = () => {
    queryClient.invalidateQueries({ queryKey: ['learning', 'topic', slug] });
    queryClient.invalidateQueries({ queryKey: ['learning', 'topics'] });
    queryClient.invalidateQueries({ queryKey: ['learning', 'overview'] });
  };

  // Đang tải: hiện vòng quay chờ
  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // Không tìm thấy nội dung học này
  if (isError || !topic) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-sm font-semibold text-slate-700">Không tìm thấy nội dung học này.</p>
        <Link to="/learning" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline">
          Quay lại Writing Learning
        </Link>
      </div>
    );
  }

  // Giao diện trang chủ đề: thẻ tiêu đề, thanh tab và nội dung của tab đang chọn
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/learning" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại Writing Learning
      </Link>

      {/* Thẻ tiêu đề chủ đề: nhóm, cấp độ, mức thành thạo, tên, mô tả và các nút nhanh */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60">
            {topic.category === 'grammar' ? 'Grammar' : 'Writing Skills'}
          </span>
          {topic.cefrLevel && (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{topic.cefrLevel}</span>
          )}
          {topic.progress.masteryLabel && (
            <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 border border-purple-100">
              {topic.progress.masteryLabel}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{topic.title}</h1>
        <p className="text-base font-semibold text-slate-500">{topic.titleVi}</p>
        <p className="text-sm text-slate-500 pt-1">{topic.description}</p>

        {/* Quick actions — gợi ý, không bắt buộc theo thứ tự */}
        <div className="flex flex-wrap gap-2 pt-2">
          {topic.category === 'grammar' && (
            <Link
              to={`/quiz?tense=${topic.slug}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <ListChecks className="h-3.5 w-3.5" />
              Làm Quiz {topic.title}
            </Link>
          )}
          <button
            type="button"
            onClick={() => handleTabChange('aiWriting')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Luyện viết {topic.title}
          </button>
        </div>
      </div>

      {/* Thanh tab kiểu W3Schools: bấm vào tab nào cũng được, không bắt buộc theo thứ tự */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => handleTabChange(key)}
            className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Nội dung của tab đang chọn */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        {/* Tab Learn: lý thuyết (markdown) và danh sách lỗi thường gặp */}
        {tab === 'learn' && (
          <div className="space-y-6">
            <MarkdownLite text={topic.theory} />

            {/* Lỗi thường gặp: câu sai (gạch ngang), câu đúng và giải thích */}
            {topic.commonMistakes.length > 0 && (
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4" /> Lỗi thường gặp cần tránh
                </h3>
                {topic.commonMistakes.map((m, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 p-4 space-y-1.5">
                    <p className="text-sm">
                      <span className="text-rose-500 font-bold mr-1.5">❌</span>
                      <span className="line-through text-rose-700">{m.wrong}</span>
                    </p>
                    <p className="text-sm">
                      <span className="text-emerald-500 font-bold mr-1.5">✅</span>
                      <span className="font-semibold text-emerald-800">{m.correct}</span>
                    </p>
                    <p className="text-xs text-slate-600">{m.explanation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Examples: câu ví dụ tiếng Anh kèm nghĩa tiếng Việt, giải thích và nút nghe phát âm */}
        {tab === 'examples' && (
          <div className="space-y-3">
            {topic.examples.length === 0 ? (
              <p className="text-sm text-slate-400">Chưa có ví dụ cho chủ đề này.</p>
            ) : (
              topic.examples.map((ex, i) => (
                <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">{ex.english}</p>
                    <PronounceButton text={ex.english} lang="en-US" size="sm" />
                  </div>
                  {ex.vietnamese && <p className="text-xs text-slate-500">{ex.vietnamese}</p>}
                  <p className="text-xs text-indigo-700"><span className="font-semibold">Why? </span>{ex.explanation}</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab Practice: các bài luyện dịch có sẵn của chủ đề */}
        {tab === 'practice' && (
          <PracticeTab topic={topic} onSubmitted={() => { markViewed('practice'); refreshTopic(); }} />
        )}

        {/* Tab AI Writing: AI sinh đề theo thì của chủ đề này rồi chấm bài */}
        {tab === 'aiWriting' && (
          <AIWritingTab topic={topic} onSubmitted={() => { markViewed('aiWriting'); refreshTopic(); }} />
        )}

        {/* Tab Progress: tiến độ học của chủ đề */}
        {tab === 'progress' && <ProgressTab topic={topic} />}
      </div>
    </div>
  );
};

// Tab Progress: % hoàn thành, độ chính xác luyện tập, số lượt, số lỗi thường gặp và mức thành thạo (dữ liệu từ topic.progress)
const ProgressTab: React.FC<{ topic: LearningTopicDetail }> = ({ topic }) => {
  const { progress } = topic;
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Completion</span>
          <span>{progress.completion}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${progress.completion}%` }} />
        </div>
      </div>

      {/* Bốn ô: độ chính xác luyện tập, số lượt, số lỗi thường gặp, mức thành thạo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-slate-400">Practice Accuracy</p>
          <p className="text-lg font-extrabold text-indigo-600">{progress.practiceAccuracy !== null ? `${progress.practiceAccuracy}%` : '—'}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-slate-400">Attempts</p>
          <p className="text-lg font-extrabold text-indigo-600">{progress.attempts}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-slate-400">Common Errors</p>
          <p className="text-lg font-extrabold text-rose-600">{progress.commonErrorsCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-center">
          <p className="text-[10px] uppercase font-bold text-slate-400">Mastery</p>
          <p className="text-sm font-extrabold text-purple-700 mt-1">{progress.masteryLabel || '—'}</p>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Progress chỉ để bạn theo dõi tiến độ học tập — không giới hạn quyền truy cập các chủ đề khác.
      </p>
    </div>
  );
};

// Tab Practice: chọn một bài luyện dịch, nhập bản dịch và nộp để AI chấm (dùng chung API /writing/attempts)
const PracticeTab: React.FC<{ topic: LearningTopicDetail; onSubmitted: () => void }> = ({ topic, onSubmitted }) => {
  // Trạng thái: bài đang chọn, câu trả lời, cờ đang nộp, kết quả chấm
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  // Một số chủ đề có khu luyện tập riêng: chỉ hiện liên kết tới trang đó
  if (topic.externalPracticePath) {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-8 text-center space-y-3">
        <p className="text-sm text-slate-700">Phần luyện tập của chủ đề này nằm ở một khu vực riêng.</p>
        <Link
          to={topic.externalPracticePath}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
        >
          <ExternalLink className="h-4 w-4" />
          Đi tới trang luyện tập
        </Link>
      </div>
    );
  }

  // Chủ đề chưa có bài luyện nào
  if (topic.exercises.length === 0) {
    return <p className="text-sm text-slate-400">Chủ đề này chưa có bài luyện tập. Hãy quay lại sau!</p>;
  }

  // Bài luyện đang được chọn
  const selected = topic.exercises.find((e) => e.questionId === selectedId);

  // Chọn một bài (truyền chuỗi rỗng để bỏ chọn) và xóa câu trả lời, kết quả cũ
  const handleSelect = (id: string) => {
    setSelectedId(id);
    setAnswer('');
    setEvaluation(null);
  };

  // Nộp bản dịch (POST /writing/attempts); thành công thì hiện kết quả và báo trang cha làm mới tiến độ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || !selected || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await api.post('/writing/attempts', {
        questionId: selected.questionId,
        answer: answer.trim(),
        userAnswer: answer.trim(),
      });
      if (res.data.success) {
        setEvaluation(res.data.data.evaluation || res.data.data);
        onSubmitted();
      }
    } catch (err) {
      // Lỗi thì bỏ qua, người dùng có thể bấm nộp lại
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chưa chọn bài: hiện danh sách các bài luyện kèm điểm cao nhất
  if (!selected) {
    return (
      <div className="space-y-2">
        {topic.exercises.map((ex, idx) => (
          <button
            key={ex.questionId}
            type="button"
            onClick={() => handleSelect(ex.questionId)}
            className="w-full flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-400">Bài {idx + 1}</p>
              <p className="text-sm font-medium text-slate-800 truncate">{ex.vietnameseSentence}</p>
            </div>
            {ex.bestScore !== null && (
              <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{ex.bestScore}đ</span>
            )}
          </button>
        ))}
      </div>
    );
  }

  // Giao diện làm một bài: câu tiếng Việt cần dịch, ô nhập bản dịch hoặc kết quả chấm
  return (
    <div className="space-y-4">
      {/* Nút quay lại danh sách bài */}
      <button type="button" onClick={() => handleSelect('')} className="text-xs font-semibold text-slate-500 hover:text-indigo-600">
        ← Chọn bài khác
      </button>

      {/* Câu tiếng Việt cần dịch */}
      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
        <span className="text-xs font-bold uppercase text-indigo-600">Câu tiếng Việt cần dịch:</span>
        <p className="text-lg font-bold text-slate-900 mt-1">{selected.vietnameseSentence}</p>
      </div>

      {/* Chưa nộp thì hiện ô nhập bản dịch; đã nộp thì hiện kết quả và nút Bài tiếp theo */}
      {!evaluation ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            rows={3}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Nhập bản dịch tiếng Anh của bạn..."
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            autoFocus
          />
          <button
            type="submit"
            disabled={!answer.trim() || isSubmitting}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>Nộp bài & Đánh giá</span>
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Bảng kết quả dùng chung (điểm, chỉ tiêu, lỗi, gợi ý, so sánh với lần nộp trước) */}
          <PracticeResultPanel evaluation={evaluation} />
          <button
            type="button"
            onClick={() => handleSelect('')}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowRight className="h-4 w-4" />
            <span>Bài tiếp theo</span>
          </button>
        </div>
      )}
    </div>
  );
};

// Lựa chọn chủ đề: chủ đề có sẵn (topicKey) hoặc chủ đề tự nhập (customTopic)
type AIWritingSelection = { topicKey?: string; customTopic?: string };

// Tab AI Writing: học viên chọn (hoặc tự nhập) chủ đề, AI sinh đúng một đề theo thì của trang này, học viên viết rồi AI chấm, có thể sửa và nộp lại. AI chỉ được gọi khi người dùng chủ động bấm
// AI Writing: user picks a Topic (or types a custom one) → AI generates exactly
// one prompt scoped to this page's tense + the chosen topic + the user's own
// server-derived CEFR level → write → AI evaluation (unmodified /writing/attempts)
// → correction → rewrite loop, same as before. AI is called only on explicit
// user action (pick a topic / "Thử đề khác"), never automatically on tab open.
const AIWritingTab: React.FC<{ topic: LearningTopicDetail; onSubmitted: () => void }> = ({ topic, onSubmitted }) => {
  // Trạng thái sinh đề: đề hiện tại, lựa chọn đang dùng, chủ đề tự nhập, cờ đang tạo, lỗi và cờ chống bấm lặp
  const [question, setQuestion] = useState<AIWritingGeneratedQuestion | null>(null);
  const [activeSelection, setActiveSelection] = useState<AIWritingSelection | null>(null);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const generatingRef = useRef(false);

  // Trạng thái làm bài: câu trả lời, cờ đang nộp, kết quả chấm và lịch sử điểm các lần nộp
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);

  // Lấy các chủ đề gợi ý cho AI Writing (GET /learning/ai-writing/topics)
  const { data: topicOptions } = useQuery<AIWritingTopicOption[]>({
    queryKey: ['learning', 'ai-writing-topics'],
    queryFn: async () => (await api.get('/learning/ai-writing/topics')).data.data,
    staleTime: Infinity,
  });

  // Chủ đề có khu viết riêng: chỉ hiện liên kết tới trang đó
  if (topic.externalPracticePath) {
    return (
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-8 text-center space-y-3">
        <p className="text-sm text-slate-700">Phần AI Writing của chủ đề này nằm ở một khu vực riêng.</p>
        <Link
          to={topic.externalPracticePath}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
        >
          <ExternalLink className="h-4 w-4" />
          Đi tới trang viết bài
        </Link>
      </div>
    );
  }

  // Gọi AI sinh đề (POST /learning/ai-writing/generate) theo thì của chủ đề này; chặn bấm lặp
  const generate = async (selection: AIWritingSelection) => {
    if (generatingRef.current) return;
    generatingRef.current = true;
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await api.post('/learning/ai-writing/generate', { tenseSlug: topic.slug, ...selection });
      if (res.data.success) {
        setQuestion(res.data.data as AIWritingGeneratedQuestion);
        setActiveSelection(selection);
        setAnswer('');
        setEvaluation(null);
        setScoreHistory([]);
      }
    } catch (err: any) {
      setGenError(err?.response?.data?.message || 'AI không thể tạo đề bài. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
      generatingRef.current = false;
    }
  };

  // Bấm Tạo đề với chủ đề tự nhập
  const handleCustomTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTopicInput.trim() || isGenerating) return;
    generate({ customTopic: customTopicInput.trim() });
  };

  // Thử đề khác: sinh lại đề với cùng lựa chọn chủ đề
  const handleTryAnother = () => {
    if (!activeSelection || isGenerating) return;
    generate(activeSelection);
  };

  // Đổi chủ đề: xóa đề, câu trả lời, kết quả và lịch sử điểm
  const handleChangeTopic = () => {
    setQuestion(null);
    setActiveSelection(null);
    setCustomTopicInput('');
    setGenError(null);
    setAnswer('');
    setEvaluation(null);
    setScoreHistory([]);
  };

  // Sửa lại và nộp lại
  const handleRewrite = () => {
    // Keep the user's own answer so they can fix it based on the feedback above.
    setEvaluation(null);
  };

  // Nộp bài (POST /writing/attempts) và ghi thêm điểm vào lịch sử tiến bộ của các lần nộp
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
        const result: EvaluationResult = res.data.data.evaluation || res.data.data;
        setEvaluation(result);
        setScoreHistory((prev) => [...prev, result.score || result.finalScore || 0]);
        onSubmitted();
      }
    } catch (err) {
      // Lỗi thì bỏ qua, người dùng có thể bấm nộp lại
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chưa có đề: hiện các chủ đề gợi ý và ô nhập chủ đề riêng để AI sinh đề
  if (!question) {
    return (
      <div className="space-y-5">
        <p className="text-sm text-slate-500">
          Chọn một chủ đề để AI tạo đề bài viết tiếng Anh theo đúng thì{' '}
          <span className="font-semibold text-slate-700">{topic.title}</span> ({topic.titleVi}), phù hợp với trình độ của bạn.
        </p>

        {/* Thông báo lỗi khi AI không tạo được đề */}
        {genError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{genError}</div>
        )}

        {/* Các nút chủ đề gợi ý; bấm vào để AI sinh đề ngay */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {(topicOptions || []).map((opt) => (
            <button
              key={opt.key}
              type="button"
              disabled={isGenerating}
              onClick={() => generate({ topicKey: opt.key })}
              className="rounded-2xl border border-slate-200 bg-white p-3.5 text-left hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors disabled:opacity-50"
            >
              <p className="text-sm font-bold text-slate-800">{opt.label}</p>
              <p className="text-xs text-slate-500">{opt.labelVi}</p>
            </button>
          ))}
        </div>

        {/* Ô nhập chủ đề của riêng bạn và nút Tạo đề */}
        <form onSubmit={handleCustomTopicSubmit} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            value={customTopicInput}
            onChange={(e) => setCustomTopicInput(e.target.value)}
            placeholder="Hoặc nhập chủ đề của riêng bạn..."
            disabled={isGenerating}
            maxLength={100}
            className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
          />
          <button
            type="submit"
            disabled={!customTopicInput.trim() || isGenerating}
            className="rounded-2xl bg-slate-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-900 disabled:opacity-50 transition-colors shrink-0"
          >
            Tạo đề
          </button>
        </form>

        {/* Thông báo đang chờ AI tạo đề */}
        {isGenerating && (
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
            <span>AI đang tạo đề bài...</span>
          </div>
        )}
      </div>
    );
  }

  // Giao diện khi đã có đề: đề bài tiếng Việt, lịch sử điểm, ô nhập hoặc kết quả chấm
  return (
    <div className="space-y-4">
      {/* Nút Đổi chủ đề và nhãn chủ đề của đề hiện tại */}
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={handleChangeTopic} className="text-xs font-semibold text-slate-500 hover:text-indigo-600">
          ← Đổi chủ đề
        </button>
        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60">
          {question.topic}{question.topicVi && question.topicVi !== question.topic ? ` · ${question.topicVi}` : ''}
        </span>
      </div>

      {/* Đề bài tiếng Việt do AI tạo */}
      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
        <span className="text-xs font-bold uppercase text-indigo-600">Đề bài (tiếng Việt):</span>
        <p className="text-lg font-bold text-slate-900 mt-1">{question.promptVi}</p>
      </div>

      {/* Chuỗi điểm các lần nộp để thấy sự tiến bộ (chỉ hiện khi đã nộp từ 2 lần) */}
      {scoreHistory.length > 1 && (
        <div className="flex items-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 w-fit">
          <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Tiến bộ:</span>
          {scoreHistory.map((s, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <span className="text-slate-300">→</span>}
              <span className={`text-xs font-bold ${idx === scoreHistory.length - 1 ? 'text-indigo-600' : 'text-slate-400'}`}>{s}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Chưa nộp thì hiện ô viết; đã nộp thì hiện kết quả và các nút tiếp theo */}
      {!evaluation ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            rows={4}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Viết câu/đoạn tiếng Anh của bạn tại đây..."
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-base text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!answer.trim() || isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span>{scoreHistory.length > 0 ? 'Nộp lại & Đánh giá' : 'Nộp bài & Đánh giá AI'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          {/* Bảng kết quả dùng chung (điểm, chỉ tiêu, lỗi, gợi ý, so sánh với lần nộp trước) */}
          <PracticeResultPanel evaluation={evaluation} />
          {/* Ba nút sau khi có kết quả: Sửa lại & Nộp lại, Thử đề khác, Đổi chủ đề */}
          <div className="flex flex-wrap items-center gap-3">
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
              <span>Thử đề khác</span>
            </button>
            <button
              type="button"
              onClick={handleChangeTopic}
              className="text-sm font-semibold text-slate-500 hover:text-indigo-600"
            >
              Đổi chủ đề
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningTopicPage;
