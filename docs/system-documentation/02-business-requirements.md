# 02 — Yêu cầu nghiệp vụ (Business Requirements)

Mọi mục dưới đây đều dựa trên route/service thực sự hoạt động trong source code. Khi một chức năng có UI riêng nhưng thực chất tái sử dụng module khác (ví dụ "Luyện viết" tái sử dụng API Writing attempts), việc tái sử dụng đó được ghi rõ thay vì mô tả như một hệ thống riêng biệt.

## User (Học viên)

### Đăng ký (Register)
- **Mục đích**: tạo tài khoản học viên mới.
- **API**: `POST /api/auth/register`
- **Frontend**: [SignUp.tsx](../../client/src/user/pages/SignUp.tsx) → `AuthContext.register()`
- **Backend**: `auth.controller.ts#register` → `auth.service.ts#register` → `UserModel.create()` (role luôn ép về `"user"`, `dailyGoal: 5`, `streak: 0`)
- **Output**: object user + access token (JSON) + cookie HttpOnly `user_refresh_token`.

### Đăng nhập (Login)
- **API**: `POST /api/auth/login`
- **Frontend**: [SignIn.tsx](../../client/src/user/pages/SignIn.tsx)
- **Backend**: `auth.service.ts#login` — kiểm tra `isActive`, so khớp hash bcrypt, phát hành cặp token.

### Đăng xuất (Logout)
- **API**: `POST /api/auth/logout` — thu hồi phiên refresh-token phía server và xóa cookie.

### Học Writing (Writing Learning)
- **Mục đích**: học có cấu trúc, tự học theo tốc độ riêng, gồm 12 thì tiếng Anh + 7 chủ đề kỹ năng viết (liên từ, mô tả người/nơi chốn/trải nghiệm, nêu quan điểm, gợi ý viết câu/đoạn văn), theo phong cách W3Schools — mọi chủ đề luôn mở, không khóa.
- **Frontend**: [LearningHomePage.tsx](../../client/src/user/pages/LearningHomePage.tsx), [LearningTopicPage.tsx](../../client/src/user/pages/LearningTopicPage.tsx) (các tab Learn/Examples/Practice/AI Writing/Progress), [LearningProgressPage.tsx](../../client/src/user/pages/LearningProgressPage.tsx)
- **API**: `GET /api/learning/topics`, `GET /api/learning/topics/:slug`, `POST /api/learning/topics/:slug/progress/section-viewed`, `GET /api/learning/progress-overview`
- **Backend**: `learning.service.ts` (chỉ hoạt động với Mongo)

### Luyện trắc nghiệm ngữ pháp (Grammar Quiz)
- **Mục đích**: làm bài trắc nghiệm 4 đáp án về các thì tiếng Anh, có giải thích sau khi nộp.
- **Cấu hình bài**: cấp độ CEFR (A1–C2), một hoặc nhiều thì (hoặc tất cả 12 thì), chủ đề (hoặc tất cả), số câu 10/20/30/40/50.
- **Frontend**: [GrammarQuizPage.tsx](../../client/src/user/pages/GrammarQuizPage.tsx) (`/quiz`) — 3 giai đoạn: cấu hình → làm bài từng câu → xem kết quả. Có thể mở từ trang một chủ đề ngữ pháp hoặc từ kết quả chấm câu với sẵn thì đã chọn (`/quiz?tense=<slug>`).
- **API**: `POST /api/quiz/generate`, `POST /api/quiz/:quizId/submit`, `GET /api/quiz/history`, `GET /api/quiz/history/:id`, `GET /api/quiz/stats`
- **Backend**: `quiz.service.ts` → `aiService.generateQuiz()`; chia số câu đều theo thì, sinh bù tối đa 3 vòng để đủ số câu và không trùng lặp; đáp án đúng chỉ gửi về sau khi nộp bài; điểm = `round(số câu đúng / tổng câu × 100)`. Chỉ hoạt động khi có MongoDB.

