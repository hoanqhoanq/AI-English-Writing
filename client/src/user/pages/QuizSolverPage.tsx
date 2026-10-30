import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { QuizSolverJob, QuizSolverQuestion, QuizSolverResult, QuizSolverStage } from '../../types';
import {
  FileUp,
  FileText,
  Trash2,
  Sparkles,
  LoaderCircle,
  CircleCheck,
  Circle,
  TriangleAlert,
  Copy,
  Download,
  RotateCcw,
  Check,
  ClipboardList,
  CircleHelp,
} from 'lucide-react';

// Khóa lưu jobId trong sessionStorage: tải lại trang thì tiếp tục theo dõi đúng phiên đang xử lý
// (không gửi lại file, không gọi AI lần nữa).
const JOB_STORAGE_KEY = 'quizSolver.jobId';
const POLL_INTERVAL_MS = 1000;
const ACCEPTED_EXTENSIONS = ['.pdf', '.docx'];
const ACCEPTED_MIME = [
  'application/pdf',
  'application/x-pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/octet-stream',
  '',
];

// Các giai đoạn xử lý thật do server báo về (job.stage) — không giả lập phần trăm
const STEPS = [
  'Đang đọc file',
  'Đang trích xuất câu hỏi',
  'Đang tìm đáp án và giải thích',
  'Đang hoàn thiện kết quả',
];
const STAGE_INDEX: Record<QuizSolverStage, number> = {
  extracting: 0,
  parsing: 1,
  solving: 2,
  finalizing: 3,
  done: 4,
};

type Phase = 'idle' | 'uploading' | 'processing' | 'result' | 'error';

const readStoredJobId = (): string | null => {
  try {
    return sessionStorage.getItem(JOB_STORAGE_KEY);
  } catch {
    return null;
  }
};
const storeJobId = (jobId: string | null) => {
  try {
    if (jobId) sessionStorage.setItem(JOB_STORAGE_KEY, jobId);
    else sessionStorage.removeItem(JOB_STORAGE_KEY);
  } catch {
    // sessionStorage không khả dụng (chế độ riêng tư...) — chỉ mất khả năng khôi phục khi tải lại trang
  }
};

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const answerLabel = (q: QuizSolverQuestion): string => {
  if (q.answer === null) return 'Chưa xác định';
  if (q.options.length && q.answerText) return `${q.answer}. ${q.answerText}`;
  return q.answer;
};

const buildAnswerKeyText = (r: QuizSolverResult) =>
  [`Đáp án — ${r.fileName}`, ...r.questions.map((q) => `${q.number}. ${answerLabel(q)}${q.needsReview ? ' (cần kiểm tra)' : ''}`)].join('\n');

const buildFullText = (r: QuizSolverResult) =>
  [
    `Đáp án và giải thích — ${r.fileName}`,
    ...r.questions.map((q) =>
      [
        `Câu ${q.number}: ${q.question}`,
        ...q.options.map((o) => `${o.label}. ${o.text}`),
        `Đáp án: ${answerLabel(q)}`,
        q.alternatives.length ? `Đáp án khác có thể chấp nhận: ${q.alternatives.join(', ')}` : '',
        `Giải thích: ${q.explanation}`,
        q.needsReview ? '(Cần kiểm tra lại)' : '',
      ]
        .filter(Boolean)
        .join('\n')
    ),
  ].join('\n\n');

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
  }
};

