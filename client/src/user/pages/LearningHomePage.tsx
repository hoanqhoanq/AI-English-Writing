import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { LearningTopicSummary, LearningProgressOverview } from '../../types';
import { LearningTopicCard } from '../components/LearningTopicCard';
import { BookOpen, Search, Sparkles, TrendingUp, PenSquare } from 'lucide-react';

type FilterKey = 'all' | 'grammar' | 'writing_skill' | 'completed' | 'in_progress' | 'not_started';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'writing_skill', label: 'Writing Skills' },
  { key: 'completed', label: 'Đã hoàn thành' },
  { key: 'in_progress', label: 'Đang học' },
  { key: 'not_started', label: 'Chưa học' },
];

export const LearningHomePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const { data: topics, isLoading } = useQuery<LearningTopicSummary[]>({
    queryKey: ['learning', 'topics'],
    queryFn: async () => (await api.get('/learning/topics')).data.data,
  });

  const { data: overview } = useQuery<LearningProgressOverview>({
    queryKey: ['learning', 'overview'],
    queryFn: async () => (await api.get('/learning/progress-overview')).data.data,
  });

  const filtered = useMemo(() => {
    if (!topics) return [];
    return topics.filter((t) => {
      const matchesSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'grammar' || filter === 'writing_skill'
          ? t.category === filter
          : t.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [topics, search, filter]);

  const grammarTopics = filtered.filter((t) => t.category === 'grammar');
  const writingTopics = filtered.filter((t) => t.category === 'writing_skill');

  const slugByPracticeTag = useMemo(() => {
    const map = new Map<string, { slug: string; category: string }>();
    (topics || []).forEach((t: any) => {
      if (t.practiceTag) map.set(t.practiceTag, { slug: t.slug, category: t.category });
    });
    return map;
  }, [topics]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-indigo-600" />
          Writing Learning
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Chọn bất kỳ chủ đề nào bạn muốn học — không cần hoàn thành theo thứ tự.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm chủ đề, ví dụ: past..."
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                filter === f.key ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recommended for you */}
      {overview && overview.weakTopics.length > 0 && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
            <Sparkles className="h-4 w-4" />
            Recommended for you
          </div>
          <div className="flex flex-wrap gap-2">
            {overview.weakTopics.map((w) => {
              const linked = slugByPracticeTag.get(w.grammarTopic);
              const content = (
                <>
                  → Ôn lại <strong>{w.grammarTopic}</strong> <span className="text-amber-500">({w.averageScore}đ)</span>
                </>
              );
              return linked ? (
                <Link
                  key={w.grammarTopic}
                  to={`/learning/${linked.category === 'grammar' ? 'grammar' : 'writing'}/${linked.slug}`}
                  className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 transition-colors"
                >
                  {content}
                </Link>
              ) : (
                <span key={w.grammarTopic} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-800">
                  {content}
                </span>
              );
            })}
            <Link
              to="/paragraph-writing"
              className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-50 transition-colors"
            >
              → Thử Paragraph Writing
            </Link>
          </div>
        </div>
      )}

      {/* My Progress summary */}
      {overview && (
        <Link
          to="/learning/progress"
          className="block rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              My Progress
            </div>
            <span className="text-xs font-semibold text-indigo-600">Xem chi tiết →</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                <span>Grammar</span>
                <span>{overview.grammarProgressPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${overview.grammarProgressPct}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
                <span>Writing</span>
                <span>{overview.writingProgressPct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-fuchsia-500" style={{ width: `${overview.writingProgressPct}%` }} />
              </div>
            </div>
          </div>
        </Link>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : (
        <>
          {grammarTopics.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" /> Grammar
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {grammarTopics.map((t) => (
                  <LearningTopicCard key={t._id} topic={t} />
                ))}
              </div>
            </div>
          )}

          {writingTopics.length > 0 && (
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <PenSquare className="h-4 w-4" /> Writing Skills
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {writingTopics.map((t) => (
                  <LearningTopicCard key={t._id} topic={t} />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400">
              Không tìm thấy chủ đề phù hợp.
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LearningHomePage;
