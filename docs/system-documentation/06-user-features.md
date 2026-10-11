# 06 — Chức năng User (User Features)

Ghi chú kiến trúc áp dụng cho toàn bộ file này: User Portal dùng `@tanstack/react-query` ở phần lớn trang có gọi API (Practice, WritingQuestionPage, ParagraphWritingPage/ParagraphTopicPage, LearningHomePage/LearningTopicPage/LearningProgressPage, GrammarQuizPage, AnalyticsPage) nhưng **không phải tất cả** — QuestionBankPage vẫn dùng `useState`+`useEffect`+gọi `api` trực tiếp (chưa migrate sang React Query). Cả hai cách đều gọi chung một instance `axios` ([client/src/services/api.ts](../../client/src/services/api.ts)).

---

## Luyện viết câu bằng AI (AI Writing / Practice)

### Mục đích
Người học nhập chủ đề tự do, chọn cấp độ CEFR và thì ngữ pháp muốn luyện → AI sinh một đề câu tiếng Việt phù hợp → người học viết câu trả lời tiếng Anh → AI chấm điểm và giải thích lỗi.

### User flow
```text
User (điền chủ đề + cấp độ + thì)
 ↓
PracticePage.tsx (form)
 ↓ POST /learning/ai-writing/generate
learning.controller.ts → learning.service.ts#generateAIWritingQuestion
 ↓
aiService.generateQuestions() → thử Gemini → Groq → OpenRouter, cuối cùng mới là Heuristic
 ↓
Lưu WritingQuestion mới (source: "ai_user_generated") → trả về promptVi (KHÔNG có đáp án)
 ↓
User viết câu trả lời → Submit
 ↓ POST /writing/attempts
writing.service.ts#submitAttempt → aiService.evaluateWriting()
 ↓
Lưu WritingAttempt + WritingError[], cập nhật User.totalWriting/averageScore/streak
 ↓
Trả evaluation về Frontend → PracticeResultPanel hiển thị điểm/lỗi/gợi ý
 ↓
queryClient.invalidateQueries(['analytics','overview']) + refreshUser() → Dashboard/Analytics cập nhật ngay, không cần F5
```

### Frontend
- **Page**: [PracticePage.tsx](../../client/src/user/pages/PracticePage.tsx), route `/practice`
- **Component**: `PracticeResultPanel`, `ErrorViewer`, `ScoreBadge`
- **Hook**: `useQuery` (danh sách gợi ý chủ đề, danh sách thì từ `learning/topics`), `useMutation` (generate)
- **Context**: `useAuth()` → `refreshUser()`
- **Service**: `services/api.ts`

### Backend
- **Route**: `learning.route.ts` (`POST /ai-writing/generate`), `writing.route.ts` (`POST /attempts`)
- **Controller**: `learning.controller.ts#generateAIWritingQuestion`, `writing.controller.ts#submitAttempt`
- **Service**: `learning.service.ts#generateAIWritingQuestion`, `writing.service.ts#submitAttempt`
- **Model**: `WritingQuestionModel`, `WritingAttemptModel`, `WritingErrorModel`, `UserModel`
- **Middleware**: `authenticate`, `aiRateLimiter(60)` (giới hạn 60 request/phút/user cho `/attempts`)

### Database
`writing_questions` (câu hỏi AI sinh ra được lưu như câu hỏi thật, gắn `source: "ai_user_generated"`, `createdBy: userId`), `writing_attempts`, `writing_errors`, `users` (cập nhật streak/totalWriting/averageScore).

