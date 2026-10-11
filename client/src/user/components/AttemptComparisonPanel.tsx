import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { AttemptRecord, ScoreBreakdown } from '../../types';
import { TrendingUp, CheckCircle2 } from 'lucide-react';

interface AttemptComparisonPanelProps {
  questionId?: string;
}

const CRITERIA: { key: keyof ScoreBreakdown; label: string }[] = [
  { key: 'grammar', label: 'Ngữ pháp' },
  { key: 'vocabulary', label: 'Từ vựng' },
  { key: 'meaning', label: 'Ý nghĩa' },
  { key: 'sentenceStructure', label: 'Cấu trúc' },
  { key: 'naturalness', label: 'Tự nhiên' },
];

// Renders "Lần trước vs Lần này" only once at least 2 attempts exist for the
// same question — every resubmit already creates a new WritingAttempt
// document (writing.service.ts#submitAttempt), so this is purely a read/compare
// view, never a trigger for new data. Renders nothing on the first attempt.
export const AttemptComparisonPanel: React.FC<AttemptComparisonPanelProps> = ({ questionId }) => {
  const { data } = useQuery<{ attempts: AttemptRecord[] }>({
    queryKey: ['writing', 'attempts', 'by-question', questionId],
    queryFn: async () => (await api.get('/writing/attempts', { params: { questionId, limit: 5 } })).data.data,
    enabled: !!questionId,
  });

  const attempts = data?.attempts || [];
  if (attempts.length < 2) return null;

  // Newest first (API default sort) — compare the latest submission against
  // the one right before it.
  const latest = attempts[0];
  const previous = attempts[1];
  const attemptNumber = attempts.length;
  const scoreDelta = latest.finalScore - previous.finalScore;

  const previousErrorTypes = new Set((previous.errors || []).map((e) => e.type));
  const latestErrorTypes = new Set((latest.errors || []).map((e) => e.type));
  const fixedErrorTypes = [...previousErrorTypes].filter((t) => !latestErrorTypes.has(t));

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-indigo-800">
        <TrendingUp className="h-4 w-4" />
        So sánh với lần trước (Lần {attemptNumber - 1} → Lần {attemptNumber})
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-white/70 p-2.5 border border-slate-100">
          <p className="text-[10px] font-bold uppercase text-slate-400">Lần {attemptNumber - 1}</p>
          <p className="text-xl font-extrabold text-slate-500">{previous.finalScore}</p>
        </div>
        <div className="rounded-xl bg-white/70 p-2.5 border border-slate-100">
          <p className="text-[10px] font-bold uppercase text-slate-400">Lần {attemptNumber}</p>
          <p className="text-xl font-extrabold text-indigo-700">{latest.finalScore}</p>
        </div>
      </div>

      {previous.scoreBreakdown && latest.scoreBreakdown && (
        <div className="grid grid-cols-5 gap-1.5">
          {CRITERIA.map((c) => {
            const prevVal = previous.scoreBreakdown![c.key];
            const curVal = latest.scoreBreakdown![c.key];
            const diff = curVal - prevVal;
            return (
              <div key={c.key} className="rounded-lg bg-white/70 border border-slate-100 p-1.5 text-center">
                <p className="text-[8px] uppercase font-bold text-slate-400">{c.label}</p>
                <p className="text-xs font-extrabold text-slate-700">{curVal}</p>
                {diff !== 0 && (
                  <p className={`text-[10px] font-bold ${diff > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {diff > 0 ? '+' : ''}
                    {diff}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className={`text-sm font-bold ${scoreDelta > 0 ? 'text-emerald-700' : scoreDelta < 0 ? 'text-slate-600' : 'text-slate-600'}`}>
        {scoreDelta > 0
          ? `↑ Điểm tăng ${scoreDelta} điểm`
          : scoreDelta < 0
          ? 'Bài viết đã được cải thiện ở một số lỗi, nhưng vẫn còn lỗi cần luyện thêm.'
          : 'Điểm giữ nguyên — hãy xem các lỗi còn lại bên dưới.'}
      </p>

      {fixedErrorTypes.length > 0 && (
        <ul className="space-y-1">
          {fixedErrorTypes.map((type) => (
            <li key={type} className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã sửa lỗi {type}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AttemptComparisonPanel;
