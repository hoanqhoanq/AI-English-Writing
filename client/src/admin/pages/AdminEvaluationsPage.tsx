import React, { useState, useEffect, useMemo } from 'react';
import adminService from '../../services/adminService';
import { AdminEvaluationRecord, AdminParagraphAttemptRecord, WritingErrorDetail } from '../../types';
import {
  Search,
  Sparkles,
  X,
  RefreshCw,
  Eye,
  BookOpen,
  FileText,
} from 'lucide-react';

type EvalRowType = 'sentence' | 'paragraph';

interface UnifiedRow {
  key: string;
  rowType: EvalRowType;
  userName?: string;
  userEmail?: string;
  levelLabel: string;
  promptLabel: string;
  userAnswerLabel: string;
  score: number;
  errorsCount: number;
  createdAt: string;
  sentence?: AdminEvaluationRecord;
  paragraph?: AdminParagraphAttemptRecord;
}

const PARAGRAPH_CRITERIA: { key: 'content' | 'organization' | 'coherence' | 'grammar' | 'vocabulary' | 'sentenceStructure' | 'naturalness'; label: string }[] = [
  { key: 'content', label: 'Nội dung' },
  { key: 'organization', label: 'Bố cục' },
  { key: 'coherence', label: 'Liên kết' },
  { key: 'grammar', label: 'Ngữ pháp' },
  { key: 'vocabulary', label: 'Từ vựng' },
  { key: 'sentenceStructure', label: 'Cấu trúc câu' },
  { key: 'naturalness', label: 'Tự nhiên' },
];

// Mappers keep the two very different backend shapes (Sentence Writing's flat
// WritingAttempt vs Paragraph Writing's ParagraphAttempt+revisions) explicit
// rather than force-fitting one onto the other — the table only needs a
// small common denominator; the original record is kept for the detail view.
const toSentenceRow = (e: AdminEvaluationRecord): UnifiedRow => ({
  key: `sentence-${e._id}`,
  rowType: 'sentence',
  userName: e.userName,
  userEmail: e.userEmail,
  levelLabel: e.level || 'B1',
  promptLabel: e.vietnameseSentence || '—',
  userAnswerLabel: e.userAnswer || '',
  score: e.aiScore || 0,
  errorsCount: e.errors ? e.errors.length : 0,
  createdAt: e.createdAt,
  sentence: e,
});

const toParagraphRow = (p: AdminParagraphAttemptRecord): UnifiedRow => {
  const latest = p.revisions && p.revisions.length > 0 ? p.revisions[p.revisions.length - 1] : undefined;
  return {
    key: `paragraph-${p._id}`,
    rowType: 'paragraph',
    userName: p.userName,
    userEmail: p.userEmail,
    levelLabel: p.levelTier || '—',
    promptLabel: p.topicInstruction || p.topicTitle || '—',
    userAnswerLabel: p.currentUserAnswer || '',
    score: p.currentScore || 0,
    errorsCount: latest?.errors?.length || 0,
    createdAt: p.updatedAt || p.createdAt,
    paragraph: p,
  };
};

const TypeBadge: React.FC<{ type: EvalRowType }> = ({ type }) =>
  type === 'sentence' ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
      <BookOpen className="h-3 w-3" /> Sentence Writing
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-md bg-fuchsia-50 px-2 py-0.5 text-[10px] font-bold text-fuchsia-700 border border-fuchsia-200">
      <FileText className="h-3 w-3" /> Paragraph Writing
    </span>
  );

