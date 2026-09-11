import React from 'react';
import { CheckCircle2, Lightbulb } from 'lucide-react';
import { EvaluationResult } from '../../types';
import { ErrorViewer } from './ErrorViewer';
import { ScoreBadge } from './ScoreBadge';

interface PracticeResultPanelProps {
  evaluation: EvaluationResult;
}

export const PracticeResultPanel: React.FC<PracticeResultPanelProps> = ({ evaluation }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <ScoreBadge score={evaluation.score || evaluation.finalScore || 0} size="lg" showLabel />
        {evaluation.provider && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
            {evaluation.provider === 'gemini' ? '✨ Gemini AI Pro' : '⚡ Chế độ dự phòng (không phải AI)'}
          </span>
        )}
      </div>

      {evaluation.summary && <p className="text-sm text-slate-600">{evaluation.summary}</p>}

      {evaluation.scoreBreakdown && (
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Ngữ pháp', value: evaluation.scoreBreakdown.grammar },
            { label: 'Từ vựng', value: evaluation.scoreBreakdown.vocabulary },
            { label: 'Ý nghĩa', value: evaluation.scoreBreakdown.meaning },
            { label: 'Cấu trúc', value: evaluation.scoreBreakdown.sentenceStructure },
            { label: 'Tự nhiên', value: evaluation.scoreBreakdown.naturalness },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2 text-center">
              <p className="text-[9px] uppercase font-bold text-slate-400">{s.label}</p>
              <p className="text-sm font-extrabold text-indigo-600">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <ErrorViewer errors={evaluation.errors || []} />

      {evaluation.correctAnswer && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
          <span className="text-[11px] font-bold uppercase text-emerald-800">Câu sửa của AI:</span>
          <p className="text-sm font-semibold text-emerald-950 mt-0.5">{evaluation.correctAnswer}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {evaluation.strengths && evaluation.strengths.length > 0 && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5" /> Điểm tốt
            </div>
            <ul className="space-y-0.5 text-xs text-slate-700">
              {evaluation.strengths.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
        )}
        {evaluation.recommendations && evaluation.recommendations.length > 0 && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-amber-800">
              <Lightbulb className="h-3.5 w-3.5" /> Khuyên luyện tập
            </div>
            <ul className="space-y-0.5 text-xs text-slate-700">
              {evaluation.recommendations.map((r, i) => (
                <li key={i}>• {r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeResultPanel;
