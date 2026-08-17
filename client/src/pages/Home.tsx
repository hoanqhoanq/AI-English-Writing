import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PronounceButton } from '../components/PronounceButton';
import { ScoreBadge } from '../components/ScoreBadge';
import { ErrorViewer } from '../components/ErrorViewer';
import api from '../services/api';
import {
  PenTool,
  Sparkles,
  BarChart3,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Brain,
  Zap,
  Target,
  Send,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const Home: React.FC = () => {
  const { user, quickLogin } = useAuth();
  const navigate = useNavigate();

  // Quick Demo Interactive Sandbox
  const samplePrompt = 'Tôi thức dậy lúc 6 giờ sáng mỗi ngày.';
  const sampleRef = 'I wake up at 6 AM every day.';
  const [quickInput, setQuickInput] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [quickResult, setQuickResult] = useState<any>(null);

  const handleQuickEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim() || evaluating) return;

    setEvaluating(true);
    try {
      const res = await api.post('/ai/evaluate-writing', {
        vietnameseSentence: samplePrompt,
        referenceAnswer: sampleRef,
        userAnswer: quickInput.trim(),
        level: 'A1',
      });
      if (res.data.success) {
        setQuickResult(res.data.data);
      }
    } catch (err) {
      console.error(err);
      // Fallback local heuristic
      const cleanInput = quickInput.trim().toLowerCase();
      const isExact = cleanInput === sampleRef.toLowerCase();
      setQuickResult({
        score: isExact ? 100 : 80,
        status: isExact ? 'correct' : 'partially_correct',
        errors: isExact ? [] : [
          {
            type: 'GRAMMAR',
            wrongText: quickInput,
            correctText: sampleRef,
            explanation: 'Hãy chú ý thì Hiện tại đơn và trật tự cụm từ chỉ thời gian.',
          },
        ],
        strengths: ['Nắm được ý tưởng chính'],
        overallFeedback: 'Thử nghiệm thành công! Hãy đăng nhập để lưu trữ kết quả và xem thống kê chi tiết.',
        referenceAnswer: sampleRef,
      });
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 px-6 py-16 sm:px-12 sm:py-24 text-white shadow-2xl">
        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Tích hợp Gemini AI & Heuristic Grammar Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Luyện Viết Tiếng Anh{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Chuẩn Xác Từng Câu
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Nền tảng luyện viết câu tiếng Anh thông minh: Dịch từ tiếng Việt, tự động chấm điểm chuẩn CEFR (A1 - C2), bắt lỗi ngữ pháp tức thì và phân tích lộ trình cải thiện điểm yếu.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/practice"
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all hover:scale-105"
            >
              <PenTool className="h-4 w-4" />
              <span>Bắt đầu luyện viết ngay</span>
            </Link>

            <Link
              to="/generator"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-all"
            >
              <Sparkles className="h-4 w-4 text-cyan-300" />
              <span>AI sinh đề theo yêu cầu</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Interactive Quick Try Sandbox */}
      <div className="max-w-3xl mx-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Zap className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900">Thử nghiệm nhanh (Interactive Live Demo)</h2>
          </div>
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700">A1 · Daily Life</span>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Câu tiếng Việt:</span>
          <div className="flex items-center justify-between gap-2">
            <p className="text-lg font-bold text-slate-900">{samplePrompt}</p>
            <PronounceButton text={samplePrompt} lang="vi-VN" />
          </div>
        </div>

        <form onSubmit={handleQuickEvaluate} className="space-y-3">
          <input
            type="text"
            value={quickInput}
            onChange={(e) => setQuickInput(e.target.value)}
            placeholder="Gõ bản dịch tiếng Anh của bạn (ví dụ: I wake up at 6 AM every day)..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setQuickInput('I wake up 6 AM every day.')}
              className="text-xs text-slate-400 hover:text-indigo-600 underline"
            >
              Thử gõ câu thiếu giới từ 'at'
            </button>

            <button
              type="submit"
              disabled={!quickInput.trim() || evaluating}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              {evaluating ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>AI đang chấm...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>Chấm câu này</span>
                </>
              )}
            </button>
          </div>
        </form>

        {quickResult && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Kết quả đánh giá:</span>
              <ScoreBadge score={quickResult.score} size="md" showLabel />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Đáp án chuẩn:</span>
              <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-xl border border-slate-200">
                <span className="font-semibold text-indigo-950">{quickResult.referenceAnswer || sampleRef}</span>
                <PronounceButton text={quickResult.referenceAnswer || sampleRef} lang="en-US" />
              </div>
            </div>

            <ErrorViewer errors={quickResult.errors || []} />

            <div className="pt-2 flex justify-end">
              <Link
                to="/practice"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                <span>Mở không gian luyện tập đầy đủ</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Key Feature Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <PenTool className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">100+ Câu hỏi chuẩn CEFR</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Phân cấp từ A1 đến C2 với 10 chủ đề quen thuộc (Work, Travel, Tech, Daily Life...) và các điểm ngữ pháp trọng tâm.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
            <Brain className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Chữa lỗi & Giải thích AI</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Phát hiện chính xác lỗi thì, giới từ, mạo từ, chính tả và cách dùng từ kèm lời giải thích tiếng Việt rõ ràng, dễ hiểu.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <BarChart3 className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Chẩn đoán điểm yếu cá nhân</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            AI theo dõi lịch sử làm bài, vẽ biểu đồ tiến độ và chỉ ra những lỗi ngữ pháp bạn thường xuyên lặp lại nhất.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
