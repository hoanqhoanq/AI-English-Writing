# Ghi chú thuyết trình — AI English Writing (Đồ án tốt nghiệp)

File này đi kèm `AI-English-Writing-Defense-Presentation.pptx` (18 slide). Toàn bộ nội dung dưới đây được rút ra trực tiếp từ việc đọc source code thực tế của dự án `AI-English-Writing` — không suy đoán, không bịa số liệu.

---

## A. Nội dung nói cho từng slide

### Slide 1 — Trang bìa
Giới thiệu tên đề tài: **AI English Writing** — hệ thống luyện viết tiếng Anh có AI hỗ trợ đánh giá. Đây là một ứng dụng web thực tế, không phải mô hình lý thuyết: frontend React + TypeScript, backend Node.js + Express, database MongoDB, và AI thật sự dùng Google Gemini. Giới thiệu bản thân, giảng viên hướng dẫn và đơn vị đào tạo (phần này cần điền theo thực tế buổi bảo vệ vì không có thông tin này trong source code).

### Slide 2 — Bối cảnh và vấn đề
Nêu 4 vấn đề thực tế khi tự học viết tiếng Anh: khó tự đánh giá đúng/sai, khó phát hiện lỗi cụ thể (ngữ pháp/từ vựng/cấu trúc), giáo viên không thể phản hồi tức thời cho từng học viên, và các nền tảng luyện tập thông thường có đề bài cố định, không cá nhân hóa theo trình độ/chủ đề. Từ đó dẫn tới yêu cầu: cần một hệ thống tự động sinh đề và tự động đánh giá bằng AI — đây là động lực cho đề tài.

### Slide 3 — Mục tiêu đề tài
Trình bày 6 mục tiêu cụ thể: xây dựng nền tảng web hoàn chỉnh (gồm cả User Portal và Admin Portal), hỗ trợ luyện tập theo cấp độ CEFR/chủ đề/ngữ pháp, tích hợp AI thật để chấm điểm tự động, trả về phản hồi chi tiết bằng tiếng Việt, lưu lịch sử + thống kê + chẩn đoán điểm yếu bằng AI, và xây dựng một hệ thống quản trị Admin đầy đủ.

### Slide 4 — Đối tượng và phạm vi sử dụng
Hệ thống phục vụ 2 nhóm người dùng: **Học viên** (đăng ký, học Writing Learning, luyện viết câu, làm bài từ ngân hàng câu hỏi, viết đoạn văn, nhận đánh giá AI, xem thống kê) và **Quản trị viên** (đăng nhập hoàn toàn riêng biệt, quản lý người dùng/câu hỏi/nội dung, xem lịch sử chấm bài AI toàn hệ thống). Nhấn mạnh: 2 portal này tách biệt hoàn toàn về đăng nhập và giao diện — đây là một quyết định kiến trúc có chủ đích trong dự án.

### Slide 5 — Giải pháp đề xuất
Kiến trúc tổng quan 3 lớp: Người học thao tác trên React Frontend → gửi request qua REST API (Express) → REST API chuyển xuống lớp Business Logic (các Service) → lớp này giao tiếp với MongoDB (lưu dữ liệu) và AI Service (gọi Gemini để đánh giá/sinh đề) → kết quả được phản hồi ngược lại cho người học ngay trên giao diện.

### Slide 6 — Công nghệ sử dụng
Điểm qua 6 nhóm công nghệ thực tế: Frontend (React 19, TypeScript, Vite với 2 entry build riêng cho User/Admin, Tailwind CSS, React Query), Backend (Node.js, Express 5, Zod validate), Database (MongoDB + Mongoose, có cơ chế fallback lưu tạm trong bộ nhớ khi chưa cấu hình MongoDB), AI (Google Gemini qua thư viện `@google/genai`, thiết kế theo Provider Abstraction Pattern), Authentication (JWT access token + refresh token riêng biệt trong HttpOnly Cookie, bcrypt hash mật khẩu), và Triển khai (PM2 quản lý tiến trình Node.js, 1 Express server phục vụ cả API lẫn 2 giao diện).

### Slide 7 — Kiến trúc hệ thống
Sơ đồ kiến trúc phân tầng thật của hệ thống: một server Express duy nhất (`app.ts`) phục vụ 2 bundle SPA (build từ cùng 1 project Vite: `index.html` cho User, `admin.html` cho Admin), định tuyến dựa trên tiền tố đường dẫn. Mỗi request API đi qua Route → Middleware (authenticate/authorize/validate) → Controller → Service. Service là nơi giao tiếp với MongoDB (qua Mongoose) và với AI Service khi cần đánh giá/sinh nội dung bằng AI.

