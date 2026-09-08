import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { JourneyChapter, JourneyOverview, RecommendationItem } from '../../types';
import { JourneyChapterCard } from '../components/JourneyChapterCard';
import { XPLevelBadge } from '../components/XPLevelBadge';
import { Award, Compass, Sparkles } from 'lucide-react';

export const JourneyPage: React.FC = () => {
  const { data: overview, isLoading: loadingOverview } = useQuery<JourneyOverview>({
    queryKey: ['journey', 'overview'],
    queryFn: async () => (await api.get('/journey/overview')).data.data,
  });

  const { data: chapters, isLoading: loadingChapters } = useQuery<JourneyChapter[]>({
    queryKey: ['journey', 'chapters'],
    queryFn: async () => (await api.get('/journey/chapters')).data.data,
  });

  const { data: recommendations } = useQuery<RecommendationItem[]>({
    queryKey: ['journey', 'recommendations'],
    queryFn: async () => (await api.get('/journey/recommendations')).data.data,
  });

  const isLoading = loadingOverview || loadingChapters;
  const totalXpForNextLevel = overview ? Math.pow(overview.level, 2) * 100 : 0;
  const xpProgressPct = overview && totalXpForNextLevel > 0 ? Math.min(100, Math.round((overview.xp / totalXpForNextLevel) * 100)) : 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Compass className="h-6 w-6 text-indigo-600" />
          Lộ trình học Writing
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Học từng thì ngữ pháp theo lộ trình, hoàn thành bài tập để mở khóa chương tiếp theo.
        </p>
      </div>

      {overview && (
        <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <XPLevelBadge xp={overview.xp} level={overview.level} streak={overview.streak} />
            <span className="text-xs font-semibold text-indigo-200">
              {overview.completedChapters}/{overview.totalChapters} chương đã hoàn thành
            </span>
          </div>
          <div className="space-y-1">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width: `${xpProgressPct}%` }} />
            </div>
            <p className="text-[11px] text-indigo-200">{xpProgressPct}% tới Level {overview.level + 1}</p>
          </div>

          {overview.achievements.some((a) => a.earned) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
              <Award className="h-4 w-4 text-amber-300" />
              {overview.achievements.filter((a) => a.earned).map((a) => (
                <span key={a.id} title={a.description} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-amber-100">
                  {a.title}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
            <Sparkles className="h-4 w-4" />
            Đề xuất luyện tập cho bạn
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendations.map((r) => (
              <Link
                key={r.grammarTopicId}
                to={`/journey/${r.grammarTopicId}`}
                className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 transition-colors"
              >
                {r.grammarTopic} <span className="text-amber-500">({r.averageScore}đ)</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Chương ngữ pháp</h2>
        {isLoading ? (
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(chapters || []).map((c) => (
              <JourneyChapterCard key={c.grammarTopicId} chapter={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JourneyPage;
