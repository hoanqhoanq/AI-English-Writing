import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { AdminEvaluationRecord } from '../../types';
import {
  History,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Eye,
  BookOpen,
} from 'lucide-react';

export const AdminEvaluationsPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<AdminEvaluationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AdminEvaluationRecord | null>(null);

  const loadEvaluations = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getEvaluations();
      setEvaluations(data.attempts || []);
    } catch (err) {
      console.error('Failed to load evaluations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvaluations();
  }, []);

  const filteredEvaluations = evaluations.filter((e) => {
    const term = search.toLowerCase();
    return (
      (e.userEmail && e.userEmail.toLowerCase().includes(term)) ||
      (e.userName && e.userName.toLowerCase().includes(term)) ||
      (e.userAnswer && e.userAnswer.toLowerCase().includes(term)) ||
      (e.vietnameseSentence && e.vietnameseSentence.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo học viên, câu hỏi, hoặc câu trả lời..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
          />
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
                <th className="px-4 py-3">Cấp độ</th>
                <th className="px-4 py-3">Đề bài (Tiếng Việt)</th>
                <th className="px-4 py-3">Câu học viên viết</th>
                <th className="px-4 py-3">Điểm số</th>
                <th className="px-4 py-3">Số lỗi</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredEvaluations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Chưa có lượt chấm bài nào trong cơ sở dữ liệu
                  </td>
                </tr>
              ) : (
                filteredEvaluations.map((ev) => {
                  const score = ev.aiScore || 0;
                  return (
                    <tr key={ev._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{ev.userName || 'Học viên'}</div>
                        <div className="text-[11px] text-slate-400">{ev.userEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">
                          {ev.level || 'B1'}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-slate-800 font-medium">
                        {ev.vietnameseSentence || '—'}
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate font-mono text-slate-700">
                        {ev.userAnswer}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-black ${
                            score >= 80
                              ? 'bg-emerald-50 text-emerald-700'
                              : score >= 60
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {score}/100
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                            ev.errors && ev.errors.length === 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                            {ev.errors ? ev.errors.length : 0} lỗi
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-[11px]">
                        {ev.createdAt ? new Date(ev.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(ev)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-purple-50 hover:text-purple-700 transition"
                          title="Xem phân tích chi tiết của AI"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Chi tiết Đánh giá AI cho học viên: {selectedRecord.userName || selectedRecord.userEmail}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="font-bold text-slate-500 uppercase text-[10px] mb-1">Đề bài (Tiếng Việt):</div>
                <div className="font-semibold text-slate-900 text-sm">
                  {selectedRecord.vietnameseSentence || '—'}
                </div>
              </div>

                <div className="rounded-xl bg-indigo-50/50 p-3 border border-indigo-100">
                  <div className="font-bold text-indigo-700 uppercase text-[10px] mb-1">Câu học viên làm:</div>
                <div className="font-mono font-bold text-slate-900">{selectedRecord.userAnswer}</div>
              </div>

              <div className="rounded-xl bg-emerald-50/50 p-3 border border-emerald-100">
                <div className="font-bold text-emerald-800 uppercase text-[10px] mb-1">
                  Đáp án chuẩn (Reference Answer):
                </div>
                <div className="font-mono font-bold text-emerald-900">
                  {selectedRecord.referenceAnswer || '—'}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <span className="font-bold text-slate-700">Điểm số AI chấm:</span>
                <span className="text-base font-black text-purple-700">{selectedRecord.aiScore} / 100</span>
              </div>

              {selectedRecord.overallFeedback && (
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                  <div className="font-bold text-purple-800 text-[10px] uppercase mb-1">Nhận xét từ AI:</div>
                  <p className="text-slate-700 leading-relaxed">{selectedRecord.overallFeedback}</p>
                </div>
              )}

              {selectedRecord.errors && selectedRecord.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="font-bold text-rose-700 text-xs">
                    Danh sách các lỗi ({selectedRecord.errors.length}):
                  </div>
                  {selectedRecord.errors.map((err, idx) => (
                    <div key={idx} className="rounded-xl bg-rose-50/50 p-3 border border-rose-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-rose-800 uppercase text-[10px]">
                          {err.type || 'Lỗi ngữ pháp'}
                        </span>
                        <span className="text-slate-500 font-mono">
                          {err.wrongText} → <strong className="text-emerald-700">{err.correctText}</strong>
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{err.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
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
