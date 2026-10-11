# 12 — AI chấm bài viết (AI Writing Evaluation)

Phân tích sâu 2 chức năng chấm bài bằng AI trong hệ thống: chấm **câu** (Sentence Writing) và chấm **đoạn văn** (Paragraph Writing). Cả hai dùng chung kiến trúc mô tả ở [11-ai-system.md](11-ai-system.md), khác nhau ở prompt, schema Zod, và model lưu trữ.

## A. Chấm câu (Sentence Writing) — `aiService.evaluateWriting()`

### Input AI thực sự nhận được là gì?

Đúng những field trong interface `IEvaluationInput` ([ai.interface.ts](../../src/modules/ai/ai.interface.ts)) — không hơn không kém:

```ts
interface IEvaluationInput {
  vietnameseSentence: string;   // đề bài tiếng Việt
  referenceAnswer: string;      // đáp án chuẩn (lấy từ DB, chỉ ở server)
  alternativeAnswers?: string[]; // các đáp án tương đương khác
  userAnswer: string;           // câu trả lời của học viên
  level: string;                // cấp độ CEFR của câu hỏi
  topic?: string;                // chủ đề
  grammarTopic?: string;         // chủ điểm ngữ pháp trọng tâm
}
```

Không có: lịch sử làm bài trước đó của học viên, không có thông tin cá nhân khác của user, không có bất kỳ ngữ cảnh nào ngoài chính câu hỏi này.

### Reference answer được xử lý thế nào?

- **Có gửi xuống Frontend trước khi submit không?** **Không.** `writing.service.ts#getQuestionById(id, includeAnswers=false)` (nhánh mặc định của `GET /writing/questions/:id`) luôn destructure bỏ `referenceAnswer, alternativeAnswers` trước khi trả response — xác nhận ở cả nhánh Mongo lẫn nhánh in-memory. `WritingQuestionPage.tsx` còn ép kiểu TypeScript `Omit<WritingQuestion, 'referenceAnswer' | 'alternativeAnswers'>` để không thể vô tình đọc nhầm field này dù backend có lỗi.
- **Có gửi cho AI không?** **Có**, nhưng chỉ ở bước chấm bài (sau khi user đã submit), và chỉ để AI dùng làm **tham khảo** — prompt nói rõ đây "chỉ là MỘT cách dịch khả dĩ, không phải đáp án duy nhất" (xem mục 11.3).
- **Backend lấy reference answer từ đâu?** `writing.service.ts#submitAttempt` gọi lại `this.getQuestionById(data.questionId, true)` — tham số `true` là nhánh **có** đáp án, chỉ được gọi nội bộ trong service, không có route HTTP nào trả nhánh này ra ngoài trừ các route `admin/questions` (dành cho Admin).
- **User answer lấy từ đâu?** Trực tiếp từ `req.body.answer` hoặc `req.body.userAnswer` (client gửi cả 2 key để tương thích ngược, service lấy `data.answer || data.userAnswer`), `.trim()` trước khi dùng.

### Prompt nằm ở đâu?

