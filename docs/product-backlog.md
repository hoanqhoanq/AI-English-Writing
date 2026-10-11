# Product Backlog — AI English Writing Platform

> Tài liệu này tái hiện lại Product Backlog theo mô hình Scrum cho dự án **AI English Writing** — nền tảng luyện viết tiếng Anh cho người Việt, có AI (Google Gemini, dự phòng bằng Groq và OpenRouter) tự sinh đề luyện tập và tự động chấm bài. Toàn bộ 40 hạng mục dưới đây được liệt kê **dựa trên chức năng thật đã tồn tại trong source code** (đối chiếu với [docs/system-documentation/](system-documentation/)), không suy diễn hay bổ sung chức năng chưa được xây dựng. Tài liệu này chỉ mô tả lại quá trình phát triển dưới dạng Backlog/Sprint — **không chỉnh sửa bất kỳ chức năng có sẵn nào của dự án**.

## 1. Tầm nhìn sản phẩm (Product Vision)

Xây dựng một nền tảng luyện viết tiếng Anh có AI hỗ trợ, giúp người học Việt Nam luyện ngữ pháp (12 thì), làm trắc nghiệm, luyện viết câu và đoạn văn với đề bài do AI sinh ra theo đúng trình độ, được AI chấm điểm và giải thích lỗi bằng tiếng Việt ngay lập tức — đồng thời cung cấp cho Quản trị viên công cụ quản lý nội dung và theo dõi toàn hệ thống.

**3 nhóm người dùng (Actor)**: **Guest** (chưa đăng nhập), **Member** (học viên), **Admin** (quản trị viên).

## 2. Quy ước Backlog

| Quy ước | Giá trị |
|---|---|
| Độ dài 1 Sprint | 2 tuần |
| Thang điểm Story Point | Fibonacci rút gọn: 1, 2, 3, 5, 8 |
| Mức độ ưu tiên | **Cao** (Must have) / **Trung bình** (Should have) / **Thấp** (Could have) |
| Định nghĩa Hoàn thành (DoD) | Đã code xong + chạy được qua API thật + có xử lý lỗi cơ bản + không phá vỡ luồng nghiệp vụ liên quan |
| Trạng thái | Tất cả 40 hạng mục trong 8 Sprint dưới đây đều ở trạng thái **Done** (đã có trong source code hiện tại) |

## 3. Tổng hợp 8 Sprint

| Sprint | Mục tiêu (Sprint Goal) | Số hạng mục | Story Points |
|---|---|---|---|
| 1 | Khởi tạo dự án & Xác thực người dùng | 5 | 20 |
| 2 | Cổng quản trị & Quản lý người dùng | 5 | 19 |
| 3 | Ngân hàng câu hỏi & Học ngữ pháp | 5 | 18 |
| 4 | Luyện viết câu có AI đánh giá | 5 | 27 |
| 5 | Luyện tập trắc nghiệm ngữ pháp (Quiz) | 5 | 27 |
| 6 | Luyện viết đoạn văn có AI đánh giá | 5 | 26 |
| 7 | Thống kê, Tiến độ & Chẩn đoán AI | 5 | 25 |
| 8 | Hoàn thiện, Bảo mật & Triển khai | 5 | 20 |
| **Tổng** | | **40** | **202** |

---

## 4. Chi tiết Backlog theo Sprint

### Sprint 1 — Khởi tạo dự án & Xác thực người dùng

**Mục tiêu**: Dựng khung kiến trúc 2 portal (User/Admin) và luồng đăng ký/đăng nhập/đăng xuất hoàn chỉnh cho Member.

| ID | User Story | SP | Ưu tiên | Ghi chú / Căn cứ |
|---|---|---|---|---|
| US-01 | Là Lập trình viên, tôi muốn khởi tạo kiến trúc Backend (Express + TypeScript, cấu trúc `route → controller → service → model`) và Frontend (React + Vite, 2 bundle độc lập User/Admin) để có nền tảng phát triển các module sau. | 5 | Cao | `src/app.ts`, `client/vite.config.ts` |
| US-02 | Là Lập trình viên, tôi muốn kết nối MongoDB với cơ chế dự phòng dữ liệu trong bộ nhớ (`memoryStore.ts`) để hệ thống vẫn chạy được khi chưa cấu hình DB thật. | 5 | Cao | `src/db/memoryStore.ts` |
| US-03 | Là Guest, tôi muốn đăng ký tài khoản học viên mới để bắt đầu sử dụng hệ thống. | 3 | Cao | `POST /api/auth/register` |
| US-04 | Là Guest, tôi muốn đăng nhập bằng email/mật khẩu để nhận access token (JWT 15 phút) và phiên đăng nhập (refresh token, cookie HttpOnly). | 5 | Cao | `POST /api/auth/login` |
| US-05 | Là Member, tôi muốn hệ thống tự động làm mới phiên đăng nhập khi access token hết hạn và đăng xuất khi tôi chủ động thoát, để không bị gián đoạn khi đang học nhưng vẫn bảo mật khi rời đi. | 5 | Cao | axios interceptor bắt lỗi 401 tự refresh; `POST /api/auth/logout` thu hồi refresh-token session |

