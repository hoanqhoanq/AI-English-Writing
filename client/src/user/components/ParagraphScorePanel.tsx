import React from 'react';
import { CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
import { ParagraphEvaluationResult } from '../../types';
import { ErrorViewer } from './ErrorViewer';
import { ScoreBadge } from './ScoreBadge';
import { PronounceButton } from './PronounceButton';

interface ParagraphScorePanelProps {
  evaluation: ParagraphEvaluationResult;
  scoreHistory?: number[];
}

const CRITERIA: { key: keyof ParagraphEvaluationResult; label: string }[] = [
  { key: 'content', label: 'Nội dung' },
  { key: 'organization', label: 'Bố cục' },
  { key: 'coherence', label: 'Liên kết' },
  { key: 'grammar', label: 'Ngữ pháp' },
  { key: 'vocabulary', label: 'Từ vựng' },
  { key: 'sentenceStructure', label: 'Cấu trúc câu' },
  { key: 'naturalness', label: 'Tự nhiên' },
];

export const ParagraphScorePanel: React.FC<ParagraphScorePanelProps> = ({ evaluation, scoreHistory }) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Kết quả đánh giá AI</span>
          <div className="mt-1 flex items-center gap-3">
            <ScoreBadge score={evaluation.overallScore} size="xl" showLabel />
            {evaluation.provider && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500">
                {evaluation.provider === 'gemini' ? '✨ Gemini AI Pro' : '⚡ Chế độ dự phòng (không phải AI)'}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {evaluation.wordCount} từ · {evaluation.meetsRequirements ? 'Đáp ứng yêu cầu đề bài' : 'Chưa đáp ứng đủ yêu cầu đề bài'}
          </p>
        </div>

        {scoreHistory && scoreHistory.length > 1 && (
          <div className="flex items-center gap-1.5 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
            <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Tiến bộ:</span>
            {scoreHistory.map((s, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-slate-300">→</span>}
                <span
                  className={`text-xs font-bold ${
                    idx === scoreHistory.length - 1 ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                >
                  {s}
                </span>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CRITERIA.map(({ key, label }) => {
          const c = evaluation[key] as { score: number; feedback: string };
          return (
            <div key={key} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">{label}</p>
              <p className="text-lg font-extrabold text-indigo-600">{c.score}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CRITERIA.map(({ key, label }) => {
          const c = evaluation[key] as { score: number; feedback: string };
          return (
            <div key={key} className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
              <p className="text-sm text-slate-700">{c.feedback}</p>
            </div>
          );
        })}
      </div>

      <ErrorViewer errors={evaluation.errors || []} />

      {evaluation.correctedSuggestion && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Gợi ý bản sửa hoàn chỉnh:</span>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm text-emerald-950 leading-relaxed">{evaluation.correctedSuggestion}</p>
            <PronounceButton text={evaluation.correctedSuggestion} lang="en-US" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {evaluation.strengths && evaluation.strengths.length > 0 && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Điểm tốt</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-700">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.weaknesses && evaluation.weaknesses.length > 0 && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>Cần cải thiện</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-700">
              {evaluation.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-rose-500 font-bold">•</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {evaluation.recommendations && evaluation.recommendations.length > 0 && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              <span>Khuyên luyện tập</span>
            </div>
            <ul className="space-y-1 text-xs text-slate-700">
              {evaluation.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {evaluation.overallFeedback && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4">
          <p className="text-sm text-indigo-950">{evaluation.overallFeedback}</p>
        </div>
      )}
    </div>
  );
};

export default ParagraphScorePanel;
