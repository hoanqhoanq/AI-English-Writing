# 13 — AI sinh đề (Paragraph, Sentence Writing và Quiz)

Phân tích riêng 3 chức năng AI sinh đề trong hệ thống: sinh **đề viết đoạn văn** (Paragraph Writing), sinh **câu hỏi Sentence Writing** (AI Writing) và sinh **quiz trắc nghiệm** (Grammar Quiz). Cả ba đi theo cùng khuôn mẫu ở [11-ai-system.md](11-ai-system.md) — phần này tập trung vào những gì AI thực sự sinh ra và cách backend lưu/trả về.

## A. Sinh đề viết đoạn văn (Paragraph Writing) — trọng tâm chính của file này

### Flow đầy đủ

```text
User chọn Topic (có sẵn hoặc gõ tự do) + Difficulty (easy/medium/hard)
↓
Frontend (ParagraphWritingPage.tsx) gửi POST /paragraph/generate { topic, difficulty }
↓
Backend validate (GenerateParagraphTopicSchema — Zod: topic 2-100 ký tự, difficulty enum)
↓
paragraph.service.ts#generateAIParagraphTopic:
  1. Map difficulty → { levelTier, minWords, maxWords } (bảng cố định, KHÔNG do AI quyết định — xem bên dưới)
  2. Lấy tối đa 5 đề AI đã sinh gần nhất (cùng user, cùng topic, cùng levelTier) làm excludePrompts
  3. Gọi aiService.generateParagraphPrompt({ topic, difficulty, levelTier, minWords, maxWords, excludePrompts })
↓
aiService thử lần lượt Gemini → Groq → OpenRouter → Heuristic (xem 11-ai-system.md)
↓
Backend parse response, lưu thành ParagraphTopic mới (source: "ai_user_generated", createdBy: userId)
↓
Return { topicId, promptVi, topic, difficulty, minWords, maxWords, requirements }
↓
Frontend navigate(/paragraph-writing/:topicId) → hiển thị đề, học viên viết đoạn văn tiếng Anh
```

### Input AI thực sự nhận được

```ts
interface IGenerateParagraphPromptInput {
  topic: string;              // chủ đề, do user chọn/gõ
  difficulty: "easy" | "medium" | "hard";
  levelTier: "Beginner" | "Intermediate" | "Advanced";  // suy ra từ difficulty
  minWords: number;
  maxWords: number;
  excludePrompts?: string[];  // các đề gần đây, để tránh lặp
}
```

### Word count / độ khó — do đâu quyết định?

**KHÔNG phải do AI tự chọn** — bảng ánh xạ cố định trong [paragraph-difficulty.constants.ts](../../src/modules/paragraph/paragraph-difficulty.constants.ts):

```ts
easy:   { levelTier: "Beginner",     minWords: 50,  maxWords: 70  }
medium: { levelTier: "Intermediate", minWords: 80,  maxWords: 120 }
hard:   { levelTier: "Advanced",     minWords: 120, maxWords: 180 }
```

AI chỉ được yêu cầu **viết đề bài sao cho phù hợp** với khoảng từ và độ khó đã cho sẵn này (nêu rõ trong Vietnamese instruction mà AI phải sinh), không tự quyết định số từ.

### Prompt nằm ở đâu, cấu trúc thế nào?

[paragraph-generation.prompt.ts](../../src/modules/ai/prompts/paragraph-generation.prompt.ts), hàm `buildParagraphGenerationPrompt()`. Điểm đặc biệt so với các prompt khác:

- **CRITICAL LANGUAGE RULE**: ép buộc field `promptVi` phải viết **hoàn toàn bằng tiếng Việt** (kể cả khi topic/difficulty là tiếng Anh) — nêu rõ "Do NOT write promptVi in English", cấm chèn câu mẫu/đáp án mẫu bằng bất kỳ ngôn ngữ nào vào đề bài.
- Có bảng `DIFFICULTY_GUIDANCE` mô tả bằng tiếng Anh cách đề bài nên phức tạp tới đâu theo từng độ khó (easy = mô tả đơn giản không cần lý do/so sánh; medium = cần giải thích/ví dụ; hard = cần lập luận, so sánh, quan điểm cá nhân).
- Có 3 ví dụ mẫu văn phong ngay trong prompt (easy/medium/hard) để AI bắt chước giọng văn, không copy nguyên văn.
- Có bước **tự kiểm tra** ngay trong prompt: "SELF-CHECK BEFORE RETURNING: re-read your own promptVi value. If any part of it is written in English..., rewrite that part in Vietnamese."

