import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { Topic, GrammarTopic } from '../../types';
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export const AdminTopicsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'topics' | 'grammar'>('topics');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [grammars, setGrammars] = useState<GrammarTopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Partial<Topic> | null>(null);

  const [isGrammarModalOpen, setIsGrammarModalOpen] = useState(false);
  const [editingGrammar, setEditingGrammar] = useState<Partial<GrammarTopic> | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
      try {
      const [tData, gData] = await Promise.all([
        adminService.getTopics(),
        adminService.getGrammars(),
      ]);
      setTopics(tData);
      setGrammars(gData);
    } catch (err) {
      showToast('Không thể tải danh sách chủ đề & ngữ pháp', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;
    try {
      if (editingTopic._id) {
        const updated = await adminService.updateTopic(editingTopic._id, editingTopic);
        setTopics((prev) => prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
        showToast('Cập nhật chủ đề thành công');
      } else {
        const created = await adminService.createTopic(editingTopic);
        setTopics((prev) => [...prev, created]);
        showToast('Tạo chủ đề mới thành công');
      }
      setIsTopicModalOpen(false);
      setEditingTopic(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi lưu chủ đề', 'error');
    }
  };

  const handleDeleteTopic = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chủ đề "${name}"?`)) return;
    try {
      await adminService.deleteTopic(id);
      setTopics((prev) => prev.filter((t) => t._id !== id));
      showToast(`Đã xóa chủ đề ${name}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa chủ đề', 'error');
    }
  };

  const handleSaveGrammar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGrammar) return;
    try {
      if (editingGrammar._id) {
        const updated = await adminService.updateGrammar(editingGrammar._id, editingGrammar);
        setGrammars((prev) => prev.map((g) => (g._id === updated._id ? { ...g, ...updated } : g)));
        showToast('Cập nhật chủ điểm ngữ pháp thành công');
      } else {
        const created = await adminService.createGrammar(editingGrammar);
        setGrammars((prev) => [...prev, created]);
        showToast('Tạo chủ điểm ngữ pháp mới thành công');
      }
      setIsGrammarModalOpen(false);
      setEditingGrammar(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi lưu ngữ pháp', 'error');
    }
  };

  const handleDeleteGrammar = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa chủ điểm ngữ pháp "${name}"?`)) return;
    try {
      await adminService.deleteGrammar(id);
      setGrammars((prev) => prev.filter((g) => g._id !== id));
      showToast(`Đã xóa chủ điểm ${name}`);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa ngữ pháp', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
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

      {/* Tabs and Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('topics')}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              activeTab === 'topics'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chủ đề Luyện Viết ({topics.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('grammar')}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition ${
              activeTab === 'grammar'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chủ điểm Ngữ Pháp ({grammars.length})
          </button>
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

          {activeTab === 'topics' ? (
            <button
              type="button"
              onClick={() => {
                setEditingTopic({ name: '', description: '', icon: '💬' });
                setIsTopicModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              Thêm chủ đề mới
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingGrammar({ name: '', description: '', level: 'B1' });
                setIsGrammarModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-xs transition"
            >
              <Plus className="h-4 w-4" />
              Thêm ngữ pháp mới
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'topics' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((t) => (
            <div
              key={t._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-purple-200 transition space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-xl border border-purple-100">
                      {t.icon || '📚'}
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                      <div className="text-[11px] text-slate-400 font-medium">Chủ đề viết</div>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                  {t.description || 'Không có mô tả chi tiết cho chủ đề này.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTopic(t);
                    setIsTopicModalOpen(true);
                  }}
                  className="rounded-lg p-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteTopic(t._id, t.name)}
                  className="rounded-lg p-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {grammars.map((g) => (
            <div
              key={g._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-purple-200 transition space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700 border border-indigo-200/60">
                    {g.level || 'B1'}
                  </span>
                </div>

                <h4 className="mt-2 font-bold text-slate-900 text-sm">{g.name}</h4>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  {g.description || 'Chủ điểm ngữ pháp tiếng Anh trọng tâm.'}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingGrammar(g);
                    setIsGrammarModalOpen(true);
                  }}
                  className="rounded-lg p-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteGrammar(g._id, g.name)}
                  className="rounded-lg p-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Topic Modal */}
      {isTopicModalOpen && editingTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingTopic._id ? 'Chỉnh sửa chủ đề' : 'Thêm chủ đề mới'}
              </h3>
              <button type="button" onClick={() => setIsTopicModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên chủ đề</label>
                <input
                  type="text"
                  required
                  value={editingTopic.name || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder="Technology & AI"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Icon đại diện (Emoji)</label>
                <input
                  type="text"
                  value={editingTopic.icon || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, icon: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder="💻"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả chủ đề</label>
                <textarea
                  rows={3}
                  value={editingTopic.description || ''}
                  onChange={(e) => setEditingTopic({ ...editingTopic, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder="Các câu luyện viết liên quan đến công nghệ, chuyển đổi số..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                >
                  Lưu chủ đề
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grammar Modal */}
      {isGrammarModalOpen && editingGrammar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingGrammar._id ? 'Chỉnh sửa ngữ pháp' : 'Thêm ngữ pháp mới'}
              </h3>
              <button type="button" onClick={() => setIsGrammarModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrammar} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên chủ điểm ngữ pháp</label>
                <input
                  type="text"
                  required
                  value={editingGrammar.name || ''}
                  onChange={(e) => setEditingGrammar({ ...editingGrammar, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder="Inversion (Đảo ngữ)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cấp độ CEFR phù hợp</label>
                <select
                  value={editingGrammar.level || 'B1'}
                  onChange={(e) => setEditingGrammar({ ...editingGrammar, level: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                >
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả cấu trúc & quy tắc</label>
                <textarea
                  rows={3}
                  value={editingGrammar.description || ''}
                  onChange={(e) => setEditingGrammar({ ...editingGrammar, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder="Cấu trúc đảo ngữ nhấn mạnh với Hardly/Scarcely... when..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsGrammarModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
                >
                  Lưu ngữ pháp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTopicsPage;