`src/modules/ai/prompts/writing-evaluation.prompt.ts`, hàm `buildWritingEvaluationPrompt(input: IEvaluationInput): string`. Cấu trúc chi tiết đã mô tả ở [11-ai-system.md § 11.3](11-ai-system.md#113-prompt-engineering).

## B. Chấm đoạn văn (Paragraph Writing) — `aiService.evaluateParagraph()`

### Input

```ts
interface IParagraphEvaluationInput {
  instruction: string;      // đề bài (tiếng Việt nếu do AI sinh, tiếng Anh nếu Admin soạn)
  levelTier: "Beginner" | "Intermediate" | "Advanced";
  minWords: number;
  maxWords: number;
  requirements?: string[];  // yêu cầu cụ thể bổ sung
  userAnswer: string;       // đoạn văn của học viên
}
```

Không có "reference answer" khái niệm cho đoạn văn — Paragraph Writing không có đáp án chuẩn cố định (một đoạn văn đúng đề có thể có vô số cách viết hợp lệ), nên model `ParagraphTopic` không có field đáp án nào để bảo vệ.

### Prompt

`src/modules/ai/prompts/paragraph-evaluation.prompt.ts`, hàm `buildParagraphEvaluationPrompt()`. Chấm theo **7 tiêu chí** thay vì 5 (xem mục Scoring bên dưới), yêu cầu AI đọc toàn bộ đoạn văn trước rồi mới chấm từng tiêu chí độc lập, và sinh thêm `correctedSuggestion` — một bản viết lại hoàn chỉnh của chính đoạn văn học viên (sửa lỗi, giữ văn phong/ý gốc).

## Chấm điểm (Scoring) — chi tiết theo đúng những gì prompt/schema thực sự dùng

### Sentence Writing — 5 tiêu chí

Từ `writing-evaluation.prompt.ts`, Rule 6 nêu trọng số **định hướng** cho AI khi chấm:

```text
Grammar (Ngữ pháp):            ~40%
Vocabulary (Từ vựng):          ~20%
Meaning (Ý nghĩa):              ~20%
Sentence Structure (Cấu trúc): ~10%
Naturalness (Tự nhiên):         ~10%
Total:                          100
```

`scoreBreakdown` trả về cho Frontend được provider gộp lại từ 5 field điểm con AI tự chấm (`grammarAnalysis.score`, `vocabularyAnalysis.score`, `meaningAnalysis.score`, `structureAnalysis.score`, `naturalnessAnalysis.score`).

AI trả điểm tổng `score` và 5 điểm chỉ tiêu độc lập với nhau nên hai loại điểm từng lệch (ví dụ tổng 55 trong khi điểm theo trọng số chỉ khoảng 15). Vì vậy `ai.service.ts#reconcileScoreWithCriteria` **tính lại điểm tổng** sau khi provider AI trả kết quả:

```text
weighted = round(grammar*0.4 + vocabulary*0.2 + meaning*0.2 + sentenceStructure*0.1 + naturalness*0.1)
score    = min(score AI trả về, weighted)
```

Điểm tổng không bao giờ cao hơn điểm AI tự chấm, nên lỗi nằm ngoài 5 chỉ tiêu (ví dụ lỗi chính tả khi cả 5 chỉ tiêu vẫn 100) vẫn bị trừ. Điểm của `HeuristicProvider` được giữ nguyên. `status` không bị tính lại. Chi tiết: [11-ai-system.md § 11.6](11-ai-system.md#116-điểm-chấm-câu-chỉ-tiêu-và-điểm-tổng).

Điểm chỉ tiêu vẫn do AI chấm nên có thể dao động giữa các lần chấm cùng một câu; để giảm dao động, lời gọi chấm bài trên Groq/OpenRouter đặt `temperature` thấp (mặc định 0.2).

### Paragraph Writing — 7 tiêu chí

Từ `paragraph-evaluation.prompt.ts` — **không có trọng số % nào được nêu trong prompt** (khác Sentence Writing), AI chấm `overallScore` một cách toàn diện dựa trên 7 khía cạnh được mô tả:

```text
Content (Nội dung) — có bám sát yêu cầu đề bài không
Organization (Bố cục) — có câu chủ đề, câu triển khai, kết luận hợp lý
Coherence (Liên kết) — mạch ý có trôi chảy, dùng từ nối hợp lý
Grammar (Ngữ pháp)
Vocabulary (Từ vựng)
Sentence Structure (Cấu trúc câu)
Naturalness (Tự nhiên)
```

### Quy trình chấm → lưu → trả về (chung cho cả 2 loại)

```text
AI tính điểm (theo prompt, trả JSON)
↓
Backend (provider đang được thử: Gemini → Groq → OpenRouter) nhận JSON thô
↓
Validate bằng Zod schema (EvaluationSchema / ParagraphEvaluationSchema) — sai shape thì coi là lỗi, KHÔNG dùng dữ liệu sai
↓
Convert/normalize — map sang kiểu nội bộ chuẩn (IEvaluationResult / IParagraphEvaluationResult)
↓
ai.service.ts gắn `provider` (tên provider thật sự đã chấm) và, với chấm câu, đối chiếu điểm tổng với 5 chỉ tiêu
↓
Service lưu vào database:
  - Sentence: WritingAttemptModel.create() + WritingErrorModel.insertMany() + cập nhật User.totalWriting/averageScore/streak (streak theo ngày liên tiếp)
  - Paragraph: $push vào ParagraphAttempt.revisions[] (giữ tối đa 30 bản), cập nhật currentUserAnswer/currentScore
↓
Trả nguyên object evaluation về Frontend
```

## AI Output — JSON schema thật (không phải ví dụ giả định)

### Sentence Writing — đúng theo `EvaluationSchema` (Zod, định nghĩa trong `gemini.provider.ts` và dùng chung cho Groq/OpenRouter), khớp với prompt

```json
{
  "isCorrect": true,
  "status": "correct | partially_correct | incorrect",
  "score": 0,
  "summary": "1-2 câu tiếng Việt, riêng cho câu trả lời này",
  "meaningAnalysis": { "score": 0, "correct": true, "feedback": "tiếng Việt" },
  "grammarAnalysis": { "score": 0, "feedback": "tiếng Việt" },
  "vocabularyAnalysis": { "score": 0, "feedback": "tiếng Việt" },
  "structureAnalysis": { "score": 0, "feedback": "tiếng Việt" },
  "naturalnessAnalysis": { "score": 0, "feedback": "tiếng Việt" },
  "errors": [
    {
      "type": "GRAMMAR | VOCABULARY | SPELLING | WORD_CHOICE | WORD_FORM | WORD_ORDER | MISSING_WORD | EXTRA_WORD | COLLOCATION | ARTICLE | PREPOSITION | TENSE | SUBJECT_VERB_AGREEMENT | SENTENCE_STRUCTURE | MEANING | NATURALNESS | PUNCTUATION",
      "category": "nhãn phụ ngắn",
      "severity": "minor | major",
      "wrongText": "đúng nguyên văn từ câu trả lời của học viên",
      "correctText": "cách sửa",
      "explanation": "tiếng Việt, cụ thể, có tính sư phạm"
    }
  ],
  "correctAnswer": "bản sửa tự nhiên NHẤT dựa trên chính câu của học viên",
  "alternativeAnswers": ["0-3 cách diễn đạt khác"],
  "strengths": ["1-3 điểm làm tốt, cụ thể"],
  "weaknesses": ["0-3 điểm yếu lặp lại"],
  "overallFeedback": "đoạn văn nhận xét tổng thể, tiếng Việt",
  "recommendations": ["2-3 gợi ý luyện tập cụ thể"]
}
```
Sau khi qua provider, hệ thống bổ sung thêm `scoreBreakdown { grammar, vocabulary, meaning, sentenceStructure, naturalness }` và `provider`.

### Paragraph Writing — đúng theo `ParagraphEvaluationSchema` (Zod)

```json
{
  "overallScore": 0,
  "meetsRequirements": true,
  "content": { "score": 0, "feedback": "tiếng Việt" },
  "organization": { "score": 0, "feedback": "tiếng Việt" },
  "coherence": { "score": 0, "feedback": "tiếng Việt" },
  "grammar": { "score": 0, "feedback": "tiếng Việt" },
  "vocabulary": { "score": 0, "feedback": "tiếng Việt" },
  "sentenceStructure": { "score": 0, "feedback": "tiếng Việt" },
  "naturalness": { "score": 0, "feedback": "tiếng Việt" },
  "errors": [ "cùng shape với Sentence Writing ở trên" ],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "correctedSuggestion": "bản viết lại hoàn chỉnh của chính đoạn văn học viên",
  "overallFeedback": "tiếng Việt",
  "recommendations": ["..."]
}
```
Sau đó hệ thống tự thêm `wordCount` (đếm từ thật ở code, không tin số AI báo) và `provider`.

### Giải thích ý nghĩa từng field quan trọng

- `wrongText` / `correctText`: dùng để highlight lỗi trên UI (`ErrorViewer.tsx`) — prompt yêu cầu `wrongText` phải là **đúng nguyên văn substring** trong câu học viên để đảm bảo highlight chính xác.
- `severity`: `"major"` = lỗi làm sai/thay đổi nghĩa hoặc ngữ pháp mà người bản ngữ sẽ nhận ra ngay là sai; `"minor"` = lỗi nhỏ (một mạo từ, một giới từ, một lỗi gõ) không làm mất nghĩa.
- `correctAnswer` (Sentence) / `correctedSuggestion` (Paragraph): luôn là bản sửa **dựa trên chính câu/đoạn của học viên**, không phải chép nguyên `referenceAnswer` — nếu bài đã đúng hoàn toàn thì field này trùng với câu trả lời gốc.
- `provider`: tên provider đã thật sự chấm bài — `"gemini"`, `"groq"`, `"openrouter"` hoặc `"heuristic_fallback"`. Frontend chỉ hiển thị ghi chú "⚡ Chế độ dự phòng (không phải AI)" khi giá trị là `"heuristic_fallback"` (`PracticeResultPanel.tsx`, `ParagraphScorePanel.tsx`); với 3 provider AI còn lại không hiển thị nhãn nào. Giá trị này cũng được lưu vào `WritingAttempt.aiProvider` / `revisions[].aiProvider`.

Xem [11-ai-system.md § 11.5](11-ai-system.md#115-xử-lý-json-sai-và-retry) để biết điều gì xảy ra khi AI trả JSON sai/thiếu field/không phải JSON.