### Luyện viết câu (AI Writing / Sentence Writing)
- **Mục đích**: chọn chủ đề (hoặc tự nhập) + cấp độ CEFR + thì ngữ pháp → AI sinh 1 đề tiếng Việt → học viên viết câu trả lời tiếng Anh → AI chấm.
- **Frontend**: [PracticePage.tsx](../../client/src/user/pages/PracticePage.tsx) (trang độc lập, `/practice`) và tab "AI Writing" bên trong [LearningTopicPage.tsx](../../client/src/user/pages/LearningTopicPage.tsx) (giới hạn theo thì đang học) — cả hai đều gọi chung một backend.
- **API**: `POST /api/learning/ai-writing/generate`, sau đó `POST /api/writing/attempts`
- **Backend**: `learning.service.ts#generateAIWritingQuestion` → `aiService.generateQuestions()`; chấm bài qua `writing.service.ts#submitAttempt` → `aiService.evaluateWriting()`.
- **Chấm theo 5 chỉ tiêu**: ngữ pháp 40, từ vựng 20, ý nghĩa 20, cấu trúc 10, tự nhiên 10; điểm tổng bị ràng buộc theo các chỉ tiêu này (xem [11-ai-system.md](11-ai-system.md)).
- **Viết lại và so sánh**: học viên có thể nộp lại cùng một câu hỏi; mỗi lần nộp là một bản ghi riêng, và từ lần thứ 2 kết quả hiển thị bảng so sánh với lần trước (điểm, từng chỉ tiêu, lỗi đã sửa) cùng liên kết ôn lại thì/làm quiz liên quan.

### Xem ngân hàng câu hỏi (Question Bank)
- **Mục đích**: duyệt ~100 câu hỏi có sẵn do Admin biên soạn, trải dài A1–C2, lọc theo chủ đề/cấp độ.
- **Frontend**: [QuestionBankPage.tsx](../../client/src/user/pages/QuestionBankPage.tsx)
- **API**: `GET /api/writing/questions` (không bao giờ trả về `referenceAnswer`)

### Làm bài (trực tiếp từ Question Bank)
- **Mục đích**: trả lời đúng một câu hỏi được chọn từ ngân hàng câu hỏi, có card gợi ý gấp/mở tùy chọn.
- **Frontend**: [WritingQuestionPage.tsx](../../client/src/user/pages/WritingQuestionPage.tsx), route `/writing/question/:questionId`
- **API**: `GET /api/writing/questions/:id` (an toàn, đã lược bỏ đáp án + kèm hints), `POST /api/writing/attempts`

### Luyện viết đoạn văn (Paragraph Writing)
- **Mục đích**: chọn chủ đề + độ khó → AI sinh đề đoạn văn bằng tiếng Việt → học viên viết đoạn văn tiếng Anh → AI chấm theo 7 tiêu chí; nộp lại vẫn giữ lịch sử các lần sửa.
- **Frontend**: [ParagraphWritingPage.tsx](../../client/src/user/pages/ParagraphWritingPage.tsx), [ParagraphTopicPage.tsx](../../client/src/user/pages/ParagraphTopicPage.tsx)
- **API**: `POST /api/paragraph/generate`, `POST /api/paragraph/attempts`, `GET /api/paragraph/topics`, `GET /api/paragraph/attempts/:topicId`, `GET /api/paragraph/my-stats`

### Gửi bài cho AI đánh giá / Xem điểm / Xem lỗi
Được xử lý qua response của `POST /api/writing/attempts` và `POST /api/paragraph/attempts` — một object đánh giá có cấu trúc gồm `score`, phân tích theo từng tiêu chí, mảng `errors[]` (type/severity/wrongText/correctText/giải thích tiếng Việt), điểm mạnh, khuyến nghị. Hiển thị bởi [PracticeResultPanel.tsx](../../client/src/user/components/PracticeResultPanel.tsx) / [ParagraphScorePanel.tsx](../../client/src/user/components/ParagraphScorePanel.tsx) + [ErrorViewer.tsx](../../client/src/user/components/ErrorViewer.tsx).

### Xem lịch sử (History)
Mọi lượt làm Sentence Writing đều có thể truy vấn qua `GET /api/writing/attempts` (lọc theo level/topic/status/errorType/khoảng ngày). Mọi lượt Paragraph qua `GET /api/paragraph/attempts`. **[PARTIAL]**: hiện chưa có trang "Lịch sử của tôi" riêng trong User Portal để đọc các endpoint này — chúng đang được trang lịch sử chấm bài hợp nhất của Admin tiêu thụ. Học viên chỉ thấy kết quả bài của chính mình ngay sau khi nộp, hoặc lượt gần nhất theo từng đề Paragraph (`GET /api/paragraph/attempts/:topicId`).

