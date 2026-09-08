import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Lock, PlayCircle, Trophy, FileQuestion } from 'lucide-react';
import { JourneyChapter } from '../../types';

interface JourneyChapterCardProps {
  chapter: JourneyChapter;
}

const STATUS_META: Record<JourneyChapter['status'], { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: 'Đã hoàn thành', color: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  mastery_test: { label: 'Sẵn sàng kiểm tra', color: 'border-amber-200 bg-amber-50 text-amber-700', icon: Trophy },
  in_progress: { label: 'Đang học', color: 'border-indigo-200 bg-indigo-50 text-indigo-700', icon: PlayCircle },
  locked: { label: 'Chưa mở khóa', color: 'border-slate-200 bg-slate-50 text-slate-400', icon: Lock },
  no_content: { label: 'Chưa có bài tập', color: 'border-slate-200 bg-slate-50 text-slate-400', icon: FileQuestion },
};

export const JourneyChapterCard: React.FC<JourneyChapterCardProps> = ({ chapter }) => {
  const meta = STATUS_META[chapter.status];
  const Icon = meta.icon;
  const isLocked = chapter.status === 'locked' || chapter.status === 'no_content';
  const progressPct = chapter.totalExercises > 0 ? Math.round((chapter.completedExercises / chapter.totalExercises) * 100) : 0;

  const content = (
    <div
      className={`rounded-2xl border p-5 shadow-sm transition-all space-y-3 ${
        isLocked ? 'border-slate-200 bg-slate-50/60 opacity-70' : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{chapter.grammarTopic}</h3>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{chapter.description}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${meta.color}`}>
          <Icon className="h-3 w-3" />
          {meta.label}
        </span>
      </div>

      {chapter.totalExercises > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>
              {chapter.completedExercises}/{chapter.totalExercises} bài
            </span>
            {chapter.masteryScore > 0 && <span>Mastery: {chapter.masteryScore}%</span>}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${chapter.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (isLocked) {
    return <div>{content}</div>;
  }

  return <Link to={`/journey/${chapter.grammarTopicId}`}>{content}</Link>;
};

export default JourneyChapterCard;