### Slide 8 — Các chức năng chính
Tổng hợp 4 nhóm chức năng đã triển khai thật: User (Học & Luyện tập — Writing Learning, AI Writing, Ngân hàng câu hỏi, Viết đoạn văn) và User (Kết quả & Theo dõi — điểm số, gợi ý, thống kê, chẩn đoán điểm yếu AI); Admin (Quản lý nội dung — CRUD câu hỏi/đề đoạn văn/nội dung học) và Admin (Quản trị hệ thống — quản lý người dùng, lịch sử chấm bài, dashboard).

### Slide 9 — Quy trình học tập của người dùng
Hành trình 6 bước của một học viên: Đăng nhập (JWT) → Chọn nội dung (chủ đề/thì/cấp độ) → Học lý thuyết (tab Learn & Examples) → Luyện tập (Practice/AI Writing) → AI đánh giá (điểm số + phản hồi) → Theo dõi (lịch sử & thống kê). Mỗi bước đều ánh xạ trực tiếp tới một API backend thật, không phải giả lập.

### Slide 10 — Quy trình AI đánh giá bài viết
Đây là slide kỹ thuật quan trọng nhất: mô tả pipeline 6 bước thật từ code (`writing.service.ts`, `ai.service.ts`): (1) đầu vào là đề tiếng Việt + câu trả lời tiếng Anh; (2) backend nhận request và **tự lấy đáp án chuẩn từ database — chỉ tại server**, không bao giờ gửi đáp án xuống frontend trước khi nộp bài; (3) xây dựng prompt bằng cách ghép ngữ cảnh; (4) gọi Gemini thật, tự động fallback sang bộ quy tắc dự phòng (Heuristic) nếu Gemini lỗi; (5) validate JSON trả về bằng Zod schema trước khi tin dùng; (6) lưu vào MongoDB và phản hồi cho người dùng. Đây chính là điểm mạnh kỹ thuật: hệ thống không tin tưởng mù quáng vào AI, luôn có bước kiểm chứng.

### Slide 11 — Kiến trúc AI — Provider Abstraction
Giải thích AI không được gọi thẳng từ Service mà đi qua một interface chung tên `AIProvider` (`ai.interface.ts`), định nghĩa 5 phương thức. Hiện có 2 lớp cài đặt: `GeminiProvider` (gọi thật Google Gemini) và `HeuristicProvider` (bộ quy tắc cố định, không gọi mạng, dùng khi Gemini chưa cấu hình hoặc lỗi). Nhờ thiết kế theo interface này, dự án có thể mở rộng thêm provider AI khác (ví dụ OpenAI) trong tương lai mà không cần sửa lại business logic đang gọi `aiService`.

### Slide 12 — AI đánh giá câu trả lời như thế nào?
Trình bày đúng tỷ trọng chấm điểm ghi trong prompt thật (`writing-evaluation.prompt.ts`, Rule 6): Ngữ pháp 40%, Từ vựng 20%, Ý nghĩa 20%, Cấu trúc câu 10%, Tự nhiên 10% — nhấn mạnh đây chỉ là **định hướng**, AI đánh giá tổng thể (holistic) chứ không cộng dồn máy móc. Nguyên tắc quan trọng nhất: đáp án chuẩn chỉ là MỘT cách dịch khả dĩ, AI không được so khớp chuỗi ký tự cứng nhắc với đáp án mẫu mà phải hiểu đúng ngữ pháp/ý nghĩa thật sự. Paragraph Writing chấm theo 7 tiêu chí rộng hơn, không có trọng số cố định trong prompt.

### Slide 13 — Kết quả phản hồi AI trả về
Minh họa đúng cấu trúc dữ liệu thật mà API `POST /writing/attempts` trả về: trạng thái (correct/partially_correct/incorrect), điểm tổng, tên AI provider đã dùng, điểm theo 5 tiêu chí con, danh sách lỗi cụ thể (`wrongText` → `correctText` kèm giải thích tiếng Việt do AI tự sinh riêng cho từng câu), điểm mạnh và khuyến nghị học tập.