### Sprint 2 — Cổng quản trị & Quản lý người dùng

**Mục tiêu**: Tách riêng Admin Portal với cổng đăng nhập độc lập, xây middleware phân quyền, và hoàn thiện CRUD quản lý người dùng.

| ID | User Story | SP | Ưu tiên | Ghi chú / Căn cứ |
|---|---|---|---|---|
| US-06 | Là Admin, tôi muốn có một cổng đăng nhập riêng (`/admin/login`) tách biệt hoàn toàn khỏi đăng nhập Member (cookie, endpoint riêng) để đảm bảo ranh giới bảo mật rõ ràng giữa 2 vai trò. | 5 | Cao | `POST /api/auth/admin/login`, từ chối ngay nếu `role !== "admin"` |
| US-07 | Là Hệ thống, tôi muốn middleware xác thực kiểm tra lại `isActive` của tài khoản ở mỗi request và middleware phân quyền theo `role`, để tài khoản bị khóa mất quyền truy cập ngay lập tức. | 5 | Cao | `auth.middleware.ts#authenticate/authorize` |
| US-08 | Là Admin, tôi muốn xem danh sách toàn bộ người dùng kèm tìm kiếm/lọc theo tên, email, trạng thái, vai trò để quản lý học viên hiệu quả. | 3 | Trung bình | `GET /users/all` |
| US-09 | Là Admin, tôi muốn thêm mới hoặc chỉnh sửa thông tin một tài khoản người dùng (tên, email, mật khẩu, vai trò) trực tiếp từ giao diện quản trị. | 3 | Trung bình | `POST /users`, `PUT /users/:id` |
| US-10 | Là Admin, tôi muốn khóa/mở khóa hoặc xóa một tài khoản người dùng để kiểm soát quyền truy cập hệ thống. | 3 | Trung bình | `PUT /users/:id/status`, `DELETE /users/:id` |

### Sprint 3 — Ngân hàng câu hỏi & Học ngữ pháp

**Mục tiêu**: Xây kho câu hỏi Writing và nội dung học 12 thì ngữ pháp theo phong cách tự học không khóa thứ tự.

| ID | User Story | SP | Ưu tiên | Ghi chú / Căn cứ |
|---|---|---|---|---|
| US-11 | Là Admin, tôi muốn CRUD Ngân hàng câu hỏi Writing (đề tiếng Việt, đáp án chuẩn + đáp án tương đương, cấp độ CEFR, chủ điểm ngữ pháp, độ khó, từ khóa) để cung cấp nội dung luyện tập cho học viên. | 5 | Cao | `writing.route.ts` (`/writing/admin/questions`) |
| US-12 | Là Member, tôi muốn duyệt và tìm kiếm/lọc Ngân hàng câu hỏi theo chủ đề, cấp độ mà không thấy đáp án, để chọn bài phù hợp với mình. | 3 | Trung bình | `GET /writing/questions` (luôn loại bỏ `referenceAnswer`) |
| US-13 | Là Admin, tôi muốn CRUD nội dung học Writing Learning (12 thì ngữ pháp + 7 kỹ năng viết: lý thuyết, ví dụ, lỗi thường gặp) để xây dựng giáo trình tự học. | 5 | Cao | `learning.route.ts` (`/learning/admin/topics`) |
| US-14 | Là Member, tôi muốn xem lý thuyết và ví dụ minh họa của một chủ điểm ngữ pháp theo phong cách W3Schools (mọi chủ đề luôn mở, không khóa) để tự học theo tốc độ riêng. | 3 | Cao | `LearningTopicPage.tsx`, `GET /learning/topics/:slug` |
| US-15 | Là Member, tôi muốn hệ thống tự động đánh dấu tiến độ khi tôi mở một phần nội dung (Learn/Examples) để theo dõi được mình đã học tới đâu. | 2 | Trung bình | `POST /learning/topics/:slug/progress/section-viewed` |

