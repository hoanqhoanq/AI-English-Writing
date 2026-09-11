import React, { useRef, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Topic, ParagraphDifficulty, ParagraphGenerateResponse, ParagraphStats } from '../../types';
import { FileText, Sparkles, BarChart3 } from 'lucide-react';

const DIFFICULTIES: { key: ParagraphDifficulty; label: string; labelVi: string; sub: string; words: string }[] = [
  { key: 'easy', label: 'EASY', labelVi: 'Dễ', sub: 'Beginner', words: '50-70 từ' },
  { key: 'medium', label: 'MEDIUM', labelVi: 'Trung bình', sub: 'Intermediate', words: '80-120 từ' },
  { key: 'hard', label: 'HARD', labelVi: 'Khó', sub: 'Advanced', words: '120-180 từ' },
];

export const ParagraphWritingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [difficulty, setDifficulty] = useState<ParagraphDifficulty | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const generatingRef = useRef(false);

  const { data: topics } = useQuery<Topic[]>({
    queryKey: ['topics'],
    queryFn: async () => (await api.get('/topics')).data.data,
    staleTime: Infinity,
  });

  const { data: stats } = useQuery<ParagraphStats>({
    queryKey: ['paragraph', 'my-stats'],
    queryFn: async () => (await api.get('/paragraph/my-stats')).data.data,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const topic = useCustom ? customTopicInput.trim() : selectedTopic;
      const res = await api.post('/paragraph/generate', { topic, difficulty });
      return res.data.data as ParagraphGenerateResponse;
    },
    onSuccess: (data) => {
      navigate(`/paragraph-writing/${data.topicId}`);
    },
    onError: (err: any) => {
      setGenError(err?.response?.data?.message || 'AI không thể tạo đề bài. Vui lòng thử lại.');
    },
  });

  const chosenTopic = useCustom ? customTopicInput.trim() : selectedTopic;
  const canGenerate = !!chosenTopic && !!difficulty;

  const handleGenerate = () => {
    if (!canGenerate || generatingRef.current) return;
    generatingRef.current = true;
    setGenError(null);
    generateMutation.mutate(undefined, {
      onSettled: () => {
        generatingRef.current = false;
      },
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-indigo-600" />
          Viết đoạn văn
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Luyện viết đoạn văn tiếng Anh với chủ đề và độ khó do bạn lựa chọn.
        </p>
      </div>

      {stats && stats.topicsPracticed > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            <BarChart3 className="h-3.5 w-3.5" /> Tiến độ của bạn
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Chủ đề đã luyện</p>
              <p className="text-lg font-extrabold text-indigo-600">{stats.topicsPracticed}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Lượt viết</p>
              <p className="text-lg font-extrabold text-indigo-600">{stats.totalAttempts}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Điểm trung bình</p>
              <p className="text-lg font-extrabold text-indigo-600">{stats.averageScore}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-3 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Điểm cao nhất</p>
              <p className="text-lg font-extrabold text-emerald-600">{stats.bestScore}</p>
            </div>
          </div>
          {stats.byDifficulty.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              {stats.byDifficulty.map((d) => (
                <span key={d.difficulty} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {DIFFICULTIES.find((x) => x.key === d.difficulty)?.labelVi || d.difficulty}: {d.averageScore}%
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-sm font-bold text-indigo-700">
          <Sparkles className="h-4 w-4" />
          AI PARAGRAPH WRITING
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-800">1. Chọn chủ đề bạn muốn viết</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {(topics || []).map((t) => (
              <button
                key={t._id}
                type="button"
                onClick={() => {
                  setUseCustom(false);
                  setSelectedTopic(t.name);
                }}
                className={`rounded-2xl border p-3.5 text-left transition-colors ${
                  !useCustom && selectedTopic === t.name
                    ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'
                }`}
              >
                <p className="text-sm font-bold text-slate-800">{t.name}</p>
                {t.description && <p className="text-xs text-slate-500 line-clamp-1">{t.description}</p>}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={customTopicInput}
              onChange={(e) => {
                setCustomTopicInput(e.target.value);
                setUseCustom(true);
              }}
              onFocus={() => setUseCustom(true)}
              placeholder="+ Custom Topic — hoặc nhập chủ đề của riêng bạn..."
              maxLength={100}
              className={`flex-1 rounded-2xl border bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${
                useCustom && customTopicInput.trim() ? 'border-indigo-500' : 'border-slate-200 focus:border-indigo-500'
              }`}
            />
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-5">
          <p className="text-sm font-semibold text-slate-800">2. Chọn độ khó</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => setDifficulty(d.key)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  difficulty === d.key
                    ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'
                }`}
              >
                <p className="text-sm font-extrabold text-slate-900">{d.label}</p>
                <p className="text-xs font-semibold text-slate-500">{d.labelVi}</p>
                <p className="text-[11px] text-slate-400 mt-1">{d.sub} · {d.words}</p>
              </button>
            ))}
          </div>
        </div>

        {genError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{genError}</div>
        )}

        <div className="border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || generateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all"
          >
            {generateMutation.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>AI đang tạo đề...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Tạo đề bài</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParagraphWritingPage;
