import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  AnalyticsOverview,
  ErrorCategoryStat,
  TrendStat,
  AIWeaknessAnalysis,
} from '../../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  BarChart3,
  Flame,
  Target,
  Trophy,
  AlertTriangle,
  Brain,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [errorStats, setErrorStats] = useState<ErrorCategoryStat[]>([]);
  const [trendStats, setTrendStats] = useState<TrendStat[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIWeaknessAnalysis | null>(null);
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const [ovRes, errRes, trendRes, aiRes] = await Promise.all([
        api.get('/analytics/overview').catch(() => ({ data: { success: false } })),
        api.get('/analytics/errors').catch(() => ({ data: { success: false } })),
        api.get('/analytics/trends').catch(() => ({ data: { success: false } })),
        api.get('/analytics/ai-analysis').catch(() => ({ data: { success: false } })),
      ]);

      if (ovRes.data.success) setOverview(ovRes.data.data);
      if (errRes.data.success) setErrorStats(errRes.data.data?.errors || errRes.data.data || []);
      if (trendRes.data.success) setTrendStats(trendRes.data.data?.trends || trendRes.data.data || []);
      if (aiRes.data.success) setAiAnalysis(aiRes.data.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerAIAnalysis = async () => {
    setLoadingAI(true);
    try {
      const res = await api.post('/analytics/ai-analysis');
      if (res.data.success && res.data.data) {
        setAiAnalysis(res.data.data);
      }
    } catch (err) {
      console.error('Failed to trigger AI weakness diagnosis:', err);
      alert('Không thể tạo phân tích AI lúc này. Vui lòng thử lại sau!');
    } finally {
      setLoadingAI(false);
    }
  };

  const COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

  const displayTrends = trendStats.length > 0 ? trendStats : [
    { date: 'T2', averageScore: 68, count: 3 },
    { date: 'T3', averageScore: 74, count: 4 },
    { date: 'T4', averageScore: 70, count: 2 },
    { date: 'T5', averageScore: 82, count: 5 },
    { date: 'T6', averageScore: 88, count: 4 },
    { date: 'T7', averageScore: 85, count: 3 },
    { date: 'CN', averageScore: 92, count: 6 },
  ];

  const displayErrors = errorStats.length > 0 ? errorStats : [
    { type: 'Thì động từ (Tense)', count: 8, percentage: 38, examples: [] },
    { type: 'Giới từ (Preposition)', count: 5, percentage: 24, examples: [] },
    { type: 'Mạo từ (Articles)', count: 4, percentage: 19, examples: [] },
    { type: 'Dùng từ (Word Choice)', count: 3, percentage: 14, examples: [] },
    { type: 'Chính tả (Spelling)', count: 1, percentage: 5, examples: [] },
  ];

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

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng số câu đã viết</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            {overview?.totalWriting ?? user?.totalWriting ?? 18}
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
          <p className="mt-1 text-xs text-emerald-600 font-medium">Trình độ tương đương: {user?.level || 'B1'}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Chuỗi ngày học</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Flame className="h-4 w-4 fill-amber-500 text-amber-500" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-amber-600">
            {overview?.currentStreak ?? user?.streak ?? 4}{' '}
            <span className="text-sm font-semibold text-slate-400">ngày</span>
          </p>
          <p className="mt-1 text-xs text-amber-600 font-medium">Duy trì phong độ đều đặn!</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Mục tiêu học tập</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-purple-700 truncate">
            {user?.target || 'IELTS'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Cấp độ mục tiêu: B2 / C1</p>
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
              Đánh giá cấp độ: {aiAnalysis.overallLevel || user?.level || 'B1'}
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Trend Chart */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <span>Biểu đồ biến thiên điểm số</span>
            </h3>
            <span className="text-xs text-slate-400">Theo thời gian</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={displayTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#94A3B8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="averageScore"
                  name="Điểm TB"
                  stroke="#4F46E5"
                  strokeWidth={3}
                  dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Error distribution chart */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              <span>Phân bố các loại lỗi</span>
            </h3>
            <span className="text-xs text-slate-400">Tỷ lệ %</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={displayErrors} layout="vertical">
                <XAxis type="number" stroke="#94A3B8" fontSize={11} />
                <YAxis dataKey="type" type="category" width={110} stroke="#475569" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                  }}
                />
                <Bar dataKey="count" name="Số lỗi mắc" fill="#6366F1" radius={[0, 8, 8, 0]}>
                  {displayErrors.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
