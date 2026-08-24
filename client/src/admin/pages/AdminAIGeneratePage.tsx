import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, CheckCircle2, Loader2, Save, Sparkles, WandSparkles } from 'lucide-react';
import adminService from '../../services/adminService';
import { WritingQuestion } from '../../types';

const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
const difficulties = ['easy', 'medium', 'hard'] as const;
const grammarOptions = [
  'Present Simple', 'Present Continuous', 'Past Simple', 'Past Continuous',
  'Present Perfect', 'Future Simple', 'Be going to', 'Modal Verbs', 'Articles',
  'Prepositions', 'Comparatives', 'Superlatives', 'Conditionals', 'Passive Voice',
  'Relative Clauses', 'Reported Speech', 'Subject-Verb Agreement',
];

const generatorSchema = z.object({
  level: z.enum(levels),
  difficulty: z.enum(difficulties),
  grammarTopics: z.array(z.string()).min(1, 'Chọn ít nhất một ngữ pháp'),
  topicPrompt: z.string().trim().min(3, 'Nhập chủ đề ít nhất 3 ký tự').max(500, 'Chủ đề tối đa 500 ký tự'),
  numberOfQuestions: z.coerce.number().int().min(1).max(20),
});

type GeneratorForm = z.infer<typeof generatorSchema>;

