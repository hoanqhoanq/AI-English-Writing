# 19 — Bản đồ trách nhiệm file (File Responsibility Map)

## Bảng 1: Chức năng → File

| Chức năng | Frontend | API | Backend (service chính) | Model | AI Prompt | Database |
|---|---|---|---|---|---|---|
| Đăng ký/Đăng nhập User | `SignIn.tsx`/`SignUp.tsx` | `POST /auth/login`/`register` | `auth.service.ts` | `User` | — | `users` |
| Đăng nhập Admin | `AdminLoginPage.tsx` | `POST /auth/admin/login` | `auth.service.ts` + `auth.controller.ts#adminLogin` | `User`, `RefreshTokenSession` | — | `users`, `refresh_token_sessions` |
| Ngân hàng câu hỏi | `QuestionBankPage.tsx` | `GET /writing/questions` | `writing.service.ts#getQuestions` | `WritingQuestion` | — | `writingquestions` |
| Làm bài 1 câu cụ thể | `WritingQuestionPage.tsx` | `GET /writing/questions/:id`, `POST /writing/attempts` | `writing.service.ts#getQuestionById`, `#submitAttempt` | `WritingQuestion`, `WritingAttempt`, `WritingError` | `writing-evaluation.prompt.ts` | `writingquestions`, `writingattempts`, `writingerrors` |
| AI Writing (sinh câu) | `PracticePage.tsx`, tab AI Writing trong `LearningTopicPage.tsx` | `POST /learning/ai-writing/generate` | `learning.service.ts#generateAIWritingQuestion` | `WritingQuestion`, `LearningTopic` | `writing-generation.prompt.ts` | `writingquestions`, `learningtopics` |
| AI chấm câu | (mọi trang submit Sentence Writing) | `POST /writing/attempts` | `writing.service.ts#submitAttempt` | `WritingAttempt`, `WritingError`, `User` | `writing-evaluation.prompt.ts` | `writingattempts`, `writingerrors`, `users` |
| Grammar Quiz — sinh & làm bài | `GrammarQuizPage.tsx` | `POST /quiz/generate`, `POST /quiz/:quizId/submit` | `quiz.service.ts#generateQuiz`, `#submitQuiz` (+ `quiz.utils.ts`) | `QuizAttempt` | `quiz-generation.prompt.ts` | `quizattempts` |
| Grammar Quiz — lịch sử & thống kê | `AnalyticsPage.tsx` | `GET /quiz/history`, `/quiz/history/:id`, `/quiz/stats` | `quiz.service.ts#getHistory`, `#getQuizStats` | `QuizAttempt` | — | `quizattempts` |
| So sánh các lần nộp của một câu | `PracticeResultPanel.tsx`, `AttemptComparisonPanel.tsx` | `GET /writing/attempts?questionId=` | `writing.service.ts#getHistory` | `WritingAttempt` | — | `writingattempts` |
| Viết đoạn văn — sinh đề | `ParagraphWritingPage.tsx` | `POST /paragraph/generate` | `paragraph.service.ts#generateAIParagraphTopic` | `ParagraphTopic` | `paragraph-generation.prompt.ts` | `paragraphtopics` |
| Viết đoạn văn — chấm | `ParagraphTopicPage.tsx` | `POST /paragraph/attempts` | `paragraph.service.ts#submitAttempt` | `ParagraphAttempt` | `paragraph-evaluation.prompt.ts` | `paragraphattempts` |
| Writing Learning (nội dung học) | `LearningHomePage.tsx`, `LearningTopicPage.tsx` | `GET /learning/topics(/:slug)` | `learning.service.ts#getTopics`/`getTopicDetail` | `LearningTopic`, `LearningProgress` | — | `learningtopics`, `learningprogresses` |
| Tiến độ học (XP/Level) | `LearningProgressPage.tsx` | `GET /learning/progress-overview` | `learning.service.ts#getProgressOverview` | nhiều model (tổng hợp) | — | nhiều collection |
| Thống kê cá nhân | `AnalyticsPage.tsx` | `GET /analytics/overview` | `analytics.service.ts#getOverview` | `WritingAttempt` | — | `writingattempts` |
| Chẩn đoán điểm yếu AI | `AnalyticsPage.tsx` | `GET`/`POST /analytics/ai-analysis` | `analytics.service.ts#performAIAnalysis` | `AIAnalysis` | `weakness-analysis.prompt.ts` | `aianalyses` |
| Hồ sơ cá nhân | `ProfilePage.tsx` | `GET`/`PUT /users/profile` | `user.service.ts#getProfile`/`updateProfile` | `User` | — | `users` |
| Admin — Quản lý người dùng | `AdminUsersPage.tsx` | `/users/*` | `user.service.ts` | `User` | — | `users` |
| Admin — Quản lý câu hỏi | `AdminQuestionsPage.tsx` | `/writing/admin/questions*` | `writing.service.ts` | `WritingQuestion` | — | `writingquestions` |
| Admin — Quản lý đề đoạn văn | `AdminParagraphTopicsPage.tsx` | `/paragraph/admin/topics*` | `paragraph.service.ts` | `ParagraphTopic` | — | `paragraphtopics` |
| Admin — Quản lý Writing Learning | `AdminLearningTopicsPage.tsx` | `/learning/admin/topics*` | `learning.service.ts` | `LearningTopic` | — | `learningtopics` |
| Admin — Cấp độ CEFR | `AdminLevelsPage.tsx` | `GET /topics/levels` | `topic.service.ts#getLevels` | — (hardcode) | — | (đếm từ `writingquestions`) |
| Admin — Lịch sử chấm bài hợp nhất | `AdminEvaluationsPage.tsx` | `/writing/admin/evaluations`, `/paragraph/admin/attempts` | `writing.service.ts#getAllAttemptsAdmin`, `paragraph.service.ts#getAllAttemptsAdmin` | `WritingAttempt`, `ParagraphAttempt` | — | `writingattempts`, `paragraphattempts` |
| Admin — Dashboard thống kê | `AdminOverviewPage.tsx` | `GET /analytics/admin/stats` | `analytics.service.ts#getSystemStats` | nhiều model | — | nhiều collection |