export const QuizSolverPage: React.FC = () => {
  const [phase, setPhase] = useState<Phase>(() => (readStoredJobId() ? 'processing' : 'idle'));
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadPercent, setUploadPercent] = useState<number | null>(null);
  const [jobId, setJobId] = useState<string | null>(() => readStoredJobId());
  const [job, setJob] = useState<QuizSolverJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'key' | 'full' | null>(null);
  const submittingRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Giới hạn dung lượng lấy từ server (GET /quiz-solver/config) để frontend và backend luôn khớp nhau
  const { data: solverConfig } = useQuery<{ maxFileMb: number }>({
    queryKey: ['quiz-solver', 'config'],
    queryFn: async () => (await api.get('/quiz-solver/config')).data.data,
    staleTime: Infinity,
  });
  const maxFileMb = solverConfig?.maxFileMb ?? 10;

  const validateFile = (f: File): string | null => {
    const name = f.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) return 'Chỉ hỗ trợ file PDF (.pdf) hoặc Word (.docx).';
    if (!ACCEPTED_MIME.includes(f.type)) return 'Định dạng file không hợp lệ. Vui lòng chọn file PDF hoặc DOCX.';
    if (f.size === 0) return 'File rỗng. Vui lòng chọn file đề có nội dung.';
    if (f.size > maxFileMb * 1024 * 1024) return `File vượt quá giới hạn ${maxFileMb} MB.`;
    return null;
  };

  const pickFile = (f: File | undefined) => {
    if (!f) return;
    const problem = validateFile(f);
    setFileError(problem);
    setFile(problem ? null : f);
  };

  const reset = () => {
    storeJobId(null);
    setJobId(null);
    setJob(null);
    setFile(null);
    setFileError(null);
    setError(null);
    setUploadPercent(null);
    setPhase('idle');
    if (inputRef.current) inputRef.current.value = '';
  };

  // jobId đã có kết quả cuối (hoàn tất/thất bại) — không cần poll nữa
  const finishedJobIdRef = useRef<string | null>(null);

  const applyJob = useCallback((next: QuizSolverJob) => {
    if (next.status !== 'processing') finishedJobIdRef.current = next.jobId;
    setJob(next);
    if (next.status === 'completed') {
      setPhase('result');
    } else if (next.status === 'failed') {
      storeJobId(null);
      setError(next.error?.message || 'Không thể phân tích đề. Vui lòng thử lại.');
      setPhase('error');
    } else {
      setPhase('processing');
    }
  }, []);

  // Theo dõi tiến trình bằng polling GET /quiz-solver/jobs/:id — chỉ đọc trạng thái, không bao giờ gọi AI lại
  useEffect(() => {
    if (!jobId || finishedJobIdRef.current === jobId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const res = await api.get(`/quiz-solver/jobs/${jobId}`);
        if (cancelled) return;
        const next = res.data.data as QuizSolverJob;
        applyJob(next);
        if (next.status === 'processing') timer = setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err: any) {
        if (cancelled) return;
        if (err?.response?.status === 404) {
          storeJobId(null);
          setJobId(null);
          setError(err.response.data?.message || 'Phiên phân tích đã hết hạn. Vui lòng tải đề lên lại.');
          setPhase('error');
          return;
        }
        // Lỗi mạng tạm thời: thử đọc trạng thái lại sau (vẫn không gửi lại file)
        timer = setTimeout(poll, POLL_INTERVAL_MS * 3);
      }
    };
    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId, applyJob]);

  // Gửi file (POST /quiz-solver/solve). Cờ submittingRef chặn bấm đúp; server cũng chống trùng theo nội dung file.
  const submit = async () => {
    if (!file || submittingRef.current) return;
    submittingRef.current = true;
    setError(null);
    setJob(null);
    setJobId(null);
    setPhase('uploading');
    setUploadPercent(0);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post('/quiz-solver/solve', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadPercent(Math.round((e.loaded / e.total) * 100));
        },
      });
      const next = res.data.data as QuizSolverJob;
      storeJobId(next.jobId);
      setJobId(next.jobId);
      applyJob(next);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải đề lên. Vui lòng kiểm tra kết nối và thử lại.');
      setPhase('error');
    } finally {
      setUploadPercent(null);
      submittingRef.current = false;
    }
  };

  const handleCopy = async (kind: 'key' | 'full') => {
    if (!job?.result) return;
    await copyText(kind === 'key' ? buildAnswerKeyText(job.result) : buildFullText(job.result));
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownload = () => {
    if (!job?.result) return;
    const blob = new Blob([buildFullText(job.result)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dap-an-${job.result.fileName.replace(/\.(pdf|docx)$/i, '')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const busy = phase === 'uploading' || phase === 'processing';
  const result = phase === 'result' ? job?.result : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold text-slate-900">
          <Sparkles className="h-6 w-6 text-indigo-600" />
          AI Quiz Solver
        </h1>
        <p className="mt-1 text-sm text-slate-600">Tải đề Quiz để nhận đáp án và lời giải.</p>
      </div>

      {(phase === 'idle' || phase === 'error') && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              pickFile(e.dataTransfer.files?.[0]);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
            }`}
          >
            <FileUp className="h-10 w-10 text-indigo-500" />
            <p className="mt-3 text-sm font-semibold text-slate-800">Kéo thả file vào đây hoặc bấm để chọn file</p>
            <p className="mt-1 text-xs text-slate-500">PDF (.pdf) hoặc Microsoft Word (.docx) — tối đa {maxFileMb} MB</p>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
          </div>

          {fileError && <p className="text-sm font-medium text-rose-600">{fileError}</p>}

          {file && (
            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-indigo-600" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-800">{file.name}</p>
                  <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (inputRef.current) inputRef.current.value = '';
                }}
                className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                title="Xóa file"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          {phase === 'error' && error && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!file || busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Sparkles className="h-4 w-4" />
            Phân tích đề
          </button>
        </div>
      )}

      {busy && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-sm font-semibold text-slate-800">
            {job?.fileName || file?.name || 'Đang xử lý đề'}
          </p>
          <ol className="space-y-3">
            {STEPS.map((label, index) => {
              const current = phase === 'uploading' ? 0 : STAGE_INDEX[job?.stage ?? 'extracting'];
              const done = index < current;
              const active = index === current;
              const batches = job?.progress;
              return (
                <li key={label} className="flex items-center gap-3 text-sm">
                  {done ? (
                    <CircleCheck className="h-5 w-5 text-emerald-500" />
                  ) : active ? (
                    <LoaderCircle className="h-5 w-5 animate-spin text-indigo-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-300" />
                  )}
                  <span className={active ? 'font-semibold text-slate-900' : done ? 'text-slate-600' : 'text-slate-400'}>
                    {label}
                    {active && index === 0 && uploadPercent !== null && ` — đã tải lên ${uploadPercent}%`}
                    {active && index === 2 && batches && batches.totalBatches > 1 &&
                      ` — ${batches.completedBatches}/${batches.totalBatches} nhóm câu hỏi`}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {result && <QuizSolverResultView result={result} copied={copied} onCopy={handleCopy} onDownload={handleDownload} onReset={reset} />}
    </div>
  );
};

interface ResultViewProps {
  result: QuizSolverResult;
  copied: 'key' | 'full' | null;
  onCopy: (kind: 'key' | 'full') => void;
  onDownload: () => void;
  onReset: () => void;
}

const CONFIDENCE_LABEL: Record<QuizSolverQuestion['confidence'], { text: string; className: string }> = {
  high: { text: 'Tin cậy cao', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { text: 'Tin cậy trung bình', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  low: { text: 'Tin cậy thấp', className: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const QuizSolverResultView: React.FC<ResultViewProps> = ({ result, copied, onCopy, onDownload, onReset }) => {
  const contextById = new Map(result.contexts.map((c) => [c.id, c.text]));
  const shownContexts = new Set<string>();

  return (
    <div className="space-y-6">
      {/* Tổng quan + thao tác */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{result.fileName}</p>
            <p className="mt-1 text-xs text-slate-500">
              {result.summary.total} câu · {result.summary.answered} câu có đáp án · {result.summary.needsReview} câu cần kiểm tra ·
              xử lý trong {(result.timings.totalMs / 1000).toFixed(1)} giây
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionButton onClick={() => onCopy('key')} icon={copied === 'key' ? Check : Copy} label={copied === 'key' ? 'Đã sao chép' : 'Sao chép đáp án'} />
            <ActionButton onClick={() => onCopy('full')} icon={copied === 'full' ? Check : ClipboardList} label={copied === 'full' ? 'Đã sao chép' : 'Sao chép kèm giải thích'} />
            <ActionButton onClick={onDownload} icon={Download} label="Tải xuống (.txt)" />
            <ActionButton onClick={onReset} icon={RotateCcw} label="Phân tích đề khác" primary />
          </div>
        </div>

        {result.warnings.length > 0 && (
          <ul className="mt-4 space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            {result.warnings.map((w) => (
              <li key={w} className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Bảng đáp án — bấm để cuộn tới câu */}
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Bảng đáp án</p>
          <div className="flex flex-wrap gap-2">
            {result.questions.map((q) => (
              <a
                key={q.number}
                href={`#quiz-q-${q.number}`}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                  q.status === 'failed' || q.answer === null
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : q.needsReview
                      ? 'border-amber-200 bg-amber-50 text-amber-800'
                      : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-indigo-300'
                }`}
              >
                {q.number}. {q.answer === null ? '?' : q.options.length ? q.answer : q.answer.length > 24 ? `${q.answer.slice(0, 24)}…` : q.answer}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Từng câu hỏi */}
      {result.questions.map((q) => {
        const contextText = q.contextId && !shownContexts.has(q.contextId) ? contextById.get(q.contextId) : undefined;
        if (q.contextId) shownContexts.add(q.contextId);
        const confidence = CONFIDENCE_LABEL[q.confidence];
        return (
          <React.Fragment key={q.number}>
            {contextText && (
              <div className="whitespace-pre-line rounded-2xl border border-indigo-100 bg-indigo-50/60 px-5 py-4 text-sm text-slate-700">
                {contextText}
              </div>
            )}
            <div id={`quiz-q-${q.number}`} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-indigo-700">Câu {q.number}</span>
                {q.sourceNumber !== q.number && <span className="text-xs text-slate-400">(số {q.sourceNumber} trong đề)</span>}
                {q.answer !== null && (
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${confidence.className}`}>{confidence.text}</span>
                )}
                {q.needsReview && (
                  <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    <CircleHelp className="h-3 w-3" /> Cần kiểm tra lại
                  </span>
                )}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm font-medium text-slate-900">{q.question || '(Không đọc được nội dung câu hỏi)'}</p>

              {q.options.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {q.options.map((o) => {
                    const correct = o.label === q.answer;
                    return (
                      <li
                        key={o.label}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                          correct ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-800' : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="w-5 font-bold">{o.label}.</span>
                        <span className="flex-1">{o.text}</span>
                        {correct && <CircleCheck className="h-4 w-4 text-emerald-600" />}
                      </li>
                    );
                  })}
                </ul>
              )}

              <div
                className={`mt-3 rounded-xl px-4 py-3 text-sm ${
                  q.answer === null ? 'border border-rose-200 bg-rose-50 text-rose-800' : 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                }`}
              >
                <p className="font-bold">Đáp án: {answerLabel(q)}</p>
                {q.alternatives.length > 0 && <p className="mt-1 text-xs">Đáp án khác có thể chấp nhận: {q.alternatives.join(', ')}</p>}
                {q.explanation && (
                  <p className="mt-1 text-slate-700">
                    <span className="font-semibold">Giải thích:</span> {q.explanation}
                  </p>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      <button
        type="button"
        onClick={onReset}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <RotateCcw className="h-4 w-4" /> Phân tích một đề khác
      </button>
    </div>
  );
};

const ActionButton: React.FC<{ onClick: () => void; icon: React.ElementType; label: string; primary?: boolean }> = ({
  onClick,
  icon: Icon,
  label,
  primary,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
      primary ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
    }`}
  >
    <Icon className="h-4 w-4" />
    {label}
  </button>
);

export default QuizSolverPage;
