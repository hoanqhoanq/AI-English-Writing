import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { ParagraphTopic, ParagraphLevelTier } from '../../types';
import { FileText, ArrowRight, Sprout, Leaf, TreeDeciduous } from 'lucide-react';

const TIERS: { key: ParagraphLevelTier; label: string; icon: React.ElementType }[] = [
  { key: 'Beginner', label: 'Beginner', icon: Sprout },
  { key: 'Intermediate', label: 'Intermediate', icon: Leaf },
  { key: 'Advanced', label: 'Advanced', icon: TreeDeciduous },
];

export const ParagraphWritingPage: React.FC = () => {
  const [tier, setTier] = useState<ParagraphLevelTier>('Beginner');

  const { data, isLoading } = useQuery<{ topics: ParagraphTopic[] }>({
    queryKey: ['paragraph', 'topics', tier],
    queryFn: async () => (await api.get('/paragraph/topics', { params: { levelTier: tier, limit: 50 } })).data.data,
  });

  const topics = data?.topics || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-indigo-600" />
          Viết đoạn văn
        </h1>
        <p className="text-sm text-slate-500 mt-1">Luyện viết đoạn văn tiếng Anh theo chủ đề, AI sẽ chấm điểm và gợi ý sửa lỗi.</p>
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200">
        {TIERS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTier(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tier === key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        </div>
      ) : topics.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400">
          Chưa có đề bài nào ở trình độ này. Hãy quay lại sau!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topics.map((t) => (
            <Link
              key={t._id}
              to={`/paragraph-writing/${t._id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all space-y-2 group"
            >
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{t.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{t.instruction}</p>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] font-semibold text-slate-400">{t.minWords}-{t.maxWords} từ</span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600">
                  Bắt đầu <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParagraphWritingPage;
