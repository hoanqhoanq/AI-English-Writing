import React from 'react';
import { AlertCircle, ArrowRight, BookOpen } from 'lucide-react';
import { WritingErrorDetail } from '../../types';

interface ErrorViewerProps {
  errors: WritingErrorDetail[];
}

export const ErrorViewer: React.FC<ErrorViewerProps> = ({ errors }) => {
  if (!errors || errors.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-800">
        <div className="flex items-center gap-2 font-medium">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-xs">✓</span>
          Không phát hiện lỗi ngữ pháp hay từ vựng nào! Câu viết chuẩn xác.
        </div>
      </div>
    );
  }

  const getErrorTypeBadge = (type: string) => {
    const map: Record<string, { label: string; color: string }> = {
      GRAMMAR: { label: 'Ngữ pháp', color: 'bg-rose-100 text-rose-800 border-rose-200' },
      TENSE: { label: 'Thì động từ', color: 'bg-amber-100 text-amber-800 border-amber-200' },
      PREPOSITION: { label: 'Giới từ', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      ARTICLE: { label: 'Mạo từ (a/an/the)', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      WORD_CHOICE: { label: 'Dùng từ', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      SPELLING: { label: 'Chính tả', color: 'bg-red-100 text-red-800 border-red-200' },
      WORD_ORDER: { label: 'Trật tự từ', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      PUNCTUATION: { label: 'Dấu câu', color: 'bg-slate-100 text-slate-800 border-slate-200' },
    };

    const target = map[type.toUpperCase()] || { label: type, color: 'bg-slate-100 text-slate-800 border-slate-200' };
    return (
      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${target.color}`}>
        {target.label}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-rose-700">
        <AlertCircle className="h-4 w-4" />
        <span>Chi tiết các điểm cần chỉnh sửa ({errors.length} lỗi):</span>
      </div>

      <div className="grid gap-3">
        {errors.map((err, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-rose-100 bg-rose-50/40 p-4 transition-all hover:bg-rose-50/70"
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {getErrorTypeBadge(err.type || err.category || 'GRAMMAR')}
              {err.category && err.category !== err.type && (
                <span className="text-xs font-medium text-slate-500">[{err.category}]</span>
              )}
            </div>

            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="rounded bg-rose-100 px-2 py-1 font-mono text-rose-800 line-through">
                {err.wrongText || '(từ bị thiếu/thừa)'}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span className="rounded bg-emerald-100 px-2 py-1 font-mono font-semibold text-emerald-800">
                {err.correctText || '(lược bỏ)'}
              </span>
            </div>

            <p className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-700">
              <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>{err.explanation}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ErrorViewer;
