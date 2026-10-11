# 10 — Tài liệu API (API Documentation)

Toàn bộ endpoint dưới đây lấy trực tiếp từ các file `*.route.ts` thực tế, không tự đặt thêm. Base path: `/api`. Mọi response đều bọc trong `{ success, message, data }` (thành công) hoặc `{ success: false, message, errors }` (lỗi) — xem `src/utils/apiResponse.ts`.

Cột **Auth**: "—" = công khai, "User" = cần `authenticate` (bất kỳ role nào đã đăng nhập), "Admin" = cần `authenticate` + `authorize("admin")`.

## Auth (`/api/auth`) — file: [auth.route.ts](../../src/modules/auth/auth.route.ts)

| Method | Endpoint | Auth | Request | Response | Controller |
|---|---|---|---|---|---|
| POST | `/auth/register` | — | `{name,email,password,confirmPassword}` | `{user, accessToken}` + cookie `user_refresh_token` | `register` |
| POST | `/auth/login` | — | `{email,password}` | `{user, accessToken}` + cookie `user_refresh_token` | `login` |
| POST | `/auth/logout` | — (đọc cookie) | — | `null`, xóa cookie `user_refresh_token` | `logout` |
| GET | `/auth/me` | User | — | User object (không có password) | `getMe` |
| POST | `/auth/refresh` | — (đọc cookie) | — | `{user, accessToken}` + cookie mới (rotation) | `refresh` |
| POST | `/auth/admin/login` | — | `{email,password}` | `{user, accessToken}` + cookie `admin_refresh_token`; 403 nếu không phải admin | `adminLogin` |
| POST | `/auth/admin/refresh` | — (đọc cookie) | — | như trên, dùng cookie `admin_refresh_token` | `adminRefresh` |
| POST | `/auth/admin/logout` | — (đọc cookie) | — | `null`, xóa cookie `admin_refresh_token` | `adminLogout` |

## Users (`/api/users`) — file: [user.route.ts](../../src/modules/users/user.route.ts)

| Method | Endpoint | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/users/profile` | User | — | hồ sơ của chính mình |
| PUT | `/users/profile` | User | `{name?, avatar?, dailyGoal?}` | hồ sơ đã cập nhật |
| GET | `/users/all` | Admin | — | toàn bộ user |
| POST | `/users` | Admin | `{name,email,password,role?}` | user mới tạo |
| PUT | `/users/:id/status` | Admin | — | đảo `isActive` |
| PUT | `/users/:id` | Admin | Partial user | user đã cập nhật |
| DELETE | `/users/:id` | Admin | — | user đã xóa |

## Topics (mount 2 lần: `/api` **và** `/api/topics`, cùng router) — file: [topic.route.ts](../../src/modules/topics/topic.route.ts)

> `app.ts` gọi `app.use("/api", topicRouter)` **và** `app.use("/api/topics", topicRouter)` — vì vậy mỗi route bên dưới thực chất phản hồi ở **cả hai** tiền tố (`/api/topics` và `/api/topics/topics`). `adminService.ts` (frontend) đang dùng đường dẫn dài hơn (`/topics/topics`, `/topics/grammar`, `/topics/levels`); `QuestionBankPage.tsx` dùng đường ngắn hơn (`/topics`, `/grammar`). Đây không phải lỗi — cả hai đều hợp lệ do mount kép, nhưng là một điểm dễ gây nhầm lẫn khi đọc code, ghi lại ở [17-admin-management.md](17-admin-management.md).

| Method | Endpoint (thân route) | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/topics` | — | query `?all=true` (bỏ lọc `isActive`) | danh sách `Topic` |
| GET | `/grammar` | — | như trên | danh sách `GrammarTopic` |
| GET | `/levels` | — | — | 6 định nghĩa CEFR (hardcode) + `questionCount` tính động |
| POST | `/topics` | Admin | `{name, description?, icon?, order?}` | Topic mới |
| PUT | `/topics/:id` | Admin | Partial Topic | Topic đã cập nhật |
| DELETE | `/topics/:id` | Admin | — | Topic đã xóa |
| POST | `/grammar` | Admin | `{name, description?, level?, order?}` | GrammarTopic mới |
| PUT | `/grammar/:id` | Admin | Partial GrammarTopic | GrammarTopic đã cập nhật |
| DELETE | `/grammar/:id` | Admin | — | GrammarTopic đã xóa |

## Writing (`/api/writing`) — file: [writing.route.ts](../../src/modules/writing/writing.route.ts)