## Bảng 2: "Muốn sửa chức năng này thì sửa file nào?"

| Muốn thay đổi | File cần xem trước | File có thể cần sửa |
|---|---|---|
| Login (User) | `auth.service.ts`, `AuthContext.tsx` | `auth.controller.ts`, `SignIn.tsx` |
| Login (Admin) | `auth.controller.ts#adminLogin`, `AdminLoginPage.tsx` | `auth.route.ts` nếu thêm endpoint mới |
| JWT (thời hạn, payload, secret) | `src/utils/jwt.ts`, `src/config/env.ts` | `.env`, `auth.service.ts` (nếu đổi payload) |
| Refresh token / cookie | `auth.controller.ts` (tên cookie, `refreshCookieOptions`) | `auth.service.ts` nếu đổi cơ chế hash/rotation |
| Phân quyền route mới | `src/middlewares/auth.middleware.ts` (`authorize`) | file `*.route.ts` của module cần thêm quyền |
| Prompt chấm câu | [writing-evaluation.prompt.ts](../../src/modules/ai/prompts/writing-evaluation.prompt.ts) | không cần sửa file khác nếu chỉ đổi văn phong/tiêu chí |
| Prompt chấm đoạn văn | [paragraph-evaluation.prompt.ts](../../src/modules/ai/prompts/paragraph-evaluation.prompt.ts) | tương tự |
| Prompt sinh câu hỏi | [writing-generation.prompt.ts](../../src/modules/ai/prompts/writing-generation.prompt.ts) | tương tự |
| Prompt sinh đề đoạn văn | [paragraph-generation.prompt.ts](../../src/modules/ai/prompts/paragraph-generation.prompt.ts) | tương tự |
| Prompt sinh quiz | [quiz-generation.prompt.ts](../../src/modules/ai/prompts/quiz-generation.prompt.ts) | `GeneratedQuizSchema` trong `gemini.provider.ts` nếu đổi field |
| Prompt chẩn đoán điểm yếu | [weakness-analysis.prompt.ts](../../src/modules/ai/prompts/weakness-analysis.prompt.ts) | tương tự |
| Đổi/thêm AI provider | `ai.interface.ts` (hợp đồng), `providers/openai-compatible.provider.ts` (mẫu cho API kiểu OpenAI), `providers/groq.provider.ts` (ví dụ ngắn nhất) | với provider kiểu OpenAI: tạo file kế thừa `OpenAICompatibleProvider` (chỉ cần `name`, `baseURL`, `apiKey`, `model`), thêm biến vào `config/env.ts`, đăng ký trong constructor `ai.service.ts` và trong `defaultOrder` — xem [11-ai-system.md](11-ai-system.md) |
| Thứ tự / bật tắt provider AI | `ai.service.ts` (constructor), `config/env.ts` (`aiProviderOrder`) | biến môi trường `AI_PRIMARY_ORDER`, các biến `*_API_KEY` — không cần sửa code |
| Tham số gọi Groq/OpenRouter (temperature, mức suy luận, timeout) | `providers/openai-compatible.provider.ts` (`callChatJson`), `providers/groq.provider.ts` (`extraBody`) | `config/env.ts`, biến `AI_EVALUATION_TEMPERATURE`, `GROQ_REASONING_EFFORT` |
| JSON schema kỳ vọng AI trả về | Zod schema tương ứng trong `gemini.provider.ts` (vd. `EvaluationSchema`, được `export` và dùng chung cho Groq/OpenRouter) | đồng thời phải sửa phần "Schema for each object"/"Return exactly this JSON shape" trong file prompt tương ứng — 2 nơi này PHẢI khớp nhau |
| Cách chấm điểm/trọng số | Nội dung mô tả trong file prompt tương ứng (Rule 6 của `writing-evaluation.prompt.ts`) **và** công thức đối chiếu điểm tổng trong `ai.service.ts#reconcileScoreWithCriteria` | điểm tổng chấm câu = `min(điểm AI, trung bình theo trọng số 5 chỉ tiêu)`; chấm đoạn văn và Heuristic không đi qua công thức này |
| Sinh đề đoạn văn (word count theo độ khó) | [paragraph-difficulty.constants.ts](../../src/modules/paragraph/paragraph-difficulty.constants.ts) | `paragraph.service.ts#generateAIParagraphTopic` nếu đổi cách map |
| Câu hỏi (CRUD) | `writing.service.ts`, `AdminQuestionsPage.tsx` | `question.model.ts` nếu đổi schema |
| Gợi ý (Hint) | `writing.service.ts#buildSafeHints`, [grammar-hints.constants.ts](../../src/modules/writing/grammar-hints.constants.ts) | `question.model.ts` nếu thêm field hints mới |
| Analytics (số liệu tổng quan) | `analytics.service.ts#getOverview` | `AnalyticsPage.tsx`, `client/src/types/index.ts` (giữ đồng bộ tên field!) |
| Admin — Người dùng | `user.service.ts`, `AdminUsersPage.tsx` | `user.model.ts` nếu đổi schema |
| Admin — Câu hỏi | `writing.service.ts` (các method `*Admin`), `AdminQuestionsPage.tsx` | — |
| Cơ chế cập nhật thống kê không cần F5 | `AuthContext.tsx#refreshUser`, các `onSuccess` của mutation submit trong `PracticePage.tsx`/`WritingQuestionPage.tsx`/`ParagraphTopicPage.tsx` | `AnalyticsPage.tsx` (query key `['analytics','overview']`) |
| Route/guard 2 portal | `AppRoutes.tsx`, `admin/main.tsx`, `AdminProtectedRoute.tsx`, `UserRoute.tsx`, `ProtectedRoute.tsx` | **tuyệt đối không** thêm route `/admin` vào `AppRoutes.tsx` — xem lý do ở [08](08-authentication-and-authorization.md) |
| Build/Deploy | `client/vite.config.ts` (2 entry), `package.json` (script `build`), `deploy.sh` | `src/app.ts` nếu đổi cách phục vụ static |

## Ghi chú: file "chết"/chưa dùng — không nên sửa nhầm tưởng đang hoạt động

- `POST /writing/sessions`, `GET /writing/sessions/:id` — API còn hoạt động nhưng không có UI nào gọi tới.
- `POST /ai/evaluate-writing` — chỉ được gọi từ ô "Thử nghiệm nhanh" ở `Home.tsx`, không phải luồng chấm bài chính (luồng chính đi qua `POST /writing/attempts`).
- Xem đầy đủ tại [17-admin-management.md § Known Issues](17-admin-management.md).
