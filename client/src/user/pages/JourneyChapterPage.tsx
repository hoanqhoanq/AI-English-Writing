import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { JourneyChapterDetail } from '../../types';
import { ArrowLeft, CheckCircle2, Lock, PlayCircle, Trophy } from 'lucide-react';

export const JourneyChapterPage: React.FC = () => {
  const { grammarTopicId } = useParams<{ grammarTopicId: string }>();
  const navigate = useNavigate();

  const { data: chapter, isLoading, isError } = useQuery<JourneyChapterDetail>({
    queryKey: ['journey', 'chapter', grammarTopicId],
    queryFn: async () => (await api.get(`/journey/chapters/${grammarTopicId}`)).data.data,
    enabled: !!grammarTopicId,
  });

  const goPractice = () => {
    if (!chapter) return;
    navigate(`/practice?grammarTopic=${encodeURIComponent(chapter.grammarTopic)}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (isError || !chapter) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
        <p className="text-sm font-semibold text-slate-700">Không tìm thấy chương học này.</p>
        <Link to="/journey" className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline">
          Quay lại Lộ trình học
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link to="/journey" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Quay lại Lộ trình học
      </Link>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200/60">
            {chapter.level}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">{chapter.grammarTopic}</h1>
          <p className="text-sm text-slate-500 mt-1">{chapter.description}</p>
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>{chapter.completedExercises}/{chapter.totalExercises} bài đã hoàn thành</span>
          <span>Mastery: {chapter.masteryScore}% (yêu cầu {chapter.requiredMasteryScore}%)</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-indigo-500"
            style={{ width: `${chapter.totalExercises > 0 ? Math.round((chapter.completedExercises / chapter.totalExercises) * 100) : 0}%` }}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">Bài tập</h2>
        {chapter.exercises.length === 0 ? (
          <p className="text-sm text-slate-400">Chương này chưa có bài tập nào. Hãy quay lại sau!</p>
        ) : (
          chapter.exercises.map((ex, idx) => {
            const isLocked = ex.status === 'locked';
            const Icon = ex.status === 'completed' ? CheckCircle2 : isLocked ? Lock : PlayCircle;
            const color =
              ex.status === 'completed'
                ? 'text-emerald-600'
                : isLocked
                ? 'text-slate-300'
                : 'text-indigo-600';

            return (
              <button
                key={ex.questionId}
                type="button"
                disabled={isLocked}
                onClick={goPractice}
                className={`w-full flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  isLocked ? 'border-slate-100 bg-slate-50/60 cursor-not-allowed' : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-400">Bài {idx + 1}</p>
                    <p className={`text-sm font-medium truncate ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>
                      {isLocked ? 'Hoàn thành bài trước để mở khóa' : ex.vietnameseSentence}
                    </p>
                  </div>
                </div>
                {ex.bestScore !== null && (
                  <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-600">{ex.bestScore}đ</span>
                )}
              </button>
            );
          })
        )}
      </div>

      {chapter.masteryTestUnlocked && (
        <div className={`rounded-3xl border p-6 text-center space-y-3 ${chapter.masteryTestPassed ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <Trophy className={`h-8 w-8 mx-auto ${chapter.masteryTestPassed ? 'text-emerald-500' : 'text-amber-500'}`} />
          {chapter.masteryTestPassed ? (
            <>
              <h3 className="text-lg font-bold text-emerald-900">🎉 Chương đã hoàn thành!</h3>
              <p className="text-sm text-emerald-700">Mastery: {chapter.masteryScore}%. Sẵn sàng cho chương tiếp theo.</p>
              <Link to="/journey" className="inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                Xem chương tiếp theo
              </Link>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold text-amber-900">Mastery Test</h3>
              <p className="text-sm text-amber-700">
                Điểm trung bình hiện tại {chapter.masteryScore}%, cần đạt {chapter.requiredMasteryScore}% để hoàn thành chương.
                Hãy luyện lại các bài trong chương để cải thiện điểm.
              </p>
              <button
                type="button"
                onClick={goPractice}
                className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-700"
              >
                Luyện lại để đạt Mastery
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default JourneyChapterPage;