const AdminAIGeneratePage: React.FC = () => {
  const [questions, setQuestions] = useState<WritingQuestion[]>([]);
  const [savedIndexes, setSavedIndexes] = useState<number[]>([]);
  const [notice, setNotice] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<GeneratorForm>({
    resolver: zodResolver(generatorSchema),
    defaultValues: { level: 'B1', difficulty: 'medium', grammarTopics: ['Past Simple'], topicPrompt: '', numberOfQuestions: 10 },
  });
  const selectedGrammars = watch('grammarTopics');
  const formValues = watch();

  const generateMutation = useMutation({
    mutationFn: adminService.generateQuestions,
    onSuccess: (result) => {
      setQuestions(result);
      setSavedIndexes([]);
      setNotice(`AI đã tạo ${result.length} câu hỏi để Admin kiểm tra.`);
      setError('');
    },
    onError: (generationError: any) => {
      setError(generationError.response?.data?.message || 'AI không thể tạo câu hỏi hợp lệ. Vui lòng thử lại.');
      setNotice('');
    },
  });

  const saveMutation = useMutation({
    mutationFn: adminService.saveGeneratedQuestions,
    onSuccess: (_, variables) => {
      const indexes = variables.map((item) => questions.findIndex((question) => question === item)).filter((index) => index >= 0);
      setSavedIndexes((current) => [...new Set([...current, ...indexes])]);
      setNotice(`Đã lưu ${variables.length} câu hỏi vào ngân hàng Writing.`);
      setError('');
    },
    onError: () => setError('Không thể lưu câu hỏi. Vui lòng thử lại.'),
  });

  const onSubmit = (data: GeneratorForm) => generateMutation.mutate(data);
  const saveOne = (question: WritingQuestion, index: number) => saveMutation.mutate([question]);
  const unsavedQuestions = questions.filter((_, index) => !savedIndexes.includes(index));

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-xl sm:px-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-cyan-300"><WandSparkles className="h-4 w-4" /> AI Writing Studio</div>
        <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">AI Writing Question Generator</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">Cấu hình bài luyện, xem trước câu hỏi và chỉ lưu những nội dung đã được Admin duyệt.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 text-lg font-bold"><Sparkles className="h-5 w-5 text-cyan-600" /> Cấu hình bài luyện</div>

          <fieldset><legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Trình độ CEFR</legend><div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {levels.map((level) => <button key={level} type="button" onClick={() => setValue('level', level)} className={`rounded-xl border px-3 py-2 text-sm font-bold ${formValues.level === level ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{level}</button>)}
          </div></fieldset>

          <fieldset><legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Độ khó</legend><div className="grid grid-cols-3 gap-2">
            {difficulties.map((difficulty) => <button key={difficulty} type="button" onClick={() => setValue('difficulty', difficulty)} className={`rounded-xl border px-3 py-2 text-xs font-bold capitalize ${formValues.difficulty === difficulty ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{difficulty}</button>)}
          </div></fieldset>

          <fieldset><legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600">Grammar muốn rèn luyện</legend><div className="grid max-h-48 gap-2 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
            {grammarOptions.map((grammar) => <label key={grammar} className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700"><input type="checkbox" value={grammar} {...register('grammarTopics')} className="h-4 w-4 accent-cyan-600" />{grammar}</label>)}
          </div>{errors.grammarTopics && <p className="mt-1 text-xs text-rose-600">{errors.grammarTopics.message}</p>}</fieldset>

          <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Chủ đề / Nội dung tự do</label><textarea rows={5} {...register('topicPrompt')} placeholder={'Ví dụ:\n- Du lịch Đà Nẵng cùng gia đình\n- Một ngày đi làm của tôi\n- Công nghệ AI trong giáo dục'} className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-cyan-500 focus:bg-white" />{errors.topicPrompt && <p className="mt-1 text-xs text-rose-600">{errors.topicPrompt.message}</p>}<p className="mt-2 text-xs text-slate-400">Mô tả càng cụ thể, AI càng tạo câu phù hợp.</p></div>

          <div><label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Số lượng câu</label><select {...register('numberOfQuestions')} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold">{[5, 10, 15, 20].map((count) => <option key={count} value={count}>{count} câu</option>)}</select></div>
          {error && <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
          <button type="submit" disabled={generateMutation.isPending} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-700 disabled:opacity-60"><Sparkles className="h-4 w-4" />{generateMutation.isPending ? 'AI đang tạo câu hỏi...' : 'Sinh câu hỏi'}</button>
        </form>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4"><div><h2 className="text-lg font-bold">Preview câu hỏi</h2><p className="text-xs text-slate-500">{questions.length ? `${questions.length} câu đã tạo` : 'Chưa có kết quả'}</p></div>{unsavedQuestions.length > 0 && <button type="button" onClick={() => saveMutation.mutate(unsavedQuestions)} disabled={saveMutation.isPending} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-60"><Save className="h-3.5 w-3.5" />Lưu tất cả</button>}</div>
          {notice && <div className="mb-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4 shrink-0" />{notice}</div>}
          {questions.length === 0 ? <div className="grid min-h-96 place-items-center text-center text-sm text-slate-400"><div><Sparkles className="mx-auto mb-3 h-10 w-10 text-slate-300" /><p>Nhập cấu hình để bắt đầu tạo preview.</p></div></div> : <div className="space-y-4">{questions.map((question, index) => <article key={`${question.vietnameseSentence}-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><div className="mb-2 flex items-start justify-between gap-3"><span className="text-xs font-black uppercase tracking-wider text-cyan-700">Câu {index + 1}</span>{savedIndexes.includes(index) ? <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700"><Check className="h-3.5 w-3.5" />Đã lưu</span> : <button type="button" onClick={() => saveOne(question, index)} disabled={saveMutation.isPending} className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[11px] font-bold text-emerald-700"><Save className="h-3 w-3" />Lưu câu này</button>}</div><p className="font-bold text-slate-900">{question.vietnameseSentence}</p><p className="mt-2 text-sm font-medium text-cyan-900">{question.referenceAnswer}</p><div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-bold"><span className="rounded bg-white px-2 py-1 text-slate-600">{question.level}</span><span className="rounded bg-white px-2 py-1 text-slate-600">{question.difficulty}</span><span className="rounded bg-white px-2 py-1 text-slate-600">{question.grammarTopic}</span></div></article>)}</div>}
        </section>
      </div>
    </div>
  );
};

export default AdminAIGeneratePage;