### Logic xử lý
1. Backend tra `learning-topics` theo `tenseSlug` để lấy tên thì (`title`) làm `grammarTopics` cho prompt AI.
2. Lấy tối đa 5 câu tiếng Việt AI đã sinh gần nhất (cùng user, cùng thì, cùng chủ đề) làm `excludePrompts` để AI không lặp đề.
3. Gọi `aiService.generateQuestions()` — thử lần lượt các provider AI đã cấu hình (Gemini → Groq → OpenRouter), tự động rơi về Heuristic nếu tất cả đều lỗi (xem [11-ai-system.md](11-ai-system.md)).
4. Câu hỏi AI sinh được lưu thẳng vào `WritingQuestionModel` (không phải bảng tạm) — nghĩa là nó tồn tại như một câu hỏi thật trong hệ thống, có thể tra cứu lại.
5. Response về Frontend **chỉ** gồm `questionId, promptVi, tense, tenseVi, topic, topicVi, level, difficulty` — không có `referenceAnswer`/`alternativeAnswers`.
6. Khi Submit, `writing.service.ts#submitAttempt` gọi lại `getQuestionById(id, true)` (bản đầy đủ, có đáp án) ở phía server để lấy `referenceAnswer` đưa cho AI chấm — đáp án không bao giờ đi qua Frontend trước khi nộp bài.
7. Kết quả hiển thị bằng `PracticeResultPanel`: điểm tổng, 5 điểm chỉ tiêu, danh sách lỗi, câu sửa của AI, điểm tốt/khuyên luyện tập. Nút "Sửa lại & Nộp lại" cho phép nộp lại cùng câu hỏi; từ lần thứ 2 có panel "So sánh với lần trước" và, nếu câu hỏi thuộc một trong 12 thì, các nút "Ôn lại" / "Quiz" cho thì đó (xem [14](14-writing-workflow.md)). Ghi chú "Chế độ dự phòng (không phải AI)" chỉ hiện khi kết quả do Heuristic chấm.

---

## Xem Ngân hàng câu hỏi (Question Bank)

### Mục đích
Duyệt/tìm kiếm kho câu hỏi có sẵn (đã biên soạn bởi Admin hoặc AI sinh trước đó), lọc theo chủ đề và cấp độ.

### User flow
```text
User mở /questions
 ↓
QuestionBankPage.tsx: useEffect → Promise.all(GET /writing/questions, GET /topics, GET /grammar)
 ↓
Lọc client-side theo searchTerm/selectedTopic/selectedLevel
 ↓
User bấm "Luyện câu này"
 ↓
navigate(`/writing/question/${q._id}`)
```

### Frontend
- **Page**: [QuestionBankPage.tsx](../../client/src/user/pages/QuestionBankPage.tsx), route `/questions`
- **Component**: `PronounceButton` (phát âm đáp án chuẩn)

### Backend
- **Route**: `writing.route.ts` (`GET /questions`), `topic.route.ts` (`GET /topics`, `GET /grammar`)
- **Service**: `writing.service.ts#getQuestions` — luôn `.select("-referenceAnswer -alternativeAnswers")` ở nhánh Mongo, và ở nhánh in-memory chỉ map ra các field an toàn (không copy nguyên object).

### Database
`writing_questions` (chỉ đọc, lọc `isActive: true`).

---

## Làm bài trực tiếp một câu hỏi (Question → Answer trực tiếp)

Đây là flow được sửa trong một phiên làm việc trước: trước đây bấm "Luyện câu này" bị điều hướng nhầm sang trang cấu hình AI-topic; nay điều hướng thẳng tới trang trả lời đúng câu đã chọn.

### Mục đích
Trả lời đúng 1 câu hỏi cụ thể từ Question Bank, có thể xem gợi ý (không lộ đáp án) trước khi nộp bài.

### User flow
```text
User bấm "Luyện câu này" ở Question Bank
 ↓
navigate(/writing/question/:questionId)
 ↓
WritingQuestionPage.tsx: useQuery GET /writing/questions/:id (đã lược bỏ đáp án + kèm hints)
 ↓
User (tùy chọn) mở card "Gợi ý" → xem Gợi ý từ vựng / Gợi ý ngữ pháp
 ↓
User viết câu trả lời → Submit
 ↓ POST /writing/attempts { questionId, answer }
writing.service.ts#submitAttempt → aiService.evaluateWriting()
 ↓
PracticeResultPanel hiển thị kết quả
 ↓
queryClient.invalidateQueries(['analytics','overview']) + refreshUser()
```

### Frontend
- **Page**: [WritingQuestionPage.tsx](../../client/src/user/pages/WritingQuestionPage.tsx), route `/writing/question/:questionId`
- **Hook**: `useQuery(['writing','question',questionId])`, `useMutation` (submit)
- **Type an toàn**: `SafeWritingQuestion = Omit<WritingQuestion, 'referenceAnswer' | 'alternativeAnswers'>` — TypeScript ép buộc component không thể vô tình đọc field đáp án dù backend có lỡ trả về.