| Method | Endpoint | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/writing/questions` | — | query level/topic/grammarTopic/difficulty/limit/page | danh sách câu hỏi (không có đáp án) |
| GET | `/writing/questions/:id` | — | — | 1 câu hỏi, không có đáp án, kèm `hints` |
| GET | `/writing/admin/questions` | Admin | query filter | danh sách câu hỏi đầy đủ (có đáp án) |
| POST | `/writing/admin/questions` | Admin | câu hỏi đầy đủ | câu hỏi mới |
| POST | `/writing/admin/questions/bulk` | Admin | `{questions: [...]}` | mảng câu hỏi mới |
| PUT | `/writing/admin/questions/:id` | Admin | Partial | đã cập nhật |
| DELETE | `/writing/admin/questions/:id` | Admin | — | đã xóa |
| GET | `/writing/admin/evaluations` | Admin | query status/level/userId/page/limit | danh sách `WritingAttempt` kèm userName/userEmail |
| POST | `/writing/sessions` | User | `{level, topic?, grammarTopic?, difficulty?, questionCount}` | `{session, questions[]}` (không có đáp án) |
| GET | `/writing/sessions/:id` | User | — | session + câu hỏi (không có đáp án) |
| POST | `/writing/attempts` | User (rate-limit 60/phút) | `{sessionId?, questionId, answer\|userAnswer}` | evaluation đầy đủ + đã lưu WritingAttempt |
| GET | `/writing/attempts` | User | query page/limit/level/topic/status/errorType/startDate/endDate/**questionId** | lịch sử của chính mình (`questionId` lọc các lần nộp của một câu hỏi, dùng cho panel so sánh) |
| GET | `/writing/attempts/:id` | User | — | 1 attempt của chính mình |

## AI (`/api/ai`) — file: [ai.route.ts](../../src/modules/ai/ai.route.ts)

| Method | Endpoint | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/ai/evaluate-writing` | User (rate-limit 60/phút) | `{vietnameseSentence, referenceAnswer, alternativeAnswers?, userAnswer, level, topic?, grammarTopic?}` | evaluation đầy đủ (KHÔNG lưu vào DB — khác `/writing/attempts`) |

> Ghi chú: `/ai/evaluate-writing` là một "raw" AI call không lưu kết quả — khác với `writing.service.ts#submitAttempt` (có lưu DB). Trong UI hiện tại, `Home.tsx` ("Thử nghiệm nhanh") là nơi duy nhất gọi trực tiếp endpoint này. Các endpoint `/ai/generate-questions` và `/ai/analyze-weakness` từng tồn tại đã bị gỡ; sinh câu hỏi đi qua `POST /learning/ai-writing/generate`, chẩn đoán điểm yếu đi qua `POST /analytics/ai-analysis`.

## Analytics (`/api/analytics`) — file: [analytics.route.ts](../../src/modules/analytics/analytics.route.ts)

| Method | Endpoint | Auth | Response |
|---|---|---|---|
| GET | `/analytics/overview` | User | `{totalAttempts, averageScore, highestScore, lowestScore, accuracy, totalErrors, correctCount, partialCount, incorrectCount}` |
| GET | `/analytics/admin/stats` | Admin | thống kê toàn hệ thống (users/questions/attempts/errors) |
| GET | `/analytics/errors` | User | phân bố lỗi của chính mình theo type |
| GET | `/analytics/topics` | User | thống kê theo chủ đề |
| GET | `/analytics/grammar` | User | thống kê theo chủ điểm ngữ pháp |
| GET | `/analytics/trends` | User | biểu đồ điểm theo thời gian + hoạt động theo ngày trong tuần |
| GET | `/analytics/ai-analysis` | User | bản chẩn đoán AI gần nhất đã lưu, hoặc `null` nếu chưa có — **chỉ đọc, không bao giờ gọi AI** |
| POST | `/analytics/ai-analysis` | User (rate-limit 20/phút) | chủ động sinh chẩn đoán AI mới, lưu lại |

## Paragraph (`/api/paragraph`) — file: [paragraph.route.ts](../../src/modules/paragraph/paragraph.route.ts)

> Toàn bộ endpoint dưới đây chỉ hoạt động khi có MongoDB (xem [04](04-system-architecture.md)).