### Xem thống kê (Analytics)
- **Frontend**: [AnalyticsPage.tsx](../../client/src/user/pages/AnalyticsPage.tsx) (`/analytics`)
- **API**: `GET /api/analytics/overview` (tổng số/điểm trung bình/độ chính xác tính từ `WritingAttemptModel`), `GET /api/analytics/ai-analysis` (chỉ đọc bản chẩn đoán AI đã lưu gần nhất, trả `null` nếu chưa có — không gọi AI), `POST /api/analytics/ai-analysis` (chủ động yêu cầu chẩn đoán mới, gọi AI). Trang Analytics còn hiển thị thống kê Grammar Quiz từ `GET /api/quiz/history` và `GET /api/quiz/stats`.

### Theo dõi tiến độ / Theo dõi streak
- Các trường `user.streak` (số ngày liên tiếp có luyện viết câu, tính theo ngày giờ Việt Nam), `user.totalWriting`, `user.averageScore` trên document `User` được cập nhật mỗi khi một lượt Sentence Writing được lưu (`writing.service.ts#submitAttempt`, cả 2 nhánh Mongo và in-memory) — **không** được cập nhật bởi lượt Paragraph Writing (xem phần Known Issues trong [17-admin-management.md](17-admin-management.md)). Hiển thị qua object `user` của `AuthContext`, được làm mới lại qua `GET /auth/me` ngay sau mỗi lượt làm bài (không cần F5 — xem [16-learning-and-analytics.md](16-learning-and-analytics.md)).
- Writing Learning có hệ thống XP/Level riêng, tính động ngay trong `learning.service.ts#getProgressOverview` (không lưu thành field cố định — được tính lại mỗi lần yêu cầu overview, dựa trên `totalWriting`, `averageScore`, số chủ đề đã hoàn thành, và số lượt Paragraph đạt điểm tốt).

### Xem chẩn đoán lỗi (AI diagnosis)
`analytics.service.ts#performAIAnalysis` tổng hợp các lượt làm bài/lỗi của học viên và gọi `aiService.analyzeWeakness()`; kết quả (`overallLevel`, `strengths`, `weaknesses`, `repeatedErrors`, `progress`, `analysis`, `recommendations`) được lưu vào `AIAnalysisModel` và hiển thị ở card "Báo cáo chẩn đoán điểm yếu từ AI" trên trang Analytics.

## Admin (Quản trị viên)

Với mỗi mục: Mục đích / Actor / Input / Processing / Output / Database affected / API / Frontend page / Backend files.

### Quản lý người dùng (User Management)
- **Mục đích**: xem toàn bộ học viên/admin, khóa/mở khóa tài khoản, sửa hoặc xóa tài khoản, tạo tài khoản trực tiếp.
- **Actor**: chỉ admin (`authorize("admin")`)
- **Input**: tìm kiếm/lọc (tên, email, trạng thái, vai trò); form tạo/sửa (tên, email, mật khẩu, vai trò)
- **Processing**: `userService` đọc/ghi `UserModel`, luôn loại bỏ `password` khỏi response.
- **Output**: danh sách người dùng kèm `totalAttempts`/`averageScore` (tính động ở nhánh in-memory); cột "Điểm TB" theo vai trò (`—` với tài khoản admin, điểm trung bình thật với học viên).
- **Database**: collection `User`.
- **API**: `GET /users/all`, `POST /users`, `PUT /users/:id`, `PUT /users/:id/status`, `DELETE /users/:id`
- **Frontend**: [AdminUsersPage.tsx](../../client/src/admin/pages/AdminUsersPage.tsx)
- **Backend**: `user.route.ts`, `user.controller.ts`, `user.service.ts`, `user.model.ts`