### Backend
- **Route**: `writing.route.ts` (`GET /questions/:id`, `POST /attempts`)
- **Service**: `writing.service.ts#getQuestionById(id, includeAnswers=false)` → gọi `buildSafeHints()` để đính kèm hints trước khi trả về.

### Database
`writing_questions`, `writing_attempts`, `writing_errors`.

### Bảo mật đáp án (đối chiếu yêu cầu)
`getQuestionById(id, false)` — nhánh mặc định mọi request từ Frontend trước khi nộp bài — luôn destructure bỏ `referenceAnswer, alternativeAnswers` khỏi object trả về (cả nhánh Mongo lẫn in-memory), xác nhận: **đáp án không bao giờ được gửi xuống Frontend trước khi user submit**.

---

## Hệ thống Gợi ý (Hint System)

### Mục đích
Hỗ trợ người học có ý tưởng/từ vựng/cấu trúc câu mà không lộ câu trả lời hoàn chỉnh.

### Nguồn dữ liệu
- **Gợi ý từ vựng**: ưu tiên `question.hints.vocabulary` (field mới, tùy chọn) nếu có; nếu chưa có, dùng lại field `keywords` đã tồn tại sẵn trên mỗi `WritingQuestion` (không hardcode riêng theo từng câu ở frontend).
- **Gợi ý ngữ pháp**: ưu tiên `question.hints.grammar` nếu có; nếu chưa có, tra bảng tĩnh theo `grammarTopic` trong [grammar-hints.constants.ts](../../src/modules/writing/grammar-hints.constants.ts) (18 chủ điểm ngữ pháp, khớp đúng tên các `GrammarTopic` đã seed) — một gợi ý cấu trúc chung cho *chủ điểm ngữ pháp*, không phải cho *câu trả lời cụ thể*.
- **Backend**: `writing.service.ts#buildSafeHints()`, chạy bên trong `getQuestionById(id, false)` — luôn tính hints ở đúng nhánh an toàn (không có đáp án), không có đường nào để hints bị tính từ đáp án thật.

### Frontend
Card "💡 Gợi ý" trong [WritingQuestionPage.tsx](../../client/src/user/pages/WritingQuestionPage.tsx), đặt giữa đề tiếng Việt và ô nhập câu trả lời, mặc định **gấp lại** (`showHints` state khởi tạo `false`), chỉ hiện khi có ít nhất 1 trong 2 loại gợi ý.

### Đối chiếu yêu cầu bảo mật
Không có field nào trong `hints` từng chứa nguyên văn một câu tiếng Anh hoàn chỉnh trong model (`hints.vocabulary: string[]` — mảng từ/cụm từ; `hints.grammar: string` — mô tả cấu trúc bằng tiếng Việt). Bảng tĩnh `GRAMMAR_STRUCTURE_HINTS` chỉ chứa mô tả quy tắc ngữ pháp chung (ví dụ "Cấu trúc: S + V(s/es) + O"), không gắn với bất kỳ câu hỏi cụ thể nào.

---

## Viết đoạn văn (Paragraph Writing)

### Mục đích
Luyện viết đoạn văn tiếng Anh hoàn chỉnh (không chỉ một câu), có AI sinh đề theo chủ đề/độ khó, AI chấm theo 7 tiêu chí, giữ lịch sử các lần sửa bài trên cùng một đề.

### User flow
```text
User mở /paragraph-writing
 ↓
ParagraphWritingPage.tsx: chọn chủ đề (Topic có sẵn hoặc gõ tự do) + độ khó (easy/medium/hard)
 ↓ POST /paragraph/generate { topic, difficulty }
paragraph.service.ts#generateAIParagraphTopic → aiService.generateParagraphPrompt()
 ↓
Lưu ParagraphTopic mới (source: "ai_user_generated") → trả topicId
 ↓
navigate(/paragraph-writing/:topicId)
 ↓
ParagraphTopicPage.tsx: GET /paragraph/topics/:id (đề bài), GET /paragraph/attempts/:topicId (bài đã lưu nếu có)
 ↓
User viết đoạn văn → Submit
 ↓ POST /paragraph/attempts { topicId, text }
paragraph.service.ts#submitAttempt → aiService.evaluateParagraph()
 ↓
Lưu 1 "revision" mới vào ParagraphAttempt.revisions[] (giữ tối đa 30 bản gần nhất), cập nhật currentUserAnswer/currentScore
 ↓
ParagraphScorePanel hiển thị điểm theo 7 tiêu chí + lỗi + bản sửa gợi ý
 ↓
invalidateQueries(['paragraph','attempt'], ['learning','overview'], ['analytics','overview']) + refreshUser()
```