### Sprint 4 — Luyện viết câu có AI đánh giá

**Mục tiêu**: Hoàn thiện luồng lõi của sản phẩm — AI sinh đề, học viên nộp bài, AI chấm điểm và giải thích lỗi.

| ID | User Story | SP | Ưu tiên | Ghi chú / Căn cứ |
|---|---|---|---|---|
| US-16 | Là Member, tôi muốn chọn chủ đề, cấp độ CEFR và thì ngữ pháp muốn luyện để AI tự sinh một đề câu tiếng Việt phù hợp, không lặp lại đề đã làm gần đây. | 8 | Cao | `learning.service.ts#generateAIWritingQuestion`, loại trừ tối đa 5 đề gần nhất |
| US-17 | Là Member, tôi muốn chọn một câu hỏi cụ thể từ Ngân hàng câu hỏi và trả lời trực tiếp, có thể xem gợi ý trước khi nộp bài. | 3 | Trung bình | `WritingQuestionPage.tsx`, `GET /writing/questions/:id` |
| US-18 | Là Member, tôi muốn xem gợi ý từ vựng/cấu trúc ngữ pháp (không lộ đáp án hoàn chỉnh) khi cần hỗ trợ trong lúc làm bài. | 3 | Thấp | `writing.service.ts#buildSafeHints`, `grammar-hints.constants.ts` |
| US-19 | Là Member, tôi muốn nộp câu trả lời và nhận đánh giá AI (điểm số, lỗi cụ thể, nhận xét bằng tiếng Việt) ngay lập tức, kể cả khi Gemini gặp sự cố (tự động chuyển sang provider AI dự phòng Groq/OpenRouter, cuối cùng mới là chấm điểm dự phòng cục bộ). | 8 | Cao | `writing.service.ts#submitAttempt` → `aiService.evaluateWriting()`, chuỗi Gemini → Groq → OpenRouter → `HeuristicProvider`; điểm tổng đối chiếu với 5 chỉ tiêu (`reconcileScoreWithCriteria`) |
| US-20 | Là Member, tôi muốn sửa lại và nộp lại bài đã làm, đồng thời xem so sánh điểm số giữa các lần nộp, để biết mình đã tiến bộ như thế nào. | 5 | Trung bình | Mỗi lần nộp tạo 1 `WritingAttempt` mới, `AttemptComparisonPanel.tsx` |

### Sprint 5 — Luyện tập trắc nghiệm ngữ pháp (Grammar Quiz)

**Mục tiêu**: Xây tính năng tạo đề trắc nghiệm bằng AI có kiểm soát chất lượng (chống trùng lặp, cân bằng phân bố).

| ID | User Story | SP | Ưu tiên | Ghi chú / Căn cứ |
|---|---|---|---|---|
| US-21 | Là Member, tôi muốn cấu hình một bài Quiz (độ khó, một hoặc nhiều thì, chủ đề, số câu) và để AI sinh bộ câu hỏi trắc nghiệm tương ứng. | 8 | Cao | `quiz.service.ts#generateQuiz` |
| US-22 | Là Hệ thống, tôi muốn tự động lọc câu hỏi trùng lặp gần giống nhau (Jaccard similarity) và cân bằng số câu theo từng thì, thử lại tối đa 3 vòng nếu chưa đủ, để đảm bảo chất lượng đề thi. | 8 | Cao | `quiz.utils.ts`, `MAX_GENERATION_ROUNDS = 3` |
| US-23 | Là Member, tôi muốn làm bài trắc nghiệm và nộp bài để được chấm điểm ngay (so khớp nội bộ, không cần gọi lại AI). | 5 | Cao | `quiz.service.ts#submitQuiz` |
| US-24 | Là Member, tôi muốn xem kết quả chi tiết từng câu sau khi nộp bài và xem lại lịch sử các lần làm Quiz trước đó. | 3 | Trung bình | `GET /quiz/history`, `GET /quiz/history/:id` |
| US-25 | Là Member, tôi muốn xem thống kê độ chính xác của mình theo từng thì và từng cấp độ để biết mình còn yếu ở đâu. | 3 | Trung bình | `quiz.service.ts#getQuizStats` |

### Sprint 6 — Luyện viết đoạn văn có AI đánh giá

**Mục tiêu**: Mở rộng luyện viết từ cấp độ câu lên đoạn văn hoàn chỉnh, chấm theo nhiều tiêu chí, giữ lịch sử chỉnh sửa.