### Backend kiểm tra thêm gì ngoài prompt? (guard code, không chỉ dựa vào lời dặn trong prompt)

`generateParagraphPrompt` của `gemini.provider.ts` và `openai-compatible.provider.ts` (Groq/OpenRouter) đều có một bước kiểm tra **bằng code**, không tin tưởng hoàn toàn vào việc AI làm đúng lời dặn: hàm `looksVietnamese()` đếm số ký tự có dấu tiếng Việt trong `promptVi` bằng regex (`VIETNAMESE_DIACRITICS_REGEX`), yêu cầu tối thiểu **4 ký tự có dấu** mới coi là hợp lệ. Nếu không đạt, provider coi như response không hợp lệ và **thử lại** (tối đa 3 lần), giống hệt cách xử lý một JSON lỗi; hết lần thì `aiService` chuyển sang provider kế tiếp. Đây là ví dụ cụ thể cho nguyên tắc "không chỉ dặn AI trong prompt mà còn phải kiểm chứng bằng code".

### AI Output — JSON schema thật, theo `GeneratedParagraphPromptSchema` (Zod)

```json
{
  "promptVi": "Hãy viết một đoạn văn từ 80-120 từ bằng tiếng Anh về sở thích của bạn. Hãy giải thích sở thích đó là gì, tại sao bạn yêu thích nó và nó mang lại lợi ích gì cho bạn.",
  "requirements": []
}
```

- `promptVi`: đề bài hoàn chỉnh, bằng tiếng Việt, tự nêu rõ số từ yêu cầu bằng ngôn ngữ tự nhiên.
- `requirements`: mảng 0-4 gạch đầu dòng bổ sung (tùy chọn — prompt khuyến khích để trống nếu `promptVi` đã đủ rõ ràng, đây là trường hợp phổ biến).

Backend **không** sinh reference answer/criteria/vocabulary/grammar nào kèm theo đề — vì Paragraph Writing không có khái niệm đáp án chuẩn (xem [12-ai-writing-evaluation.md](12-ai-writing-evaluation.md), phần B). Đề được lưu thẳng thành document `ParagraphTopic` mới, y hệt một đề do Admin tự soạn tay, chỉ khác `source: "ai_user_generated"`.

## B. Sinh câu hỏi Sentence Writing (AI Writing) — tóm tắt, cùng khuôn mẫu

Dùng bởi cả [PracticePage.tsx](../../client/src/user/pages/PracticePage.tsx) (trang độc lập) và tab "AI Writing" trong [LearningTopicPage.tsx](../../client/src/user/pages/LearningTopicPage.tsx) (giới hạn theo thì đang học) — cả hai đều gọi `POST /learning/ai-writing/generate` → `learning.service.ts#generateAIWritingQuestion` → `aiService.generateQuestions()`.

- **Input**: `IGenerateQuestionsInput { level, difficulty, grammarTopics: string[], topicPrompt, numberOfQuestions, excludePrompts? }`.
- **Prompt**: [writing-generation.prompt.ts](../../src/modules/ai/prompts/writing-generation.prompt.ts) — yêu cầu AI sinh **đúng N câu hỏi** (ở flow AI Writing, `numberOfQuestions` luôn là `1`), mỗi câu gồm cả đề tiếng Việt, đáp án chuẩn, 2-3 đáp án tương đương, và `keywords` (2-4 từ khóa quan trọng — dùng lại làm gợi ý từ vựng, xem [06-user-features.md](06-user-features.md) mục Hint System).
- **Guard code**: `generateWritingQuestions()` của mỗi provider AI kiểm tra `validated.questions.length !== params.numberOfQuestions` → nếu số lượng câu trả về không đúng yêu cầu, ném lỗi (kích hoạt provider kế tiếp / fallback) — một guard bằng code khác, tương tự `looksVietnamese()`.
- **Lưu trữ**: câu hỏi AI sinh được lưu thẳng vào `WritingQuestionModel` (`source: "ai_user_generated"`) — trở thành một câu hỏi thật trong hệ thống, có thể được chấm bài qua đúng API `POST /writing/attempts` dùng chung với Question Bank, **không có** hệ thống chấm điểm riêng cho câu hỏi AI sinh.
- **Response về Frontend**: chỉ `{questionId, promptVi, tense, tenseVi, topic, topicVi, level, difficulty}` — không có đáp án, giống hệt nguyên tắc bảo mật ở [12-ai-writing-evaluation.md](12-ai-writing-evaluation.md).

