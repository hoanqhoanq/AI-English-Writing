import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, PlayCircle, Circle } from 'lucide-react';
import { LearningTopicSummary } from '../../types';

interface LearningTopicCardProps {
  topic: LearningTopicSummary;
}

const STATUS_META: Record<LearningTopicSummary['status'], { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: 'Đã hoàn thành', color: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  in_progress: { label: 'Đang học', color: 'border-indigo-200 bg-indigo-50 text-indigo-700', icon: PlayCircle },
  not_started: { label: 'Chưa học', color: 'border-slate-200 bg-slate-50 text-slate-500', icon: Circle },
};

// Every topic is always clickable — there is no locked state in this design.
export const LearningTopicCard: React.FC<LearningTopicCardProps> = ({ topic }) => {
  const meta = STATUS_META[topic.status];
  const Icon = meta.icon;
  const category = topic.category === 'grammar' ? 'grammar' : 'writing';

  return (
    <Link
      to={`/learning/${category}/${topic.slug}`}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{topic.title}</h3>
          <p className="text-xs text-slate-500">{topic.titleVi}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${meta.color}`}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
      </div>
      <p className="text-xs text-slate-500 line-clamp-2">{topic.description}</p>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${topic.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
          style={{ width: `${topic.completion}%` }}
        />
      </div>

      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {topic.cefrLevel && (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{topic.cefrLevel}</span>
        )}
        {topic.practiceAccuracy !== null && (
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600">
            Luyện tập: {topic.practiceAccuracy}%
          </span>
        )}
        {topic.masteryLabel && (
          <span className="rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700">
            {topic.masteryLabel}
          </span>
        )}
      </div>
    </Link>
  );
};

export default LearningTopicCard;