| ID | User Story | SP | Ưu tiên | Ghi chú / Căn cứ |
|---|---|---|---|---|
| US-26 | Là Admin, tôi muốn CRUD Đề viết đoạn văn (yêu cầu đề bài, trình độ Beginner/Intermediate/Advanced, số từ tối thiểu/tối đa) để cung cấp đề luyện viết đoạn văn. | 5 | Trung bình | `paragraph.route.ts` (`/paragraph/admin/topics`) |
| US-27 | Là Member, tôi muốn chọn chủ đề và độ khó để AI sinh một đề bài viết đoạn văn phù hợp. | 5 | Cao | `paragraph.service.ts#generateAIParagraphTopic` |
| US-28 | Là Member, tôi muốn nộp đoạn văn của mình và nhận đánh giá AI theo 7 tiêu chí (nội dung, bố cục, mạch lạc, ngữ pháp, từ vựng, cấu trúc câu, tự nhiên) kèm bản sửa gợi ý. | 8 | Cao | `paragraph.service.ts#submitAttempt` → `aiService.evaluateParagraph()` |
| US-29 | Là Member, tôi muốn mỗi lần sửa và nộp lại cùng một đề được lưu vào lịch sử (tối đa 30 bản gần nhất) để so sánh quá trình cải thiện của mình. | 5 | Trung bình | `ParagraphAttempt.revisions[]`, `$slice: -30` |
| US-30 | Là Member, tôi muốn xem thống kê riêng cho việc luyện viết đoạn văn (số lượt, điểm trung bình) tách biệt với luyện viết câu. | 3 | Thấp | `GET /paragraph/my-stats` |

### Sprint 7 — Thống kê, Tiến độ & Chẩn đoán AI

**Mục tiêu**: Cho học viên cái nhìn tổng thể về quá trình học tập và Admin công cụ giám sát chất lượng AI chấm bài.

| ID | User Story | SP | Ưu tiên | Ghi chú / Căn cứ |
|---|---|---|---|---|
| US-31 | Là Member, tôi muốn xem tổng quan số liệu học tập của mình (tổng số bài, điểm trung bình, độ chính xác) trên trang Thống kê. | 5 | Cao | `AnalyticsPage.tsx`, `GET /analytics/overview` |
| US-32 | Là Member, tôi muốn có hệ thống XP/Level game hóa dựa trên số bài đã làm, điểm trung bình và số chủ đề đã hoàn thành, để tạo động lực học tập liên tục. | 5 | Thấp | `learning.service.ts#getProgressOverview`, công thức `xp = totalWriting*8 + ...` |
| US-33 | Là Member, tôi muốn chủ động yêu cầu AI chẩn đoán điểm yếu của mình (tổng hợp từ các lỗi và bài đã làm) để biết nên ôn tập chủ điểm nào tiếp theo. | 8 | Trung bình | `analytics.service.ts#performAIAnalysis` → `aiService.analyzeWeakness()` |
| US-34 | Là Member, tôi muốn có trang Hồ sơ cá nhân để đổi tên hiển thị và đặt mục tiêu số câu luyện mỗi ngày. | 2 | Thấp | `ProfilePage.tsx`, `PUT /users/profile` |
| US-35 | Là Admin, tôi muốn xem một bảng lịch sử AI chấm bài hợp nhất (cả Sentence Writing và Paragraph Writing, mọi học viên) có thể lọc và tìm kiếm, để giám sát chất lượng đánh giá của AI toàn hệ thống. | 5 | Trung bình | `AdminEvaluationsPage.tsx`, hợp nhất 2 nguồn dữ liệu phía Frontend |

### Sprint 8 — Hoàn thiện, Bảo mật & Triển khai

**Mục tiêu**: Bổ sung công cụ giám sát tổng thể cho Admin, gia cố bảo mật/chi phí AI, kiểm thử và đưa hệ thống lên production.

