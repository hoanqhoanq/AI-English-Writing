import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { AdminLearningTopic } from '../../types';
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

type EditableTopic = Partial<AdminLearningTopic>;

const parseTriples = (text: string, keys: [string, string, string]): any[] =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('::').map((s) => s.trim());
      return { [keys[0]]: parts[0] || '', [keys[1]]: parts[1] || '', [keys[2]]: parts[2] || '' };
    });

const serializeTriples = (items: Record<string, any>[] | undefined, keys: [string, string, string]): string =>
  (items || []).map((it) => [it[keys[0]] || '', it[keys[1]] || '', it[keys[2]] || ''].join(' :: ')).join('\n');

export const AdminLearningTopicsPage: React.FC = () => {
  const [topics, setTopics] = useState<AdminLearningTopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<EditableTopic | null>(null);
  const [examplesInput, setExamplesInput] = useState('');
  const [mistakesInput, setMistakesInput] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAdminLearningTopics({ limit: 100 });
      setTopics(data.topics || []);
    } catch (err) {
      showToast('Không thể tải dữ liệu nội dung học', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingTopic({
      slug: '',
      title: '',
      titleVi: '',
      category: 'grammar',
      description: '',
      theory: '',
      practiceTag: '',
      externalPracticePath: '',
      isPublished: true,
      order: 0,
    });
    setExamplesInput('');
    setMistakesInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: AdminLearningTopic) => {
    setEditingTopic(t);
    setExamplesInput(serializeTriples(t.examples as any, ['english', 'vietnamese', 'explanation']));
    setMistakesInput(serializeTriples(t.commonMistakes as any, ['wrong', 'correct', 'explanation']));
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;

    const payload = {
      ...editingTopic,
      order: Number(editingTopic.order) || 0,
      examples: parseTriples(examplesInput, ['english', 'vietnamese', 'explanation']),
      commonMistakes: parseTriples(mistakesInput, ['wrong', 'correct', 'explanation']),
      practiceTag: editingTopic.practiceTag || undefined,
      externalPracticePath: editingTopic.externalPracticePath || undefined,
    };

    try {
      if (editingTopic._id) {
        const updated = await adminService.updateLearningTopic(editingTopic._id, payload);
        setTopics((prev) => prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
        showToast('Cập nhật nội dung học thành công');
      } else {
        const created = await adminService.createLearningTopic(payload);
        setTopics((prev) => [created, ...prev]);
        showToast('Thêm nội dung học thành công');
      }
      setIsModalOpen(false);
      setEditingTopic(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi lưu nội dung học', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa nội dung học này?')) return;
    try {
      await adminService.deleteLearningTopic(id);
      setTopics((prev) => prev.filter((t) => t._id !== id));
      showToast('Đã xóa nội dung học thành công');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa nội dung học', 'error');
    }
  };

  const filteredTopics = topics.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.titleVi.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' ? true : t.category === categoryFilter;
    return matchesSearch && matchesCategory;
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
            {feedback.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertTriangle className="h-4 w-4 text-rose-600" />}
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
              placeholder="Tìm theo tiêu đề hoặc slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-purple-500 focus:bg-white focus:outline-none"
          >
            <option value="all">Tất cả danh mục</option>
            <option value="grammar">Grammar</option>
            <option value="writing_skill">Writing Skills</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={loadData} disabled={isLoading} className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100" title="Tải lại">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-xs transition"
          >
            <Plus className="h-4 w-4" />
            Thêm nội dung học
          </button>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredTopics.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">Không tìm thấy nội dung học phù hợp</div>
        ) : (
          filteredTopics.map((t) => (
            <div key={t._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-purple-200 transition space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700 border border-indigo-200/60">
                    {t.category === 'grammar' ? 'Grammar' : 'Writing Skills'}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono text-slate-600">/{t.slug}</span>
                  {!t.isPublished && <span className="rounded-lg bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase text-rose-700">Ẩn</span>}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => openEditModal(t)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                    <Edit2 className="h-3.5 w-3.5" /> Sửa
                  </button>
                  <button type="button" onClick={() => handleDelete(t._id)} className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                    <Trash2 className="h-3.5 w-3.5" /> Xóa
                  </button>
                </div>
              </div>
              <div className="text-sm font-bold text-slate-900">{t.title} <span className="text-xs font-normal text-slate-400">— {t.titleVi}</span></div>
              <div className="text-xs text-slate-500">{t.description}</div>
              <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                {t.practiceTag && <span className="rounded bg-slate-100 px-1.5 py-0.5">Practice: {t.practiceTag}</span>}
                {t.externalPracticePath && <span className="rounded bg-slate-100 px-1.5 py-0.5">Link: {t.externalPracticePath}</span>}
                <span className="rounded bg-slate-100 px-1.5 py-0.5">{(t.examples || []).length} ví dụ</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5">{(t.commonMistakes || []).length} lỗi thường gặp</span>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">{editingTopic._id ? 'Chỉnh sửa nội dung học' : 'Thêm nội dung học mới'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Slug (không dấu, gạch ngang) *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingTopic._id}
                    value={editingTopic.slug || ''}
                    onChange={(e) => setEditingTopic({ ...editingTopic, slug: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:border-purple-500 focus:outline-none disabled:bg-slate-50"
                    placeholder="present-simple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Danh mục</label>
                  <select
                    value={editingTopic.category || 'grammar'}
                    onChange={(e) => setEditingTopic({ ...editingTopic, category: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="grammar">Grammar</option>
                    <option value="writing_skill">Writing Skills</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề (English) *</label>
                  <input
                    type="text"
                    required
                    value={editingTopic.title || ''}
                    onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                    placeholder="Present Simple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề tiếng Việt *</label>
                  <input
                    type="text"
                    required
                    value={editingTopic.titleVi || ''}
                    onChange={(e) => setEditingTopic({ ...editingTopic, titleVi: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                    placeholder="Hiện tại đơn"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả ngắn</label>
                <input
                  type="text"
                  value={editingTopic.description || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Learn — dùng "## Tiêu đề" cho heading, "- " cho gạch đầu dòng
                </label>
                <textarea
                  rows={6}
                  value={editingTopic.theory || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, theory: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Examples — mỗi dòng: câu tiếng Anh :: tiếng Việt (tùy chọn) :: giải thích
                </label>
                <textarea
                  rows={3}
                  value={examplesInput}
                  onChange={(e) => setExamplesInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder={'I go to school every day. :: Tôi đi học mỗi ngày. :: "I" dùng động từ nguyên mẫu'}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Common Mistakes — mỗi dòng: câu sai :: câu đúng :: giải thích
                </label>
                <textarea
                  rows={3}
                  value={mistakesInput}
                  onChange={(e) => setMistakesInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder={'He go to school. :: He goes to school. :: "He" là ngôi thứ 3 số ít nên cần thêm "s"'}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Practice Tag (khớp với Grammar Topic / grammarTopic của câu hỏi)
                  </label>
                  <input
                    type="text"
                    value={editingTopic.practiceTag || ''}
                    onChange={(e) => setEditingTopic({ ...editingTopic, practiceTag: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                    placeholder="Present Simple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    External Practice Path (nếu Practice trỏ ra trang khác)
                  </label>
                  <input
                    type="text"
                    value={editingTopic.externalPracticePath || ''}
                    onChange={(e) => setEditingTopic({ ...editingTopic, externalPracticePath: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                    placeholder="/paragraph-writing"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Thứ tự hiển thị</label>
                  <input
                    type="number"
                    value={editingTopic.order ?? 0}
                    onChange={(e) => setEditingTopic({ ...editingTopic, order: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={editingTopic.isPublished !== false}
                      onChange={(e) => setEditingTopic({ ...editingTopic, isPublished: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    Hiển thị cho học viên
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                  Hủy
                </button>
                <button type="submit" className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700">
                  Lưu nội dung học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLearningTopicsPage;
