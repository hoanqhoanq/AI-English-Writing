import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ParagraphTopic, ParagraphAttemptRecord, ParagraphSubmitResponse } from '../../types';
import { ParagraphScorePanel } from '../components/ParagraphScorePanel';
import { PronounceButton } from '../components/PronounceButton';
import { ArrowLeft, Send, RotateCcw, AlertCircle, Shuffle } from 'lucide-react';

export const ParagraphTopicPage: React.FC = () => {
  // Lấy id đề từ đường dẫn /paragraph-writing/:topicId
  const { topicId } = useParams<{ topicId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  // Trạng thái: đoạn văn đang viết, kết quả chấm gần nhất và cờ đang ở chế độ soạn/sửa
  const [text, setText] = useState('');
  const [result, setResult] = useState<ParagraphSubmitResponse | null>(null);
  const [isEditing, setIsEditing] = useState(true);

  // Tải đề bài (GET /paragraph/topics/:id)
  const { data: topic, isLoading: loadingTopic } = useQuery<ParagraphTopic>({
    queryKey: ['paragraph', 'topic', topicId],
    queryFn: async () => (await api.get(`/paragraph/topics/${topicId}`)).data.data,
    enabled: !!topicId,
  });

  // Tải bài đã nộp trước đó của đề này (GET /paragraph/attempts/:topicId) để viết tiếp
  const { data: existingAttempt } = useQuery<ParagraphAttemptRecord | null>({
    queryKey: ['paragraph', 'attempt', topicId],
    queryFn: async () => (await api.get(`/paragraph/attempts/${topicId}`)).data.data,
    enabled: !!topicId,
  });

  // Nếu đã có bài cũ thì điền sẵn vào ô soạn thảo
  useEffect(() => {
    if (existingAttempt?.currentUserAnswer) {
      setText(existingAttempt.currentUserAnswer);
    }
  }, [existingAttempt]);

  // Nộp đoạn văn (POST /paragraph/attempts): AI chấm 7 tiêu chí; thành công thì hiện kết quả và làm mới tiến độ, thống kê, streak
  const submitMutation = useMutation({
    mutationFn: async (submittedText: string) => {
      const res = await api.post('/paragraph/attempts', { topicId, text: submittedText });
      return res.data.data as ParagraphSubmitResponse;
    },
    onSuccess: (data) => {
      setResult(data);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['paragraph', 'attempt', topicId] });
      queryClient.invalidateQueries({ queryKey: ['learning', 'overview'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'overview'] });
      refreshUser();
    },
  });

  // Đếm số từ để so với khoảng số từ yêu cầu của đề
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  // Bấm Nộp bài: bỏ qua nếu ô trống hoặc đang chấm dở
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || submitMutation.isPending) return;
    submitMutation.mutate(text.trim());
  };

  // Đang tải đề: hiện vòng quay chờ
  if (loadingTopic) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  // Không tìm thấy đề bài
  if (!topic) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-sm font-semibold text-slate-700">Không tìm thấy đề bài này.</p>
        <Link to="/paragraph-writing" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline">
          Quay lại Viết đoạn văn
        </Link>
      </div>
    );
  }

  // Giao diện trang làm bài đoạn văn: thông tin đề, khung soạn thảo hoặc kết quả chấm
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Liên kết quay lại trang chọn đề */}
      <Link to="/paragraph-writing" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại Viết đoạn văn
      </Link>

      {/* Thẻ thông tin đề: trình độ, khoảng số từ, tiêu đề, đề bài (có nút nghe) và các yêu cầu */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60">
            {topic.levelTier}
          </span>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {topic.minWords}-{topic.maxWords} từ
          </span>
        </div>
        <h1 className="text-xl font-bold text-slate-900">{topic.title}</h1>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-slate-700">{topic.instruction}</p>
          <PronounceButton text={topic.instruction} lang={topic.source === 'ai_user_generated' ? 'vi-VN' : 'en-US'} />
        </div>
        {topic.requirements && topic.requirements.length > 0 && (
          <ul className="space-y-1 pt-2 border-t border-slate-100">
            {topic.requirements.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                <span className="text-indigo-500 font-bold">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Chế độ soạn bài thì hiện khung viết; chấm xong thì hiện kết quả */}
      {isEditing || !result ? (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          {/* Nhãn ô nhập và bộ đếm số từ (vàng khi lệch khoảng yêu cầu, xanh khi đạt) */}
          <div className="flex items-center justify-between">
            <label htmlFor="paragraph-text" className="text-sm font-semibold text-slate-800">
              Đoạn văn của bạn:
            </label>
            <span className={`text-xs font-semibold ${wordCount < topic.minWords || wordCount > topic.maxWords ? 'text-amber-600' : 'text-emerald-600'}`}>
              {wordCount} / {topic.minWords}-{topic.maxWords} từ
            </span>
          </div>

          <textarea
            id="paragraph-text"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Viết đoạn văn tiếng Anh của bạn tại đây..."
            disabled={submitMutation.isPending}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-sans"
          />

          {/* Thông báo lỗi khi không chấm được bài */}
          {submitMutation.isError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Không thể đánh giá bài viết lúc này. Vui lòng thử lại sau.</span>
            </div>
          )}

          {/* Nút Nộp bài (đổi thành Nộp lại nếu đã có kết quả) */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!text.trim() || submitMutation.isPending}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>AI đang chấm bài...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>{result ? 'Nộp lại & Đánh giá' : 'Nộp bài & Đánh giá'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          {/* Bảng kết quả chấm đoạn văn: điểm, 7 tiêu chí, lỗi và lịch sử điểm các lần sửa */}
          <ParagraphScorePanel evaluation={result.evaluation} scoreHistory={result.scoreHistory} />

          <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-amber-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Sửa lại bài viết</span>
            </button>

            {/* Nút Làm đề mới, chỉ hiện với đề do AI sinh cho người dùng */}
            {topic.source === 'ai_user_generated' && (
              <button
                type="button"
                onClick={() => navigate('/paragraph-writing')}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Shuffle className="h-4 w-4" />
                <span>Làm đề mới</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParagraphTopicPage;
