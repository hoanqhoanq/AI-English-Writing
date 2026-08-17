import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { WritingQuestion } from '../../types';
import {
  Sparkles,
  Play,
  Brain,
  CheckCircle,
  ListPlus,
} from 'lucide-react';

export const AIGeneratorPage: React.FC = () => {
  const navigate = useNavigate();

  const [topic, setTopic] = useState<string>('Work');
  const [level, setLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('B1');
  const [grammarTopic, setGrammarTopic] = useState<string>('Present Perfect');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [count, setCount] = useState<number>(5);
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<WritingQuestion[]>([]);
  const [generationNotice, setGenerationNotice] = useState<string>('');

  const topicsList = [
    'Daily Life',
    'Work & Career',
    'Travel & Culture',
    'Technology & AI',
    'Education & Study',
    'Environment & Nature',
    'Business & Finance',
    'Health & Lifestyle',
    'Social Media & Communication',
    'Academic Writing',
  ];

  const grammarList = [
    'Present Simple & Continuous',
    'Past Simple & Past Continuous',
    'Present Perfect',
    'Passive Voice',
    'Conditionals (Type 1, 2, 3)',
    'Relative Clauses',
    'Reported Speech',
    'Modal Verbs',
    'Gerunds & Infinitives',
    'Inversion & Emphasis',
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationNotice('');

    try {
      const payload = {
        topic,
        level,
        grammarTopic,
        difficulty,
        count,
        customPrompt: customPrompt.trim() || undefined,
      };

      const res = await api.post('/ai/generate-questions', payload);
      if (res.data.success && res.data.data) {
        const questionsList = res.data.data.questions || res.data.data;
        setGeneratedQuestions(questionsList);
        setGenerationNotice(`Đã tạo thành công ${questionsList.length} câu luyện viết chuẩn CEFR ${level}!`);
      }
    } catch (err: any) {
      console.error('Error generating questions:', err);
      alert('Không thể tạo câu hỏi lúc này. Hệ thống sẽ sử dụng bộ đề có sẵn!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartPracticing = () => {
    if (generatedQuestions.length === 0) return;
    navigate('/practice', {
      state: {
        customQuestions: generatedQuestions,
        fromGenerator: true,
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
          <Sparkles className="h-4 w-4" />
          <span>Generative AI Assistant</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Tạo bộ đề luyện viết bằng AI (Gemini)
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tùy chỉnh ngữ cảnh, chủ đề và điểm ngữ pháp cụ thể. AI sẽ sinh câu tiếng Việt tự nhiên kèm đáp án chuẩn bản xứ và từ khóa gợi ý.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Generator Form */}
        <div className="lg:col-span-6">
          <form
            onSubmit={handleGenerate}
            className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-5"
          >
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-600" />
              <span>Thiết lập thông số đề bài</span>
            </h2>

            {/* Topic */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Chủ đề nội dung
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              >
                {topicsList.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Level & Difficulty */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Trình độ CEFR
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none font-semibold"
                >
                  <option value="A1">A1 - Sơ cấp</option>
                  <option value="A2">A2 - Tiền trung cấp</option>
                  <option value="B1">B1 - Trung cấp</option>
                  <option value="B2">B2 - Trung cao cấp</option>
                  <option value="C1">C1 - Cao cấp</option>
                  <option value="C2">C2 - Thành thạo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Độ khó
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                >
                  <option value="easy">Dễ (Easy)</option>
                  <option value="medium">Trung bình (Medium)</option>
                  <option value="hard">Nâng cao (Hard)</option>
                </select>
              </div>
            </div>

            {/* Grammar Topic */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Điểm ngữ pháp rèn luyện
              </label>
              <select
                value={grammarTopic}
                onChange={(e) => setGrammarTopic(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
              >
                {grammarList.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Số lượng câu hỏi
                </label>
                <span className="text-xs font-bold text-indigo-600">{count} câu</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Custom Prompt Context */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Bối cảnh tùy chọn (Context / Prompt)
              </label>
              <textarea
                rows={2}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ví dụ: Tạo các câu trong cuộc họp công sở, phỏng vấn xin việc, hoặc đàm phán hợp đồng..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full rounded-2xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>AI đang sinh bộ câu hỏi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Sinh bộ câu hỏi ngay</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ListPlus className="h-5 w-5 text-indigo-600" />
                <span>Danh sách câu hỏi vừa tạo</span>
              </h2>

              {generatedQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={handleStartPracticing}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Luyện ngay ({generatedQuestions.length})</span>
                </button>
              )}
            </div>

            {generationNotice && (
              <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{generationNotice}</span>
              </div>
            )}

            {generatedQuestions.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Sparkles className="mx-auto h-10 w-10 text-slate-300 animate-pulse" />
                <p className="text-sm font-medium text-slate-600">Chưa có bộ câu hỏi nào được tạo</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Chọn thông số ở cột bên trái và bấm "Sinh bộ câu hỏi ngay" để trải nghiệm.
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {generatedQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2 transition-all hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-700">Câu {idx + 1}</span>
                      <span className="rounded bg-indigo-100/60 px-2 py-0.5 font-semibold text-indigo-800">
                        {q.level} · {q.grammarTopic}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-900">{q.vietnameseSentence}</p>
                    <p className="text-xs text-slate-600 italic">Đáp án: {q.referenceAnswer}</p>

                    {q.keywords && q.keywords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[10px] text-slate-400">Từ gợi ý:</span>
                        {q.keywords.map((kw, kIdx) => (
                          <span key={kIdx} className="rounded bg-amber-100/70 px-1.5 py-0.5 text-[10px] font-mono text-amber-900">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGeneratorPage;
