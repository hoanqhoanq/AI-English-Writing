import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { LearningProgressOverview } from '../../types';
import { XPLevelBadge } from '../components/XPLevelBadge';
import { ArrowLeft, TrendingUp, AlertCircle, History, CheckCircle2, PlayCircle, Circle } from 'lucide-react';

export const LearningProgressPage: React.FC = () => {
  const { data: overview, isLoading } = useQuery<LearningProgressOverview>({
    queryKey: ['learning', 'overview'],
    queryFn: async () => (await api.get('/learning/progress-overview')).data.data,
  });

  if (isLoading || !overview) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/learning" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại Writing Learning
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-indigo-600" />
          My Progress
        </h1>
      </div>

      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl space-y-4">
        <XPLevelBadge xp={overview.xp} level={overview.level} streak={overview.streak} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-200 mb-1">
              <span>Grammar</span>
              <span>{overview.grammarProgressPct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${overview.grammarProgressPct}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-indigo-200 mb-1">
              <span>Writing</span>
              <span>{overview.writingProgressPct}%</span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-fuchsia-400" style={{ width: `${overview.writingProgressPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-900">{overview.totalTopics}</p>
          <p className="text-[11px] font-semibold text-slate-500">Chủ đề</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-center">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-emerald-700">{overview.completed}</p>
          <p className="text-[11px] font-semibold text-emerald-600">Đã hoàn thành</p>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 text-center">
          <PlayCircle className="h-4 w-4 text-indigo-500 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-indigo-700">{overview.inProgress}</p>
          <p className="text-[11px] font-semibold text-indigo-600">Đang học</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
          <Circle className="h-4 w-4 text-slate-400 mx-auto mb-1" />
          <p className="text-2xl font-extrabold text-slate-600">{overview.notStarted}</p>
          <p className="text-[11px] font-semibold text-slate-500">Chưa học</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Điểm viết trung bình</p>
        <p className="text-3xl font-extrabold text-indigo-600">{overview.averageScore}%</p>
      </div>

      {overview.weakTopics.length > 0 && (
        <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-800">
            <AlertCircle className="h-4 w-4" /> Weak Grammar Topics
          </div>
          <ol className="space-y-1 text-sm text-slate-700 list-decimal list-inside">
            {overview.weakTopics.map((w) => (
              <li key={w.grammarTopic}>
                {w.grammarTopic} <span className="text-rose-500 text-xs">({w.averageScore}đ, {w.totalAttempts} lượt)</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {overview.recentTopics.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <History className="h-4 w-4" /> Recent Practice
          </div>
          <ul className="space-y-1 text-sm text-slate-700">
            {overview.recentTopics.map((t, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-slate-300">•</span>
                {t.title}
                <span className="text-xs text-slate-400">({t.category === 'grammar' ? 'Grammar' : 'Writing Skills'})</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LearningProgressPage;