## C. Sinh Quiz trắc nghiệm (Grammar Quiz)

Dùng bởi [GrammarQuizPage.tsx](../../client/src/user/pages/GrammarQuizPage.tsx) → `POST /quiz/generate` → `quiz.service.ts#generateQuiz` → `aiService.generateQuiz()` → `provider.generateQuizQuestions()`. Module này chỉ chạy khi có MongoDB.

- **Input**: `IGenerateQuizInput { difficulty (A1–C2), grammarTopics: string[], topic, questionCount (10–50), perTenseTargets?, excludeQuestions? }`.
- **Chia số câu theo thì**: `buildDistributionPlan()` ([quiz.utils.ts](../../src/modules/quiz/quiz.utils.ts)) chia đều `questionCount` cho các thì đã chọn (thì nào dư thì được +1, chọn ngẫu nhiên). Nếu số câu ít hơn số thì thì chỉ chọn ngẫu nhiên bấy nhiêu thì, mỗi thì 1 câu. Bảng này do code quyết định, không do AI.
- **Prompt**: [quiz-generation.prompt.ts](../../src/modules/ai/prompts/quiz-generation.prompt.ts) — nhận `perTenseTargets` (số câu cần cho từng thì) và `excludeQuestions` (các câu đã được nhận ở vòng trước).
- **Output theo `GeneratedQuizSchema`**: mỗi câu gồm `question`, `options` (đúng 4 đáp án), `correctAnswer` (chỉ số 0–3), `explanation`, `tense`, `difficulty`, `topic`.
- **Guard ở provider**: số câu trả về phải đúng số yêu cầu; không được có 2 câu trùng nhau (so sánh chuẩn hóa chữ thường).
- **Sinh bù nhiều vòng** (`generateValidatedQuestions`, tối đa `MAX_GENERATION_ROUNDS = 3` vòng): mỗi câu AI trả về được kiểm tra — thì phải nằm trong tập thì đã yêu cầu; không trùng chính xác với câu đã nhận (áp dụng cho **mọi** provider, kể cả Heuristic); không gần trùng (độ tương đồng Jaccard ≥ 0.65) với câu đã nhận (bỏ qua bước này với Heuristic vì các mẫu câu của nó vốn khác nhau). Số câu còn thiếu theo từng thì được yêu cầu lại ở vòng sau. Hết 3 vòng vẫn thiếu thì ném lỗi "AI không thể tạo đủ N câu hỏi hợp lệ (không trùng lặp)...", không trả bài quiz thiếu câu. Thứ tự câu cuối cùng được xáo trộn.
- **Lưu trữ và bảo mật đáp án**: bài quiz được lưu thành `QuizAttempt` (`status: "generated"`) cùng đáp án đúng và giải thích. Response gửi về Frontend **không có** `correctAnswer`/`explanation`; chỉ sau khi nộp bài (`POST /quiz/:quizId/submit`) mới trả các trường này.
- **Chất lượng khi AI lỗi**: `HeuristicProvider` chỉ có một số ít mẫu câu cố định cho mỗi thì nên có thể không đủ số câu yêu cầu; khi đó quiz báo lỗi thay vì trả câu lặp.

## Điểm chung cần nhớ

Các chức năng sinh đề trong file này đều: (1) chỉ được gọi khi **user chủ động bấm nút** (không bao giờ tự động chạy nền), (2) tự động tránh lặp bằng `excludePrompts` (đề câu/đoạn văn) hoặc `excludeQuestions` (quiz), (3) lưu kết quả AI sinh ra thành document thật trong database (không phải dữ liệu tạm), (4) không bao giờ gửi đáp án kèm nội dung đề trước khi user nộp bài.