### Frontend
- **Page**: [ParagraphWritingPage.tsx](../../client/src/user/pages/ParagraphWritingPage.tsx) (`/paragraph-writing`), [ParagraphTopicPage.tsx](../../client/src/user/pages/ParagraphTopicPage.tsx) (`/paragraph-writing/:topicId`)
- **Component**: `ParagraphScorePanel`, `ErrorViewer`, `ScoreBadge`, `PronounceButton`
- **Hook**: `useQuery`/`useMutation` (React Query)

### Backend
- **Route**: `paragraph.route.ts`
- **Controller/Service**: `paragraph.controller.ts`, `paragraph.service.ts`
- **Model**: `ParagraphTopicModel`, `ParagraphAttemptModel`
- **Middleware**: `authenticate`, `aiRateLimiter(60)` cho cả `/generate` và `/attempts`

### Database
`paragraph_topics`, `paragraph_attempts` (một document duy nhất mỗi cặp `userId+topicId`, `revisions[]` push-only bên trong — xem [09-database-design.md](09-database-design.md)).

### Lưu ý quan trọng
Module này **chỉ chạy khi có Mongo** (`assertMongo()` — xem [04](04-system-architecture.md)); không có nhánh in-memory. Lượt Paragraph Writing **không** cộng vào `User.totalWriting/averageScore/streak` (chỉ Sentence Writing mới cộng) — số liệu Paragraph có thống kê riêng qua `GET /paragraph/my-stats`.

---

## Writing Learning (Học lý thuyết theo chủ đề)

### Mục đích
19 chủ đề (12 thì ngữ pháp + 7 kỹ năng viết) học theo kiểu W3Schools — mọi chủ đề luôn mở, không khóa theo thứ tự, mỗi chủ đề có 5 tab: Learn / Examples / Practice / AI Writing / Progress.

### User flow
```text
User mở /learning
 ↓
LearningHomePage.tsx: GET /learning/topics (kèm % hoàn thành, độ chính xác luyện tập của user)
 ↓
User bấm vào 1 chủ đề → /learning/:category/:slug
 ↓
LearningTopicPage.tsx: GET /learning/topics/:slug (lý thuyết, ví dụ, lỗi thường gặp, danh sách bài luyện)
 ↓
Tab "Learn"/"Examples": chỉ đọc, tự động POST section-viewed khi mở (đánh dấu tiến độ)
Tab "Practice": chọn 1 câu trong danh sách → viết → POST /writing/attempts (dùng chung API Sentence Writing)
Tab "AI Writing": chọn chủ đề phụ → POST /learning/ai-writing/generate (giới hạn theo thì của trang này) → viết → POST /writing/attempts
Tab "Progress": chỉ đọc, % hoàn thành + độ chính xác + số lỗi thường gặp
```

### Frontend
- **Page**: [LearningHomePage.tsx](../../client/src/user/pages/LearningHomePage.tsx) (`/learning`), [LearningTopicPage.tsx](../../client/src/user/pages/LearningTopicPage.tsx) (`/learning/:category/:slug`), [LearningProgressPage.tsx](../../client/src/user/pages/LearningProgressPage.tsx) (`/learning/progress`)
- **Component**: `LearningTopicCard`, `MarkdownLite` (render lý thuyết dạng markdown rút gọn, không dùng `dangerouslySetInnerHTML`), `XPLevelBadge`, `PracticeResultPanel`

### Backend
- **Route**: `learning.route.ts`
- **Service**: `learning.service.ts` — `getTopics`, `getTopicDetail`, `markSectionViewed`, `getProgressOverview`, `generateAIWritingQuestion`