| ID | User Story | SP | Ưu tiên | Ghi chú / Căn cứ |
|---|---|---|---|---|
| US-36 | Là Admin, tôi muốn xem Dashboard tổng quan hệ thống (tổng người dùng, quy mô ngân hàng câu hỏi, tổng lượt chấm bài, điểm trung bình toàn hệ thống) ngay khi đăng nhập. | 5 | Trung bình | `AdminOverviewPage.tsx`, `analytics.service.ts#getSystemStats` |
| US-37 | Là Admin, tôi muốn xem thông tin tham khảo 6 cấp độ CEFR (A1–C2) để hiểu tiêu chuẩn phân loại đang áp dụng trong hệ thống. | 2 | Thấp | `GET /topics/levels` — dữ liệu hard-code trong `topicService.getLevels()`, không phải collection DB |
| US-38 | Là Hệ thống, tôi muốn giới hạn tần suất gọi các endpoint liên quan AI (chấm bài, sinh đề, chẩn đoán) theo từng người dùng, để tránh lạm dụng gây tốn chi phí API. | 3 | Cao | `rateLimit.middleware.ts#aiRateLimiter` |
| US-39 | Là Lập trình viên, tôi muốn kiểm thử hồi quy toàn bộ các luồng nghiệp vụ chính (đăng ký/đăng nhập, Quiz, Sentence/Paragraph Writing, Admin CRUD) trước khi phát hành, để đảm bảo không có luồng nào bị phá vỡ. | 5 | Cao | Kiểm thử thủ công + tự động theo từng module |
| US-40 | Là Lập trình viên, tôi muốn đóng gói 2 bundle Frontend (User/Admin) và cấu hình biến môi trường để triển khai hệ thống lên môi trường production. | 5 | Cao | `client/vite.config.ts`, biến môi trường `MONGODB_URI`, `ADMIN_EMAIL`/`ADMIN_PASSWORD`, API key AI (`GEMINI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`) và `AI_PRIMARY_ORDER` |

---

## 5. Product Backlog tồn đọng (chưa triển khai)

Các hạng mục dưới đây **chưa được xây dựng** tính đến thời điểm hiện tại — được ghi nhận lại từ [17-admin-management.md](system-documentation/17-admin-management.md) (mục Known Issues/Technical Debt) làm cơ sở đề xuất cho các Sprint tiếp theo, **không nằm trong 40 hạng mục Done ở trên**:

| # | Đề xuất | Hiện trạng | Ưu tiên đề xuất |
|---|---|---|---|
| B-01 | Trang "Lịch sử của tôi" cho Member trong User Portal | API `GET /writing/attempts`, `GET /paragraph/attempts` đã có sẵn, chỉ thiếu giao diện tổng hợp riêng cho học viên | Trung bình |
| B-02 | Giao diện Admin quản lý Chủ đề & Ngữ pháp (Topic/GrammarTopic taxonomy) | Backend CRUD đầy đủ (`/topics/topics`, `/topics/grammar`) nhưng không còn trang Admin Portal nào gọi tới | Thấp |
| B-03 | Giao diện tải câu hỏi Writing hàng loạt (Bulk upload) cho Admin | Backend endpoint `POST /writing/admin/questions/bulk` tồn tại nhưng chưa có nút/form nào trên `AdminQuestionsPage.tsx` gọi tới | Thấp |
| B-04 | Đồng bộ số liệu Paragraph Writing vào `streak`/`totalWriting`/`averageScore` của User | Hiện chỉ Sentence Writing cập nhật các trường này trên `UserModel`, có thể gây hiểu lầm cho học viên chỉ luyện Paragraph Writing | Trung bình |
| B-05 | Sửa `topicService.getLevels()` để đếm `questionCount` theo đúng nguồn dữ liệu đang hoạt động (Mongo/in-memory) | Hàm này hiện luôn đếm từ `memoryStore`, không kiểm tra `isMongoActive()` như các service khác | Thấp |

## 6. Tổng kết

- **Tổng số hạng mục đã hoàn thành**: 40/40 (US-01 → US-40), trải đều 8 Sprint, tổng **202 Story Points**.
- **Vận tốc trung bình (velocity)**: ~25 Story Points/Sprint (2 tuần/sprint).
- **3 module tốn nhiều công sức nhất** (tổng Story Points cao nhất): Sentence AI Writing (Sprint 4, 27 SP), Grammar Quiz (Sprint 5, 27 SP), Paragraph AI Writing (Sprint 6, 26 SP) — đúng với thực tế đây là 3 luồng nghiệp vụ lõi, xoay quanh việc tích hợp AI (Google Gemini) và cơ chế dự phòng nhiều tầng (Groq → OpenRouter → Heuristic Provider).
- Backlog này được viết dựa trên đối chiếu trực tiếp với source code và bộ tài liệu [docs/system-documentation/](system-documentation/) hiện có của dự án — không có chức năng nào bị chỉnh sửa trong quá trình biên soạn tài liệu này.