### Slide 14 — AI hỗ trợ Viết đoạn văn (Paragraph Writing)
AI tham gia 2 bước: sinh đề bài bằng tiếng Việt theo chủ đề/độ khó người học chọn (có kiểm tra bằng code để chắc chắn đề là tiếng Việt, không chỉ dựa vào lời dặn trong prompt), và chấm điểm đoạn văn theo 7 tiêu chí, trả về điểm + phản hồi + một bản sửa gợi ý hoàn chỉnh. Nhấn mạnh: AI hỗ trợ đánh giá/sinh đề, **không viết thay** đoạn văn cho người học. Mỗi lần nộp lại bài được lưu thêm vào lịch sử các lần sửa (`revisions[]`, tối đa 30 bản ghi gần nhất).

### Slide 15 — Thiết kế cơ sở dữ liệu (MongoDB)
Sơ đồ quan hệ giữa các model MongoDB thật: `User` là trung tâm, liên kết tới `WritingAttempt` (sinh ra nhiều `WritingError`), `ParagraphAttempt`, `AIAnalysis`, `RefreshTokenSession`; `WritingQuestion` là một cụm riêng liên kết với `Topic`/`GrammarTopic`. Điểm kỹ thuật đáng chú ý: toàn bộ 13 model liên kết với nhau qua **giá trị chuỗi (id)**, không dùng `ref`/`.populate()` của Mongoose — để các Service hoạt động đồng nhất trên cả 2 chế độ lưu trữ (MongoDB thật và In-memory Store dự phòng).

### Slide 16 — Minh họa giao diện hệ thống
Trình chiếu 6 màn hình đại diện (mockup dựa trên đúng nhãn/bố cục từ source code UI, không phải ảnh chụp thật): Đăng nhập, Dashboard, AI Writing, Kết quả đánh giá AI, Ngân hàng câu hỏi, Admin Dashboard. **Nếu có thể trình chiếu trực tiếp trên máy thật, đây là thời điểm tốt nhất để demo live cho hội đồng** thay vì chỉ dùng mockup.

### Slide 17 — Kết quả đạt được và hạn chế
Trình bày trung thực: 8 điểm đã đạt được (web app hoàn chỉnh, xác thực an toàn, đầy đủ chức năng luyện viết có AI thật, phản hồi chi tiết, lưu lịch sử/thống kê/chẩn đoán, Admin quản trị đầy đủ, MongoDB + fallback) và 5 hạn chế thực tế đã phát hiện khi rà soát code (chưa có trang lịch sử cá nhân cho User, Paragraph Writing chưa tính vào thống kê chung, rate limiter chỉ đúng khi chạy 1 instance, chưa có RAG, chưa có UI Admin quản lý Topic/GrammarTopic). Không dùng bất kỳ số liệu % nào không có bằng chứng.

### Slide 18 — Kết luận và hướng phát triển
Tổng kết: đề tài đã xây dựng thành công một hệ thống hoàn chỉnh, tích hợp AI thật cho việc đánh giá và sinh nội dung học tập. Hướng phát triển (chỉ nêu những gì **chưa làm**, không nhận vơ): RAG cho nội dung học tập, cải thiện prompt engineering, mở rộng thêm AI provider khác (kiến trúc interface đã sẵn sàng), cá nhân hóa lộ trình học, phân tích lỗi chuyên sâu hơn, hệ thống gợi ý bài tập. Kết thúc bằng lời cảm ơn và mời hội đồng đặt câu hỏi.

---

## B. Câu hỏi hội đồng có thể hỏi (20+ câu)

### Về AI