### Quản lý Câu hỏi Writing (Question Bank Management)
- **Mục đích**: CRUD ngân hàng câu hỏi Sentence Writing (đề tiếng Việt, đáp án chuẩn + đáp án tương đương, cấp độ, chủ đề, chủ điểm ngữ pháp, độ khó, từ khóa).
- **API**: `GET/POST /writing/admin/questions`, `PUT/DELETE /writing/admin/questions/:id`, `POST /writing/admin/questions/bulk`
- **Frontend**: [AdminQuestionsPage.tsx](../../client/src/admin/pages/AdminQuestionsPage.tsx)
- **Backend**: `writing.route.ts`, `writing.controller.ts`, `writing.service.ts`, `question.model.ts`

### Quản lý Đề viết đoạn văn (Paragraph Topic Management)
- **API**: `GET/POST /paragraph/admin/topics`, `PUT/DELETE /paragraph/admin/topics/:id`
- **Frontend**: [AdminParagraphTopicsPage.tsx](../../client/src/admin/pages/AdminParagraphTopicsPage.tsx)
- **Backend**: `paragraph.route.ts` / `.controller.ts` / `.service.ts` / `paragraph-topic.model.ts`

### Quản lý Writing Learning (Learning Content Management)
- **Mục đích**: tạo/sửa/xóa 19 chủ đề ngữ pháp/kỹ năng viết (nội dung lý thuyết, ví dụ, lỗi thường gặp, liên kết practice-tag với ngân hàng câu hỏi).
- **API**: `GET/POST /learning/admin/topics`, `PUT/DELETE /learning/admin/topics/:id`
- **Frontend**: [AdminLearningTopicsPage.tsx](../../client/src/admin/pages/AdminLearningTopicsPage.tsx)

### Cấp độ CEFR (Level reference)
- **Mục đích**: xem tham khảo (chỉ đọc) 6 cấp độ CEFR cố định (A1–C2), mỗi cấp kèm số lượng câu hỏi đã seed ở cấp đó (tính động).
- **API**: `GET /topics/levels`
- **Frontend**: [AdminLevelsPage.tsx](../../client/src/admin/pages/AdminLevelsPage.tsx)
- **Backend**: `topic.service.ts#getLevels` — định nghĩa các cấp độ là hằng số hardcode trong method này, không phải một collection DB.

### Lịch sử AI Chấm bài (Unified AI Evaluation Audit)
- **Mục đích**: duyệt/tìm kiếm mọi lượt Sentence Writing và mọi lượt Paragraph Writing (của mọi học viên) trong một bảng hợp nhất, lọc được theo loại bài, có modal xem chi tiết.
- **API**: `GET /writing/admin/evaluations`, `GET /paragraph/admin/attempts`
- **Frontend**: [AdminEvaluationsPage.tsx](../../client/src/admin/pages/AdminEvaluationsPage.tsx) — tự hợp nhất 2 dạng dữ liệu backend rất khác nhau ngay ở phía client (hàm `toSentenceRow`/`toParagraphRow`) thay vì backend cung cấp sẵn một endpoint hợp nhất.

### Tổng quan hệ thống (Dashboard / System Stats)
- **Mục đích**: bảng KPI tổng quan — tổng/đang hoạt động/bị khóa/admin, quy mô ngân hàng câu hỏi + độ phủ CEFR, tổng số lượt chấm bài, điểm trung bình.
- **API**: `GET /analytics/admin/stats`
- **Backend**: `analytics.service.ts#getSystemStats`
- **Frontend**: [AdminOverviewPage.tsx](../../client/src/admin/pages/AdminOverviewPage.tsx)

### Chủ đề & Ngữ pháp (Topic/Grammar taxonomy CRUD)
**[PARTIAL]**: các route CRUD phía backend vẫn còn và hoạt động (`POST/PUT/DELETE /topics/topics`, `/topics/grammar`, được bảo vệ bởi `authorize("admin")`) và 15 document `Topic` + 18 document `GrammarTopic` đã seed vẫn đang là nền tảng cho bộ lọc Question Bank, bộ chọn chủ đề của Paragraph Writing, và input sinh đề AI — nhưng không còn trang Admin Portal nào để quản lý chúng nữa (đã gỡ khỏi giao diện ở một lần thay đổi trước; dữ liệu và API được cố tình giữ nguyên để phục vụ các chức năng khác vẫn còn phụ thuộc vào chúng).
