import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { ParagraphTopic } from '../../types';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

export const AdminParagraphTopicsPage: React.FC = () => {
  const [topics, setTopics] = useState<ParagraphTopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');

  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Partial<ParagraphTopic> | null>(null);
  const [requirementsInput, setRequirementsInput] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAdminParagraphTopics({ limit: 100 });
      setTopics(data.topics || []);
    } catch (err) {
      showToast('Không thể tải dữ liệu đề viết đoạn văn', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingTopic({
      title: '',
      instruction: '',
      levelTier: 'Beginner',
      minWords: 50,
      maxWords: 70,
      requirements: [],
      isActive: true,
      order: 0,
    });
    setRequirementsInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: ParagraphTopic) => {
    setEditingTopic(t);
    setRequirementsInput((t.requirements || []).join('\n'));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;

    const payload = {
      ...editingTopic,
      minWords: Number(editingTopic.minWords),
      maxWords: Number(editingTopic.maxWords),
      order: Number(editingTopic.order) || 0,
      requirements: requirementsInput
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (editingTopic._id) {
        const updated = await adminService.updateParagraphTopic(editingTopic._id, payload);
        setTopics((prev) => prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
        showToast('Cập nhật đề bài thành công');
      } else {
        const created = await adminService.createParagraphTopic(payload);
        setTopics((prev) => [created, ...prev]);
        showToast('Thêm đề bài viết đoạn văn thành công');
      }
      setIsModalOpen(false);
      setEditingTopic(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi lưu đề bài', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa đề bài này?')) return;
    try {
      await adminService.deleteParagraphTopic(id);
      setTopics((prev) => prev.filter((t) => t._id !== id));
      showToast('Đã xóa đề bài thành công');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa đề bài', 'error');
    }
  };

  const filteredTopics = topics.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.instruction.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'all' ? true : t.levelTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-4">
      {feedback && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tiêu đề hoặc yêu cầu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-purple-500 focus:bg-white focus:outline-none"
          >
            <option value="all">Tất cả trình độ</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100"
            title="Tải lại"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            Soạn đề bài mới
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredTopics.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            Không tìm thấy đề bài phù hợp với bộ lọc tìm kiếm
          </div>
        ) : (
          filteredTopics.map((t) => (
            <div
              key={t._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-purple-200 transition space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700 border border-indigo-200/60">
                    {t.levelTier}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {t.minWords}-{t.maxWords} từ
                  </span>
                  {!t.isActive && (
                    <span className="rounded-lg bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700">
                      Đã ẩn
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(t)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t._id)}
                    className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Xóa
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Tiêu đề:</div>
                <div className="text-sm font-bold text-slate-900">{t.title}</div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase mr-2">Yêu cầu đề bài:</span>
                  <span className="text-xs text-slate-700">{t.instruction}</span>
                </div>

                {t.requirements && t.requirements.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Yêu cầu cụ thể:</span>
                    {t.requirements.map((r, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-indigo-100/70 text-indigo-800 px-1.5 py-0.5 text-[10px] font-mono font-semibold"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingTopic._id ? 'Chỉnh sửa đề bài viết đoạn văn' : 'Soạn đề bài viết đoạn văn mới'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingTopic.title || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder="My Daily Routine"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yêu cầu đề bài (tiếng Anh) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={editingTopic.instruction || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, instruction: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder="Write a paragraph about your daily routine."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Trình độ</label>
                  <select
                    value={editingTopic.levelTier || 'Beginner'}
                    onChange={(e) => setEditingTopic({ ...editingTopic, levelTier: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số từ tối thiểu</label>
                  <input
                    type="number"
                    min={10}
                    required
                    value={editingTopic.minWords ?? 50}
                    onChange={(e) => setEditingTopic({ ...editingTopic, minWords: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số từ tối đa</label>
                  <input
                    type="number"
                    min={10}
                    required
                    value={editingTopic.maxWords ?? 70}
                    onChange={(e) => setEditingTopic({ ...editingTopic, maxWords: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yêu cầu cụ thể (mỗi dòng một yêu cầu)
                </label>
                <textarea
                  rows={3}
                  value={requirementsInput}
                  onChange={(e) => setRequirementsInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder={'Use Present Simple\nUse at least 5 verbs\nUse at least 2 adverbs of frequency'}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={editingTopic.isActive !== false}
                  onChange={(e) => setEditingTopic({ ...editingTopic, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-700">
                  Hiển thị đề bài này cho học viên
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                >
                  Lưu đề bài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminParagraphTopicsPage;