**1. Vì sao dự án chọn dùng Google Gemini?**
Dự án tích hợp trực tiếp Gemini qua SDK chính thức `@google/genai` (xem `src/modules/ai/providers/gemini.provider.ts`), gọi `client.models.generateContent()` với `responseMimeType: "application/json"` để ép AI trả JSON có cấu trúc. Đây là lựa chọn triển khai thực tế của dự án; kiến trúc `AIProvider` interface cho phép thay bằng provider khác nếu cần (xem câu hỏi #7).

**2. Prompt Engineering trong dự án nghĩa là gì, thể hiện ở đâu?**
Là việc thiết kế nội dung văn bản gửi cho AI để nó trả về đúng định dạng và chất lượng mong muốn. Trong dự án, mỗi loại tác vụ AI có 1 file prompt riêng trong `src/modules/ai/prompts/` (5 file): `writing-evaluation.prompt.ts`, `writing-generation.prompt.ts`, `paragraph-evaluation.prompt.ts`, `paragraph-generation.prompt.ts`, `weakness-analysis.prompt.ts`. Mỗi prompt có: vai trò AI, quy trình suy luận từng bước bắt buộc, các quy tắc chấm điểm, và JSON schema đầu ra chính xác.

**3. AI đánh giá câu trả lời của học viên như thế nào?**
AI được yêu cầu đóng vai giáo viên, thực hiện 8 bước suy luận (hiểu đề → đọc câu trả lời tổng thể → chấm ý nghĩa → chấm ngữ pháp → chấm từ vựng → chấm độ tự nhiên → chấm chính tả → ra quyết định điểm) trước khi trả kết quả. Điểm số dựa trên 5 tiêu chí có tỷ trọng định hướng (Ngữ pháp 40%, Từ vựng 20%, Ý nghĩa 20%, Cấu trúc 10%, Tự nhiên 10% — xem `writing-evaluation.prompt.ts` Rule 6), nhưng AI đánh giá tổng thể chứ không cộng dồn cứng nhắc.

**4. Làm sao hạn chế việc AI trả JSON sai định dạng?**
3 lớp phòng thủ: (1) ép `responseMimeType: "application/json"` ở tầng gọi API Gemini; (2) validate kết quả bằng **Zod schema** khớp chính xác với JSON schema trong prompt (`EvaluationSchema` trong `gemini.provider.ts`) — nếu sai cấu trúc, coi như lỗi; (3) với các tác vụ chấm điểm, tự động **thử lại tối đa 3 lần** (cách nhau 300ms) trước khi chuyển sang fallback.

**5. Làm sao kiểm soát AI hallucination (bịa lỗi không có thật)?**
Prompt có quy tắc rõ ràng: "NEVER invent an error that is not really there. Nếu câu trả lời hoàn toàn đúng, `errors` PHẢI là mảng rỗng." Với chẩn đoán điểm yếu, prompt yêu cầu "Do NOT invent fake data — chỉ phân tích trên số liệu được cung cấp." Ngoài ra, với việc sinh đề đoạn văn, có thêm một bước kiểm tra **bằng code** (không chỉ tin prompt): hàm `looksVietnamese()` đếm ký tự có dấu tiếng Việt để xác nhận đề bài thật sự là tiếng Việt, nếu không đạt thì coi là lỗi và thử lại.

**6. Vì sao không dùng ChatGPT/OpenAI?**
Đây là lựa chọn triển khai thực tế của dự án (Google Gemini). Tuy nhiên kiến trúc `AIProvider` interface (`ai.interface.ts`) được thiết kế tách biệt AI logic khỏi business logic — nên có thể bổ sung một `OpenAIProvider` mới cài đặt cùng interface đó mà không cần sửa `writing.service.ts`, `paragraph.service.ts`, `analytics.service.ts`, v.v. Đây là hướng phát triển, **chưa triển khai**.

**7. Provider Abstraction có tác dụng gì thực tế?**
Toàn bộ service nghiệp vụ chỉ gọi `aiService.evaluateWriting(...)`, không biết/không quan tâm bên trong là Gemini hay provider nào khác. `aiService` giữ 1 provider "chính" (mặc định Gemini) và 1 `HeuristicProvider` làm dự phòng cố định. Muốn đổi AI provider chỉ cần viết class mới cài đặt đúng interface `AIProvider` rồi đăng ký trong constructor của `AIService` — không đụng vào bất kỳ route/controller/service nghiệp vụ nào khác.

**8. Nếu Gemini API lỗi hoặc hết hạn mức (rate limit) thì hệ thống xử lý thế nào?**
`aiService` bọc mọi lệnh gọi provider chính trong try/catch — bất kỳ lỗi nào (mạng, quota, JSON sai, model bị deprecated...) đều tự động fallback sang `HeuristicProvider` (không gọi mạng, dùng quy tắc/mẫu cố định), kết quả trả về vẫn có field `provider: "heuristic_fallback"` để Frontend biết và hiển thị khác đi. Riêng ở tầng gọi Gemini, còn có danh sách nhiều model dự phòng (`gemini-3.6-flash`, `gemini-flash-latest`, `gemini-3.5-flash`...) — nếu 1 model bị lỗi 503/429/404, tự động thử model tiếp theo trước khi coi là thất bại hẳn.

**9. Hệ thống có dùng RAG không?**
**Không.** Đã xác minh: không có vector database, không có embedding model, không có bước "similarity search" nào trong codebase. Mọi ngữ cảnh đưa vào prompt đều lấy bằng truy vấn MongoDB thông thường theo id chính xác. Đây được liệt kê rõ ràng là hướng phát triển trong tương lai (Slide 18), không phải chức năng đã có.

**10. AI có tự học/tự cải thiện qua thời gian không (fine-tuning)?**
Không. Mỗi lệnh gọi AI là một prompt độc lập, không có bộ nhớ hội thoại, không có cơ chế fine-tune mô hình. AI chỉ nhận đúng dữ liệu được truyền vào ở mỗi lần gọi (stateless).

### Về Backend

**11. Vì sao dùng Node.js/Express?**
Cho phép dùng chung ngôn ngữ TypeScript ở cả frontend và backend, hệ sinh thái phong phú (đặc biệt SDK `@google/genai` chính thức hỗ trợ Node.js), và Express là framework nhẹ, phù hợp xây REST API rõ ràng theo mô hình Route → Controller → Service.

**12. Express đóng vai trò gì trong hệ thống?**
Định tuyến toàn bộ request `/api/*` tới đúng module (`auth`, `writing`, `paragraph`, `learning`, `analytics`...), chạy middleware xác thực/phân quyền/validate trước khi vào Controller, và (ở production) còn phục vụ luôn 2 bundle frontend tĩnh (`index.html`/`admin.html`) — một server Express duy nhất làm cả 2 việc.

**13. REST API trong dự án hoạt động ra sao?**
Mỗi domain nghiệp vụ có `*.route.ts` định nghĩa endpoint, `*.controller.ts` nhận request/trả response theo khuôn mẫu `{success, message, data}`, và `*.service.ts` chứa toàn bộ logic + truy vấn DB/gọi AI. Ví dụ `POST /api/writing/attempts` đi qua `writing.route.ts` → `writing.controller.ts#submitAttempt` → `writing.service.ts#submitAttempt`.

### Về Database

**14. Vì sao chọn MongoDB?**
Dữ liệu của dự án (câu hỏi, bài làm, đánh giá AI có nhiều field lồng nhau như `errors[]`, `scoreBreakdown`, `revisions[]`) phù hợp với mô hình document linh hoạt của MongoDB hơn là bảng quan hệ cứng nhắc. Mongoose cung cấp schema validation ở tầng ứng dụng trong khi vẫn giữ được sự linh hoạt đó.

**15. Mongoose dùng để làm gì?**
Là ODM (Object Document Mapper) cho MongoDB trong Node.js — định nghĩa schema/type cho 13 model (`User`, `WritingQuestion`, `WritingAttempt`,...), cung cấp API truy vấn (`find`, `create`, `findByIdAndUpdate`...) và validate dữ liệu trước khi lưu.

**16. Các model liên kết với nhau thế nào?**
Qua **giá trị chuỗi** (id dạng `Schema.Types.Mixed`), không dùng `ref`/`.populate()` — vì hệ thống cần hoạt động đồng nhất trên cả nhánh MongoDB thật lẫn nhánh In-memory Store dự phòng (nơi id chỉ là chuỗi tự sinh, không phải ObjectId thật). Mọi "join" trong service đều viết tay bằng truy vấn `find({_id: {$in: [...]}})` rồi dựng `Map` tra cứu thủ công.

**17. Nếu MongoDB không kết nối được thì sao?**
Phần lớn module (auth, users, topics, writing) tự động chuyển sang lưu dữ liệu tạm trong bộ nhớ tiến trình (`src/db/memoryStore.ts`), được seed sẵn dữ liệu mẫu tương đương — hệ thống vẫn chạy được để demo/phát triển. Riêng 2 module Viết đoạn văn và Writing Learning **bắt buộc** phải có MongoDB, sẽ báo lỗi thân thiện nếu chưa kết nối.

### Về Authentication

**18. JWT hoạt động thế nào trong dự án?**
`utils/jwt.ts#signToken()` ký access token chứa `{id, email, role, name}`, hết hạn sau 15 phút (mặc định). Mỗi request được middleware `authenticate` verify token và **tái kiểm tra `isActive` trong database** (không chỉ tin claim trong token) — tài khoản bị khóa mất quyền ngay lập tức, không cần đợi token hết hạn.

**19. Access token và refresh token khác nhau gì?**
Access token: JWT, sống ngắn (15 phút), giữ **trong RAM** phía client (không bao giờ ghi `localStorage`), gửi kèm mỗi request qua header `Authorization: Bearer`. Refresh token: chuỗi ngẫu nhiên 48 byte (không phải JWT), sống dài (30 ngày), dùng để "đổi" lấy access token mới khi hết hạn mà không cần đăng nhập lại.

**20. Vì sao refresh token dùng HttpOnly Cookie?**
Vì JavaScript phía client **không thể đọc** được cookie HttpOnly — hạn chế rủi ro bị đánh cắp qua tấn công XSS. Chỉ hash SHA-256/HMAC của token được lưu trong MongoDB (collection `refresh_token_sessions`), token thật không bao giờ chạm database.

**21. User Portal và Admin Portal chia sẻ phiên đăng nhập không?**
**Không** — đây là điểm thiết kế cố ý. Mỗi portal có endpoint riêng (`/api/auth/login` vs `/api/auth/admin/login`) và cookie refresh token tên khác nhau (`user_refresh_token` vs `admin_refresh_token`). Đăng nhập Admin còn từ chối thẳng tài khoản không có `role: "admin"` bằng 403, không set cookie.

### Về Frontend

**22. Vì sao dùng React?**
Component-based, hệ sinh thái lớn, phù hợp xây 2 SPA (User/Admin) với nhiều màn hình tương tác (form, danh sách có lọc, kết quả AI hiển thị động).

**23. Vì sao dùng TypeScript?**
Static typing giúp phát hiện lỗi sớm khi biên dịch, đặc biệt quan trọng khi truyền dữ liệu phức tạp giữa Frontend/Backend (ví dụ kiểu `EvaluationResult` với nhiều field lồng nhau) và khi đảm bảo tầng an toàn dữ liệu (ví dụ kiểu `Omit<WritingQuestion, 'referenceAnswer'>` ép buộc component không thể lỡ đọc đáp án).

**24. Vite có tác dụng gì?**
Build tool/dev server cho frontend, cấu hình 2 entry point (`index.html`, `admin.html`) để build ra 2 bundle JavaScript độc lập cho 2 portal từ cùng 1 project.

### Về kiến trúc & triển khai

**25. Frontend và Backend giao tiếp thế nào?**
Qua REST API dạng JSON, dùng chung 1 instance `axios` (`services/api.ts`) có interceptor tự gắn access token vào header và tự động thử refresh token khi gặp lỗi 401.

**26. Vì sao tách AI Service thành module riêng thay vì viết logic AI thẳng trong Controller?**
Để tái sử dụng logic gọi AI ở nhiều nơi (Sentence Writing, Paragraph Writing, AI Writing, chẩn đoán điểm yếu) mà không lặp code, đồng thời cô lập rủi ro (lỗi AI provider không làm sập toàn bộ luồng nghiệp vụ nhờ cơ chế fallback tập trung).

**27. Nếu thay Gemini bằng OpenAI thì cần sửa gì?**
Chỉ cần viết 1 class mới (ví dụ `OpenAIProvider`) cài đặt đúng 5 phương thức của interface `AIProvider`, rồi đăng ký nó trong constructor của `AIService` (`ai.service.ts`). Không cần sửa bất kỳ controller/service nghiệp vụ nào khác — đây chính là lợi ích của Provider Abstraction.

**28. Nginx làm gì trong hệ thống?**
**Lưu ý quan trọng khi trả lời hội đồng:** source code repo hiện tại **không có** file cấu hình Nginx nào. `deploy.sh` chỉ dùng PM2 để quản lý tiến trình Node.js — bản thân Express đã tự phục vụ cả API lẫn 2 bundle frontend tĩnh. Nếu hạ tầng thực tế có đặt Nginx phía trước (reverse proxy/SSL termination), đó là cấu hình nằm ngoài phạm vi repo này, không nên khẳng định chắc chắn nếu không có bằng chứng.

**29. PM2 làm gì?**
Process manager cho Node.js — giữ tiến trình `node dist/server.js` chạy liên tục, tự khởi động lại khi crash, và cho phép `deploy.sh` restart ứng dụng an toàn sau mỗi lần deploy (`pm2 restart ai-english-writing --update-env`).

**30. Môi trường production khác development thế nào?**
`NODE_ENV=production` bật cờ `secure: true` cho cookie refresh token (chỉ gửi qua HTTPS). Ở development, `npm run dev` build client 1 lần rồi chạy backend bằng `ts-node-dev --respawn` (tự reload khi sửa code); ở production, `npm run build` biên dịch cả client lẫn backend ra file tĩnh/JS trước khi PM2 khởi chạy.

---

## C. Mapping Slide → Source Code

Dùng khi hội đồng hỏi "chức năng này nằm ở đâu trong code?"

```text
Slide 5/7 – Kiến trúc hệ thống
→ src/app.ts                              (định tuyến /api và /admin)
→ client/vite.config.ts                    (2 build entry: index.html, admin.html)
→ client/src/main.tsx , client/src/admin/main.tsx

Slide 6 – Công nghệ sử dụng
→ package.json (root)                      (Express, Mongoose, JWT, bcrypt...)
→ client/package.json                       (React, Vite, Tailwind, React Query, Axios)

Slide 8/9 – Chức năng & Quy trình học tập
→ src/modules/writing/                      (Sentence Writing, Ngân hàng câu hỏi)
→ src/modules/paragraph/                    (Viết đoạn văn)
→ src/modules/learning/                     (Writing Learning, AI Writing)
→ src/modules/analytics/                    (Thống kê, chẩn đoán AI)
→ client/src/user/pages/*.tsx

Slide 10 – Quy trình AI đánh giá bài viết
→ src/modules/writing/writing.service.ts     (submitAttempt)
→ src/modules/ai/ai.service.ts               (evaluateWriting)
→ src/modules/ai/providers/gemini.provider.ts
→ src/modules/ai/prompts/writing-evaluation.prompt.ts

Slide 11 – Kiến trúc AI / Provider Abstraction
→ src/modules/ai/ai.interface.ts             (interface AIProvider)
→ src/modules/ai/ai.service.ts               (chọn + fallback provider)
→ src/modules/ai/providers/gemini.provider.ts
→ src/modules/ai/providers/heuristic.provider.ts

Slide 12 – Tiêu chí chấm điểm AI
→ src/modules/ai/prompts/writing-evaluation.prompt.ts   (Rule 6 – tỷ trọng)
→ src/modules/ai/prompts/paragraph-evaluation.prompt.ts (7 tiêu chí)
→ src/modules/ai/providers/gemini.provider.ts            (Zod schema validate)

Slide 13 – Kết quả phản hồi AI
→ src/types/index.ts                          (IEvaluationResult)
→ client/src/user/components/PracticeResultPanel.tsx
→ client/src/user/components/ErrorViewer.tsx

Slide 14 – AI hỗ trợ Viết đoạn văn
→ src/modules/paragraph/paragraph.service.ts   (generateAIParagraphTopic, submitAttempt)
→ src/modules/ai/prompts/paragraph-generation.prompt.ts
→ src/modules/paragraph/paragraph-attempt.model.ts (revisions[])

Slide 15 – Thiết kế cơ sở dữ liệu
→ src/modules/**/*.model.ts                   (13 model Mongoose)
→ src/db/memoryStore.ts                        (fallback in-memory)

Slide 16 – Giao diện hệ thống
→ client/src/user/pages/SignIn.tsx, Dashboard.tsx, PracticePage.tsx, QuestionBankPage.tsx
→ client/src/admin/pages/AdminOverviewPage.tsx

Authentication (nền cho nhiều slide)
→ src/modules/auth/auth.service.ts , auth.controller.ts , auth.route.ts
→ src/utils/jwt.ts , src/utils/password.ts
→ src/middlewares/auth.middleware.ts
→ client/src/context/AuthContext.tsx
→ client/src/services/api.ts
```

---

## D. Lưu ý khi trình bày

- Mọi số liệu trong slide (tỷ trọng 40/20/20/10/10, 7 tiêu chí Paragraph, 13 model, 12 thì + 7 kỹ năng...) đều lấy trực tiếp từ source code — có thể mở file tương ứng để chứng minh ngay nếu hội đồng yêu cầu.
- Không tự thêm số liệu kiểu "% độ chính xác AI", "số lượng người dùng thực tế" — dự án chưa có dữ liệu vận hành thật để đưa ra các con số đó.
- Phần "Hạn chế" (Slide 17) và "Hướng phát triển" (Slide 18) nên được nói với thái độ chủ động, thể hiện đã hiểu rõ giới hạn hiện tại của hệ thống — đây thường là điểm cộng khi bảo vệ, không phải điểm trừ.
