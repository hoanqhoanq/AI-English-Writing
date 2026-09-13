import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { WritingQuestion, EvaluationResult } from '../../types';
import { PracticeResultPanel } from '../components/PracticeResultPanel';
import { PronounceButton } from '../components/PronounceButton';
import { Send, RotateCcw, ArrowLeft, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

// The question bank's detail endpoint never returns the reference answer
// pre-submit — this type reflects that at compile time too.
type SafeWritingQuestion = Omit<WritingQuestion, 'referenceAnswer' | 'alternativeAnswers'>;

export const WritingQuestionPage: React.FC = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { refreshUser } = useAuth();

  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showHints, setShowHints] = useState(false);

  const { data: question, isLoading, isError } = useQuery<SafeWritingQuestion>({
    queryKey: ['writing', 'question', questionId],
    queryFn: async () => (await api.get(`/writing/questions/${questionId}`)).data.data,
    enabled: !!questionId,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/writing/attempts', {
        questionId,
        answer: answer.trim(),
        userAnswer: answer.trim(),
      });
      return (res.data.data.evaluation || res.data.data) as EvaluationResult;
    },
    onSuccess: (data) => {
      setEvaluation(data);
      queryClient.invalidateQueries({ queryKey: ['analytics', 'overview'] });
      refreshUser();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || submitMutation.isPending) return;
    submitMutation.mutate();
  };

  const handleRetry = () => {
    setEvaluation(null);
  };

  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || !question) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-sm font-semibold text-slate-700">Không tìm thấy câu hỏi này.</p>
        <Link to="/questions" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline">
          Quay lại Ngân hàng câu hỏi
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/questions" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại Ngân hàng câu hỏi
      </Link>

      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60">
            {question.level}
          </span>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
            {question.topic}
          </span>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {question.grammarTopic}
          </span>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Đề tiếng Việt:</span>
          <div className="flex items-start justify-between gap-4">
            <p className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">{question.vietnameseSentence}</p>
            <PronounceButton text={question.vietnameseSentence} lang="vi-VN" size="lg" />
          </div>
        </div>
      </div>

      {(!!question.hints?.vocabulary?.length || !!question.hints?.grammar) && (
        <div className="rounded-3xl border border-amber-200/70 bg-amber-50/40 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowHints((prev) => !prev)}
            className="w-full flex items-center justify-between px-6 sm:px-8 py-4 text-left"
          >
            <span className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-600" />
              Gợi ý
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
              {showHints ? 'Ẩn gợi ý' : 'Hiện gợi ý'}
              {showHints ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </span>
          </button>

          {showHints && (
            <div className="px-6 sm:px-8 pb-6 space-y-4 border-t border-amber-100 pt-4">
              {!!question.hints?.vocabulary?.length && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Gợi ý từ vựng</p>
                  <ul className="space-y-1">
                    {question.hints.vocabulary.map((word, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-sm text-slate-700">
                        <span className="text-amber-500 font-bold">•</span>
                        <span className="font-mono">{word}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!!question.hints?.grammar && (
                <div className="space-y-1.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Gợi ý ngữ pháp</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{question.hints.grammar}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!evaluation ? (
        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-4">
          <label htmlFor="writing-question-answer" className="text-sm font-semibold text-slate-800">
            Câu trả lời của bạn:
          </label>
          <textarea
            id="writing-question-answer"
            rows={3}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your English answer here..."
            disabled={submitMutation.isPending}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-sans"
            autoFocus
          />

          {submitMutation.isError && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              Không thể đánh giá bài viết lúc này. Vui lòng thử lại sau.
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-400">{wordCount} từ · {answer.length} ký tự</div>
            <button
              type="submit"
              disabled={!answer.trim() || submitMutation.isPending}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitMutation.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>AI đang chấm điểm...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Nộp bài & Đánh giá</span>
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <PracticeResultPanel evaluation={evaluation} />

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-amber-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Làm lại câu này</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/questions')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-indigo-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Quay lại Ngân hàng câu hỏi</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WritingQuestionPage;
