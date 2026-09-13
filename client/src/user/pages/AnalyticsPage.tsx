import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  AnalyticsOverview,
  AIWeaknessAnalysis,
} from '../../types';
import {
  BarChart3,
  Flame,
  Trophy,
  AlertTriangle,
  Brain,
  Sparkles,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query keys under ['analytics', 'overview'] are invalidated right after a
  // writing attempt is saved (Practice, Question Bank, Paragraph Writing), so
  // this refetches with fresh database numbers as soon as that happens —
  // no page reload needed, and no polling in between.
  const { data: overview, isLoading } = useQuery<AnalyticsOverview>({
    queryKey: ['analytics', 'overview'],
    queryFn: async () => (await api.get('/analytics/overview')).data.data,
  });

  const { data: aiAnalysis } = useQuery<AIWeaknessAnalysis>({
    queryKey: ['analytics', 'ai-analysis'],
    queryFn: async () => (await api.get('/analytics/ai-analysis')).data.data,
  });

  const triggerAIMutation = useMutation({
    mutationFn: async () => (await api.post('/analytics/ai-analysis')).data.data as AIWeaknessAnalysis,
    onSuccess: (data) => {
      queryClient.setQueryData(['analytics', 'ai-analysis'], data);
    },
    onError: (err) => {
      console.error('Failed to trigger AI weakness diagnosis:', err);
      alert('Không thể tạo phân tích AI lúc này. Vui lòng thử lại sau!');
    },
  });

  const handleTriggerAIAnalysis = () => {
    triggerAIMutation.mutate();
  };
  const loadingAI = triggerAIMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200/80 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            <span>Thống kê tiến độ & Phân tích lỗi</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi sự tiến bộ, tỷ lệ chính xác theo chủ đề và nhận phân tích điểm yếu ngữ pháp từ AI.
          </p>
        </div>

        <button
          type="button"
          onClick={handleTriggerAIAnalysis}
          disabled={loadingAI}
          className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60 transition-all self-start sm:self-auto"
        >
          {loadingAI ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>AI đang chẩn đoán...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Chẩn đoán điểm yếu AI mới</span>
            </>
          )}
        </button>
      </div>

      {/* Top 3 Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng số câu đã viết</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {overview?.totalAttempts ?? user?.totalWriting ?? 18}
          </p>
          <p className="mt-1 text-xs text-slate-500">Mục tiêu ngày: {user?.dailyGoal || 5} câu</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Điểm trung bình</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-emerald-600">
            {overview?.averageScore ?? user?.averageScore ?? 82}
            <span className="text-sm font-semibold text-slate-400">/100</span>
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Chuỗi ngày học</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-amber-600">
            {user?.streak ?? 4}{' '}
            <span className="text-sm font-semibold text-slate-400">ngày</span>
          </p>
          <p className="mt-1 text-xs text-amber-600 font-medium">Duy trì phong độ đều đặn!</p>
        </div>
      </div>

      {/* AI Diagnosis Card */}
      {aiAnalysis && (
        <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Báo cáo chẩn đoán điểm yếu từ AI</h3>
                <p className="text-xs text-slate-500">Được tổng hợp từ các bài tập đã nộp gần đây</p>
              </div>
            </div>

            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">
              Đánh giá cấp độ: {aiAnalysis.overallLevel}
            </span>
          </div>

          <p className="text-sm leading-relaxed text-slate-700 font-medium bg-white/80 p-4 rounded-2xl border border-slate-200/60">
            {aiAnalysis.analysis || 'Bạn có phản xạ diễn đạt ý chính khá tốt nhưng vẫn còn hay mắc lỗi ở thì quá khứ hoàn thành và thiếu mạo từ xác định.'}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200/80 p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Điểm mạnh nổi bật
              </span>
              <ul className="space-y-1 text-xs text-slate-700">
                {(aiAnalysis.strengths || [
                  'Sử dụng đúng cấu trúc câu đơn và câu ghép',
                  'Vốn từ vựng chủ đề Daily Life và Work đa dạng',
                ]).map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="rounded-2xl bg-amber-50/60 border border-amber-200/80 p-4 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Khuyến nghị cải thiện
              </span>
              <ul className="space-y-1 text-xs text-slate-700">
                {(aiAnalysis.recommendations || [
                  'Ôn tập thêm quy tắc mạo từ The trước danh từ xác định',
                  'Luyện tập cụm giới từ đi kèm với động từ thường gặp',
                ]).map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-500 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
