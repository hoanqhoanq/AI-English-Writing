import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import { WritingQuestion, Topic, GrammarTopic } from '../../types';
import {
  BookOpen,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Layers,
  GraduationCap,
} from 'lucide-react';

export const AdminQuestionsPage: React.FC = () => {
  const [questions, setQuestions] = useState<WritingQuestion[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [grammars, setGrammars] = useState<GrammarTopic[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [questionSearch, setQuestionSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');

  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Partial<WritingQuestion> | null>(null);
  const [altAnswersInput, setAltAnswersInput] = useState('');
  const [keywordsInput, setKeywordsInput] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [qData, tData, gData] = await Promise.all([
        adminService.getAdminQuestions(),
        adminService.getTopics(),
        adminService.getGrammars(),
      ]);
      setQuestions(qData.questions || []);
      setTopics(tData);
      setGrammars(gData);
    } catch (err) {
      showToast('Không thể tải dữ liệu câu hỏi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingQuestion({
      vietnameseSentence: '',
      referenceAnswer: '',
      alternativeAnswers: [],
      keywords: [],
      level: 'B1',
      topic: topics[0]?.name || 'Work & Career',
      grammarTopic: grammars[0]?.name || 'Present Perfect',
      difficulty: 'medium',
    });
    setAltAnswersInput('');
    setKeywordsInput('');
    setIsModalOpen(true);
  };

  const openEditModal = (q: WritingQuestion) => {
    setEditingQuestion(q);
    setAltAnswersInput(q.alternativeAnswers?.join('\n') || '');
    setKeywordsInput(q.keywords?.join(', ') || '');
    setIsModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    const formattedPayload = {
      ...editingQuestion,
      alternativeAnswers: altAnswersInput
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      keywords: keywordsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    try {
      if (editingQuestion._id) {
        const updated = await adminService.updateQuestion(editingQuestion._id, formattedPayload);
        setQuestions((prev) => prev.map((q) => (q._id === updated._id ? { ...q, ...updated } : q)));
        showToast('Cập nhật câu hỏi thành công');
      } else {
        const created = await adminService.createQuestion(formattedPayload);
        setQuestions((prev) => [created, ...prev]);
        showToast('Thêm câu hỏi mới vào kho thành công');
      }
      setIsModalOpen(false);
      setEditingQuestion(null);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Lỗi lưu câu hỏi', 'error');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa câu hỏi này khỏi ngân hàng đề?')) return;
    try {
      await adminService.deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      showToast('Đã xóa câu hỏi thành công');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể xóa câu hỏi', 'error');
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.vietnameseSentence.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.referenceAnswer.toLowerCase().includes(questionSearch.toLowerCase());
    const matchesLevel = levelFilter === 'all' ? true : q.level === levelFilter;
    const matchesTopic = topicFilter === 'all' ? true : q.topic === topicFilter;
    return matchesSearch && matchesLevel && matchesTopic;
  });

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

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo câu tiếng Việt hoặc đáp án..."
              value={questionSearch}
              onChange={(e) => setQuestionSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-purple-500 focus:bg-white focus:outline-none"
          >
            <option value="all">Tất cả cấp độ CEFR</option>
            <option value="A1">A1 - Sơ cấp</option>
            <option value="A2">A2 - Tiền trung cấp</option>
            <option value="B1">B1 - Trung cấp</option>
            <option value="B2">B2 - Trên trung cấp</option>
            <option value="C1">C1 - Cao cấp</option>
            <option value="C2">C2 - Thành thạo</option>
          </select>

          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:border-purple-500 focus:bg-white focus:outline-none"
          >
            <option value="all">Tất cả chủ đề</option>
            {topics.map((t) => (
              <option key={t._id} value={t.name}>
                {t.name}
              </option>
            ))}
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
            Soạn câu hỏi mới
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="grid gap-3">
        {filteredQuestions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
            Không tìm thấy câu hỏi phù hợp với bộ lọc tìm kiếm
          </div>
        ) : (
          filteredQuestions.map((q) => (
            <div
              key={q._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-purple-200 transition space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700 border border-indigo-200/60">
                    CEFR: {q.level}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {q.topic}
                  </span>
                  {q.grammarTopic && (
                    <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 border border-purple-100">
                      Ngữ pháp: {q.grammarTopic}
                    </span>
                  )}
                  <span
                    className={`rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase ${
                      q.difficulty === 'hard'
                        ? 'bg-rose-100 text-rose-700'
                        : q.difficulty === 'medium'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {q.difficulty}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(q)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q._id)}
                    className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Xóa
                  </button>
                </div>
              </div>

              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Đề bài tiếng Việt:
                </div>
                <div className="text-sm font-bold text-slate-900">{q.vietnameseSentence}</div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase mr-2">Đáp án chuẩn:</span>
                  <span className="text-xs font-mono font-bold text-emerald-800">{q.referenceAnswer}</span>
                </div>

                {q.alternativeAnswers && q.alternativeAnswers.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase mr-2">Câu đồng nghĩa:</span>
                    <span className="text-xs font-mono text-slate-600">
                      {q.alternativeAnswers.join(' | ')}
                    </span>
                  </div>
                )}

                {q.keywords && q.keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase mr-1">Từ khóa:</span>
                    {q.keywords.map((k, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-indigo-100/70 text-indigo-800 px-1.5 py-0.5 text-[10px] font-mono font-semibold"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Question Modal */}
      {isModalOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingQuestion._id ? 'Chỉnh sửa câu hỏi Writing' : 'Soạn câu hỏi Writing mới'}
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đề bài câu tiếng Việt <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={editingQuestion.vietnameseSentence || ''}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, vietnameseSentence: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder="Ví dụ: Tôi đã làm việc tại công ty này được hơn 3 năm."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Đáp án chuẩn tiếng Anh (Reference Answer) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingQuestion.referenceAnswer || ''}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, referenceAnswer: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder="I have worked at this company for more than 3 years."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Các cách diễn đạt tương đương (Mỗi dòng một câu)
                </label>
                <textarea
                  rows={2}
                  value={altAnswersInput}
                  onChange={(e) => setAltAnswersInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder="I have been working at this company for over 3 years.&#10;I've worked in this company for more than 3 years."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cấp độ CEFR</label>
                  <select
                    value={editingQuestion.level || 'B1'}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, level: e.target.value as any })
                    }
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề</label>
                  <input
                    type="text"
                    value={editingQuestion.topic || ''}
                    onChange={(e) => setEditingQuestion({ ...editingQuestion, topic: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                    placeholder="Work & Career"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Độ khó</label>
                  <select
                    value={editingQuestion.difficulty || 'medium'}
                    onChange={(e) =>
                      setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as any })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="easy">Easy (Dễ)</option>
                    <option value="medium">Medium (Vừa)</option>
                    <option value="hard">Hard (Khó)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chủ điểm ngữ pháp trọng tâm
                </label>
                <input
                  type="text"
                  value={editingQuestion.grammarTopic || ''}
                  onChange={(e) =>
                    setEditingQuestion({ ...editingQuestion, grammarTopic: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder="Present Perfect, Relative Clauses,..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Từ khóa gợi ý (Cách nhau bởi dấu phẩy)
                </label>
                <input
                  type="text"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-purple-500 focus:outline-none"
                  placeholder="work, company, for, over, years"
                />
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
                  Lưu vào Ngân hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuestionsPage;