### Database
`learning_topics`, `learning_progress` (mỗi user × mỗi topic một document, `completedSections: string[]`), cộng dữ liệu tổng hợp từ `writing_attempts`, `writing_errors`, `paragraph_attempts`.

### Ghi chú
Đây là module duy nhất tính "XP" và "Level" gamification (`getProgressOverview`) — công thức: `xp = totalWriting*8 + (totalWriting*averageScore)/20 + completedTopics*100 + paragraphGoodAttempts*40`, `level = floor(sqrt(xp/100)) + 1`. Không lưu thành field cố định, tính lại mỗi lần gọi API.

---

## Trắc nghiệm ngữ pháp (Grammar Quiz)

### Mục đích
Luyện 12 thì tiếng Anh bằng bài trắc nghiệm 4 đáp án do AI sinh, chấm ở server, có giải thích sau khi nộp.

### User flow
```text
User mở /quiz (menu "Grammar Quiz", hoặc nút "Làm Quiz {thì}" ở trang chủ đề / kết quả chấm câu)
 ↓
GrammarQuizPage.tsx — giai đoạn "config": chọn cấp độ CEFR, một hoặc nhiều thì (hoặc tất cả), chủ đề, số câu (10/20/30/40/50)
 ↓ POST /quiz/generate
quiz.service.ts#generateQuiz → chia số câu theo thì → aiService.generateQuiz() (sinh bù tối đa 3 vòng, lọc câu trùng)
 ↓
Lưu QuizAttempt (status "generated", có đáp án đúng trong DB) → trả quizId + câu hỏi KHÔNG kèm đáp án
 ↓
Giai đoạn "quiz": làm từng câu, thanh tiến độ
 ↓ POST /quiz/:quizId/submit { answers: [{questionId, selectedAnswer}] }
quiz.service.ts#submitQuiz → chấm ở server, score = round(đúng/tổng × 100), status "completed"
 ↓
Giai đoạn "result": số câu đúng/sai, điểm, từng câu kèm đáp án đúng và giải thích
```

### Frontend
- **Page**: [GrammarQuizPage.tsx](../../client/src/user/pages/GrammarQuizPage.tsx), route `/quiz`. Nếu URL có `?tense=<slug>` (đi từ trang chủ đề hoặc kết quả chấm câu), thì đó được chọn sẵn một lần khi trang tải xong; người dùng vẫn đổi được lựa chọn.
- **Hook**: `useQuery` (danh sách thì từ `GET /learning/topics`, danh sách chủ đề từ `GET /topics`), `useMutation` (generate, submit).

### Backend
- **Route**: `quiz.route.ts` (`/api/quiz/*`, mọi endpoint cần đăng nhập; `generate` có `aiRateLimiter(20)`).
- **Service**: `quiz.service.ts` — `generateQuiz`, `submitQuiz`, `getHistory`, `getHistoryDetail`, `getQuizStats`.
- **Model**: `QuizAttemptModel` (collection `quizattempts`).

### Lưu ý
Module này **chỉ chạy khi có Mongo** (`assertMongo()`). Thống kê Quiz (`GET /quiz/stats`, `GET /quiz/history`) hiển thị ở trang Analytics. Chi tiết phần AI sinh câu: [13-ai-paragraph-generation.md § C](13-ai-paragraph-generation.md).

---

## Analytics & Chẩn đoán AI

Xem chi tiết đầy đủ (nguồn dữ liệu, công thức, cơ chế cập nhật không cần F5) tại [16-learning-and-analytics.md](16-learning-and-analytics.md). Chẩn đoán điểm yếu AI chỉ chạy khi học viên bấm "Chẩn đoán điểm yếu AI mới"; mở trang không tự gọi AI.

---

## Hồ sơ cá nhân (Profile)

### Mục đích
Đổi tên hiển thị và mục tiêu số câu luyện mỗi ngày.

### Frontend
[ProfilePage.tsx](../../client/src/user/pages/ProfilePage.tsx) (`/profile`) → `useAuth().updateUser()`

### Backend
`PUT /users/profile` → `user.service.ts#updateProfile` → `UserModel.findByIdAndUpdate`.