export const AdminEvaluationsPage: React.FC = () => {
  const [sentenceEvaluations, setSentenceEvaluations] = useState<AdminEvaluationRecord[]>([]);
  const [paragraphAttempts, setParagraphAttempts] = useState<AdminParagraphAttemptRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | EvalRowType>('all');
  const [selectedRow, setSelectedRow] = useState<UnifiedRow | null>(null);

  const loadEvaluations = async () => {
    setIsLoading(true);
    try {
      const [sentenceResult, paragraphResult] = await Promise.allSettled([
        adminService.getEvaluations({ limit: 50 }),
        adminService.getAdminParagraphAttempts({ limit: 50 }),
      ]);

      if (sentenceResult.status === 'fulfilled') {
        setSentenceEvaluations(sentenceResult.value.attempts || []);
      } else {
        console.error('Failed to load sentence evaluations:', sentenceResult.reason);
      }

      if (paragraphResult.status === 'fulfilled') {
        setParagraphAttempts(paragraphResult.value.attempts || []);
      } else {
        console.error('Failed to load paragraph evaluations:', paragraphResult.reason);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluations();
  }, []);

  const unifiedRows = useMemo(() => {
    const rows: UnifiedRow[] = [
      ...sentenceEvaluations.map(toSentenceRow),
      ...paragraphAttempts.map(toParagraphRow),
    ];
    rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return rows;
  }, [sentenceEvaluations, paragraphAttempts]);

  const filteredRows = unifiedRows.filter((r) => {
    if (typeFilter !== 'all' && r.rowType !== typeFilter) return false;
    const term = search.toLowerCase();
    if (!term) return true;
    return (
      (r.userEmail && r.userEmail.toLowerCase().includes(term)) ||
      (r.userName && r.userName.toLowerCase().includes(term)) ||
      (r.userAnswerLabel && r.userAnswerLabel.toLowerCase().includes(term)) ||
      (r.promptLabel && r.promptLabel.toLowerCase().includes(term))
    );
  });

  const selectedLatestRevision =
    selectedRow?.paragraph?.revisions && selectedRow.paragraph.revisions.length > 0
      ? selectedRow.paragraph.revisions[selectedRow.paragraph.revisions.length - 1]
      : undefined;

  const renderErrorList = (errors: WritingErrorDetail[]) => (
    <div className="space-y-2">
      <div className="font-bold text-rose-700 text-xs">Danh sách các lỗi ({errors.length}):</div>
      {errors.map((err, idx) => (
        <div key={idx} className="rounded-xl bg-rose-50/50 p-3 border border-rose-100 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-rose-800 uppercase text-[10px]">{err.type || 'Lỗi ngữ pháp'}</span>
            <span className="text-slate-500 font-mono">
              {err.wrongText} → <strong className="text-emerald-700">{err.correctText}</strong>
            </span>
          </div>
          <p className="text-slate-600 text-[11px]">{err.explanation}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo học viên, đề bài, hoặc câu trả lời..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'all' | EvalRowType)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-purple-500 focus:bg-white focus:outline-none"
          >
            <option value="all">Tất cả loại bài</option>
            <option value="sentence">Sentence Writing</option>
            <option value="paragraph">Paragraph Writing</option>
          </select>
        </div>

        <button
          type="button"
          onClick={loadEvaluations}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 self-end sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Tải lại
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Học viên</th>
                <th className="px-4 py-3">Loại bài</th>
                <th className="px-4 py-3">Cấp độ</th>
                <th className="px-4 py-3">Đề bài (Tiếng Việt)</th>
                <th className="px-4 py-3">Bài viết của học viên</th>
                <th className="px-4 py-3">Điểm số</th>
                <th className="px-4 py-3">Số lỗi</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    Chưa có lượt chấm bài nào trong cơ sở dữ liệu
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.key} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{row.userName || 'Học viên'}</div>
                      <div className="text-[11px] text-slate-400">{row.userEmail}</div>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={row.rowType} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                        {row.levelLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate text-slate-800 font-medium">{row.promptLabel}</td>
                    <td className="px-4 py-3 max-w-xs truncate font-mono text-slate-700">{row.userAnswerLabel}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-black ${
                          row.score >= 80
                            ? 'bg-emerald-50 text-emerald-700'
                            : row.score >= 60
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {row.score}/100
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                          row.errorsCount === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {row.errorsCount} lỗi
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedRow(row)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-purple-50 hover:text-purple-700 transition"
                        title="Xem phân tích chi tiết của AI"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Chi tiết Đánh giá AI cho học viên: {selectedRow.userName || selectedRow.userEmail}
                </h3>
              </div>
              <button type="button" onClick={() => setSelectedRow(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <TypeBadge type={selectedRow.rowType} />
              <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">{selectedRow.levelLabel}</span>
            </div>

            {selectedRow.rowType === 'sentence' && selectedRow.sentence && (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                  <div className="font-bold text-slate-500 uppercase text-[10px] mb-1">Đề bài (Tiếng Việt):</div>
                  <div className="font-semibold text-slate-900 text-sm">{selectedRow.sentence.vietnameseSentence || '—'}</div>
                </div>

                <div className="rounded-xl bg-indigo-50/50 p-3 border border-indigo-100">
                  <div className="font-bold text-indigo-700 uppercase text-[10px] mb-1">Câu học viên làm:</div>
                  <div className="font-mono font-bold text-slate-900">{selectedRow.sentence.userAnswer}</div>
                </div>

                <div className="rounded-xl bg-emerald-50/50 p-3 border border-emerald-100">
                  <div className="font-bold text-emerald-800 uppercase text-[10px] mb-1">Đáp án chuẩn (Reference Answer):</div>
                  <div className="font-mono font-bold text-emerald-900">{selectedRow.sentence.referenceAnswer || '—'}</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="font-bold text-slate-700">Điểm số AI chấm:</span>
                  <span className="text-base font-black text-purple-700">{selectedRow.sentence.aiScore} / 100</span>
                </div>

                {selectedRow.sentence.overallFeedback && (
                  <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                    <div className="font-bold text-purple-800 text-[10px] uppercase mb-1">Nhận xét từ AI:</div>
                    <p className="text-slate-700 leading-relaxed">{selectedRow.sentence.overallFeedback}</p>
                  </div>
                )}

                {selectedRow.sentence.errors && selectedRow.sentence.errors.length > 0 && renderErrorList(selectedRow.sentence.errors)}
              </div>
            )}

            {selectedRow.rowType === 'paragraph' && selectedRow.paragraph && (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-500 uppercase text-[10px]">Chủ đề:</div>
                  <div className="font-semibold text-slate-900 text-sm">
                    {selectedRow.paragraph.topicTitle || selectedRow.paragraph.topicCategory || '—'}
                  </div>
                  <div className="font-bold text-slate-500 uppercase text-[10px] pt-1">Đề bài:</div>
                  <div className="font-semibold text-slate-900 text-sm">{selectedRow.paragraph.topicInstruction || '—'}</div>
                </div>

                <div className="rounded-xl bg-indigo-50/50 p-3 border border-indigo-100">
                  <div className="font-bold text-indigo-700 uppercase text-[10px] mb-1">
                    Bài viết của học viên
                    {selectedLatestRevision ? ` (${selectedLatestRevision.wordCount} từ):` : ':'}
                  </div>
                  <div className="font-mono text-slate-900 whitespace-pre-wrap">{selectedRow.paragraph.currentUserAnswer}</div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="font-bold text-slate-700">Tổng điểm:</span>
                  <span className="text-base font-black text-purple-700">{selectedRow.paragraph.currentScore} / 100</span>
                </div>

                {selectedLatestRevision && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PARAGRAPH_CRITERIA.map(({ key, label }) => (
                        <div key={key} className="rounded-xl border border-slate-100 bg-slate-50/60 p-2 text-center">
                          <p className="text-[9px] uppercase font-bold text-slate-400">{label}</p>
                          <p className="text-sm font-extrabold text-indigo-600">{selectedLatestRevision.criteria[key].score}</p>
                        </div>
                      ))}
                    </div>

                    {selectedLatestRevision.overallFeedback && (
                      <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                        <div className="font-bold text-purple-800 text-[10px] uppercase mb-1">AI Feedback:</div>
                        <p className="text-slate-700 leading-relaxed">{selectedLatestRevision.overallFeedback}</p>
                      </div>
                    )}

                    {selectedLatestRevision.errors && selectedLatestRevision.errors.length > 0 && renderErrorList(selectedLatestRevision.errors)}

                    {selectedLatestRevision.strengths && selectedLatestRevision.strengths.length > 0 && (
                      <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                        <div className="font-bold text-emerald-800 text-[10px] uppercase mb-1">Điểm mạnh:</div>
                        <ul className="space-y-0.5 text-slate-700">
                          {selectedLatestRevision.strengths.map((s, i) => (
                            <li key={i}>• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedLatestRevision.correctedSuggestion && (
                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                        <div className="font-bold text-amber-800 text-[10px] uppercase mb-1">Gợi ý cải thiện (bản sửa hoàn chỉnh):</div>
                        <p className="text-slate-700 leading-relaxed">{selectedLatestRevision.correctedSuggestion}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedRow(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvaluationsPage;