| Method | Endpoint | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/paragraph/topics` | — | query levelTier/page/limit | danh sách đề |
| GET | `/paragraph/topics/:id` | — | — | 1 đề |
| POST | `/paragraph/generate` | User (rate-limit 60/phút) | `{topic, difficulty}` | `{topicId, promptVi, ...}` (đề AI mới đã lưu) |
| GET | `/paragraph/my-stats` | User | — | thống kê cá nhân Paragraph Writing |
| GET | `/paragraph/admin/topics` | Admin | query | danh sách đề (đầy đủ) |
| POST | `/paragraph/admin/topics` | Admin | đề đầy đủ | đề mới |
| PUT | `/paragraph/admin/topics/:id` | Admin | Partial | đã cập nhật |
| DELETE | `/paragraph/admin/topics/:id` | Admin | — | đã xóa |
| GET | `/paragraph/admin/attempts` | Admin | query topicId/userId/page/limit | danh sách attempt kèm thông tin user+đề |
| POST | `/paragraph/attempts` | User (rate-limit 60/phút) | `{topicId, text}` (tối đa 4000 ký tự) | evaluation + revision đã lưu |
| GET | `/paragraph/attempts` | User | query page/limit | lịch sử của chính mình (không kèm `revisions`) |
| GET | `/paragraph/attempts/:topicId` | User | — | bài làm hiện tại của chính mình cho đề này |

## Learning (`/api/learning`) — file: [learning.route.ts](../../src/modules/learning/learning.route.ts)

> Toàn bộ endpoint dưới đây chỉ hoạt động khi có MongoDB.

| Method | Endpoint | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/learning/topics` | User | query category?/search? | danh sách 19 chủ đề kèm tiến độ |
| GET | `/learning/topics/:slug` | User | — | chi tiết 1 chủ đề (lý thuyết, ví dụ, bài luyện, tiến độ) |
| POST | `/learning/topics/:slug/progress/section-viewed` | User | `{section}` | danh sách section đã xem |
| GET | `/learning/progress-overview` | User | — | XP, level, streak, % hoàn thành, weak topics |
| GET | `/learning/ai-writing/topics` | User | — | 7 chủ đề gợi ý cho AI Writing (hằng số) |
| POST | `/learning/ai-writing/generate` | User (rate-limit 60/phút) | `{tenseSlug, topicKey? \| customTopic?, level?}` | 1 câu hỏi AI sinh (không có đáp án) |
| GET | `/learning/admin/topics` | Admin | query | danh sách 19 chủ đề (đầy đủ) |
| POST | `/learning/admin/topics` | Admin | chủ đề đầy đủ | chủ đề mới |
| PUT | `/learning/admin/topics/:id` | Admin | Partial | đã cập nhật |
| DELETE | `/learning/admin/topics/:id` | Admin | — | đã xóa |

## Quiz (`/api/quiz`) — file: [quiz.route.ts](../../src/modules/quiz/quiz.route.ts)

> Toàn bộ endpoint dưới đây yêu cầu đăng nhập và chỉ hoạt động khi có MongoDB (nếu không, trả lỗi "Chức năng Grammar Quiz tạm thời không khả dụng").

| Method | Endpoint | Auth | Request | Response |
|---|---|---|---|---|
| POST | `/quiz/generate` | User (rate-limit 20/phút) | `{difficulty: A1–C2, tenses?: string[] (slug các thì, hoặc ["all"]), grammar? (kiểu cũ: 1 tên thì hoặc "All"), topic?, questionCount: 10–50}` | `{quizId, difficulty, grammar, tenses, topic, totalQuestions, questions[]}` — mỗi câu chỉ có `questionId, question, options[4], questionNumber, ...` (KHÔNG có đáp án đúng hay giải thích) |
| POST | `/quiz/:quizId/submit` | User | `{answers: [{questionId, selectedAnswer: 0–3}]}` (ít nhất 1 câu) | kết quả: `correctCount, wrongCount, score` và từng câu kèm `correctAnswer`, `selectedAnswer`, `isCorrect`, `explanation`. Nộp lần 2 cùng quiz báo lỗi "đã được nộp trước đó" |
| GET | `/quiz/history` | User | query page/limit | các bài quiz đã hoàn thành của chính mình (không kèm danh sách câu hỏi) |
| GET | `/quiz/history/:id` | User | — | chi tiết 1 bài quiz đã hoàn thành của chính mình |
| GET | `/quiz/stats` | User | — | `{totalQuizzes, totalQuestions, averageScore, overallAccuracy, accuracyByTense[], accuracyByLevel[]}` |

## Health check

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/health` | — |
| GET | `/api/health` | — |
