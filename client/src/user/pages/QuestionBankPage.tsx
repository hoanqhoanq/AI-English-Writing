import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { WritingQuestion, Topic, GrammarTopic } from '../../types';
import { PronounceButton } from '../components/PronounceButton';
import {
  BookOpen,
  Search,
  Play,
} from 'lucide-react';

export const QuestionBankPage: React.FC = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'bank'>('bank');
  const [questions, setQuestions] = useState<WritingQuestion[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [grammars, setGrammars] = useState<GrammarTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [qRes, tRes, gRes] = await Promise.all([
        api.get('/writing/questions', { params: { limit: '100' } }),
        api.get('/topics'),
        api.get('/grammar'),
      ]);

      if (qRes.data.success && qRes.data.data?.questions) {
        setQuestions(qRes.data.data.questions);
      }
      if (tRes.data.success) setTopics(tRes.data.data);
      if (gRes.data.success) setGrammars(gRes.data.data);
    } catch (err) {
      console.error('Error fetching questions bank:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchTopic = selectedTopic === 'all' || q.topic === selectedTopic;
    const matchLevel = selectedLevel === 'all' || q.level === selectedLevel;
    const matchSearch =
      !searchTerm ||
      q.vietnameseSentence.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.referenceAnswer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.grammarTopic.toLowerCase().includes(searchTerm.toLowerCase());
    return matchTopic && matchLevel && matchSearch;
  });

  const handlePracticeSingle = (q: WritingQuestion) => {
    navigate('/practice', {
      state: {
        customQuestions: [q],
        fromGenerator: false,
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-indigo-600" />
            <span>Thư viện câu hỏi & Chủ đề</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tra cứu hơn 100 câu luyện viết phân loại theo chủ đề, cấp độ CEFR và ngữ pháp thực chiến.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('bank')}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all bg-white text-indigo-700 shadow-sm"
          >
            <BookOpen className="h-4 w-4" />
            <span>Ngân hàng câu hỏi ({filteredQuestions.length})</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="sm:col-span-6 relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo câu tiếng Việt, tiếng Anh hoặc ngữ pháp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
            >
              <option value="all">Tất cả chủ đề ({topics.length})</option>
              {topics.map((t) => (
                <option key={t._id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none font-semibold"
            >
              <option value="all">Tất cả trình độ</option>
              <option value="A1">A1 - Sơ cấp</option>
              <option value="A2">A2 - Tiền trung cấp</option>
              <option value="B1">B1 - Trung cấp</option>
              <option value="B2">B2 - Trung cao cấp</option>
              <option value="C1">C1 - Cao cấp</option>
              <option value="C2">C2 - Thành thạo</option>
            </select>
          </div>
        </div>

        {/* Questions Grid */}
        {isLoading ? (
          <div className="py-20 text-center text-slate-500">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto mb-3" />
            Đang tải danh sách câu hỏi...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            Không tìm thấy câu hỏi nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredQuestions.map((q) => (
              <div
                key={q._id || q.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200/60">
                        {q.level}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {q.topic}
                      </span>
                    </div>
                    <span className="text-[11px] font-medium text-slate-500">{q.grammarTopic}</span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Đề tiếng Việt:
                    </span>
                    <p className="text-base font-bold text-slate-900 leading-snug">
                      {q.vietnameseSentence}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Đáp án chuẩn (Reference):
                      </span>
                      <PronounceButton text={q.referenceAnswer} lang="en-US" size="sm" />
                    </div>
                    <p className="text-xs font-mono font-medium text-indigo-950">{q.referenceAnswer}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {q.keywords?.slice(0, 3).map((kw, i) => (
                      <span key={i} className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-mono text-amber-800 border border-amber-200">
                        {kw}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePracticeSingle(q)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Luyện câu này</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionBankPage;
