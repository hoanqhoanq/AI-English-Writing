# 05 — Cấu trúc dự án (Project Structure)

Cấp cao nhất:

```text
AI-English-Writing/
├── src/                 Backend (Express + TypeScript), biên dịch ra dist/
├── client/              Frontend (React + Vite), 2 entry build, biên dịch ra client/dist/
├── deploy.sh            Script deploy production (git pull → build → PM2)
├── .env.example         Danh sách biến môi trường có ghi chú (xem 20-deployment-and-runtime.md)
├── package.json         package.json gốc/backend — tên "real-estate-backend" là tàn dư cũ từ template gốc, không liên quan đến ứng dụng
└── tsconfig.json        Cấu hình TypeScript backend
```

## `src/` (backend)

```text
src/
├── app.ts               Khởi tạo Express app: middleware, mount route, phục vụ SPA tĩnh
├── server.ts             Entry point: dotenv, connectDatabase(), app.listen()
├── config/
│   ├── env.ts             Nguồn duy nhất chứa mọi biến môi trường (kèm giá trị mặc định)
│   └── database.ts        Kết nối Mongo + kích hoạt seeder khi kết nối thành công
├── db/
│   └── memoryStore.ts      Kho dữ liệu dự phòng chạy trong tiến trình, dùng khi Mongo không khả dụng
├── middlewares/
│   ├── auth.middleware.ts     authenticate (kiểm tra JWT + isActive), authorize(...roles)
│   ├── validate.middleware.ts Bọc validate request body/query bằng Zod
│   ├── rateLimit.middleware.ts Rate limiter đơn giản trong bộ nhớ theo user/IP (chỉ dùng ở các route gọi AI)
│   └── error.middleware.ts    Xử lý lỗi Express toàn cục
├── seeds/
│   ├── seedData.ts        Nội dung seed hardcode: 15 Topic, 18 GrammarTopic, ~100 WritingQuestion, 19 LearningTopic (12 thì + 7 kỹ năng)
│   └── seeder.ts           Logic seed idempotent, chạy một lần mỗi khi kết nối Mongo
├── types/
│   ├── index.ts            Type dùng chung toàn hệ thống (CefrLevel, AttemptStatus, IEvaluationResult, v.v.) — dùng ở backend, được mirror thủ công bởi client/src/types/index.ts
│   └── express.d.ts         Mở rộng Request của Express thêm req.user
├── utils/
│   ├── apiResponse.ts       ApiResponse.success()/error() — khuôn mẫu response duy nhất dùng ở mọi nơi
│   ├── jwt.ts               signToken/verifyToken (access token), generateRefreshToken/hashRefreshToken (refresh token)
│   ├── password.ts          Hash/compare bcrypt
│   └── streak.ts            computeNextStreak(): tính streak theo số ngày liên tiếp (múi giờ Việt Nam)
└── modules/
    ├── auth/            Đăng ký/Đăng nhập/Refresh/Đăng xuất cho cả 2 portal, phiên refresh-token
    ├── users/            Hồ sơ cá nhân + quản lý người dùng phía Admin
    ├── topics/            Dữ liệu tham khảo Topic + GrammarTopic + cấp độ CEFR
    ├── writing/           Ngân hàng câu hỏi, session/attempt Sentence Writing, gợi ý ngữ pháp
    ├── ai/                 Endpoint AI thô + abstraction AIProvider + chuỗi provider + prompt (lõi engine AI)
    ├── analytics/          Thống kê từng user, chẩn đoán điểm yếu AI, thống kê toàn hệ thống cho admin
    ├── paragraph/           Đề/attempt/sinh đề AI cho Paragraph Writing (chỉ chạy với Mongo)
    ├── learning/            Chủ đề/tiến độ Writing Learning + sinh đề AI Writing (chỉ chạy với Mongo)
    └── quiz/                Grammar Quiz: sinh quiz bằng AI, nộp bài, lịch sử, thống kê (chỉ chạy với Mongo)
```

Mỗi thư mục module (trừ `ai`, vì không có "AI model" nào để lưu trữ riêng) đều theo mẫu: `*.route.ts` → `*.controller.ts` → `*.service.ts` → `*.model.ts` (+ `*.validation.ts` nếu module nhận ghi dữ liệu). Xem [04-system-architecture.md](04-system-architecture.md) để hiểu lý do.

### Chi tiết từng file: `src/modules/ai/` (engine AI — đọc [11-ai-system.md](11-ai-system.md) để hiểu đầy đủ)

```text
ai/
├── ai.interface.ts        Interface AIProvider (6 method) + toàn bộ type *Input (hợp đồng mọi provider phải tuân theo)
├── ai.service.ts           Dựng chuỗi provider (Gemini → Groq → OpenRouter, theo AI_PRIMARY_ORDER), thử lần lượt, fallback sang Heuristic; đối chiếu điểm chấm câu với 5 chỉ tiêu
├── ai.controller.ts         Tầng HTTP mỏng cho endpoint trực tiếp /api/ai/evaluate-writing
├── ai.route.ts               /api/ai/evaluate-writing
├── providers/
│   ├── gemini.provider.ts    Gọi Gemini qua @google/genai: thử danh sách model, timeout 6s, parse+validate JSON, retry validate; export các Zod schema dùng chung
│   ├── openai-compatible.provider.ts  Lớp cơ sở gọi API kiểu OpenAI bằng fetch (dùng chung prompt + Zod schema của Gemini)
│   ├── groq.provider.ts       Groq (kế thừa lớp cơ sở; model từ GROQ_MODEL, reasoning_effort cho gpt-oss)
│   ├── openrouter.provider.ts OpenRouter (kế thừa lớp cơ sở; model từ OPENROUTER_MODEL)
│   └── heuristic.provider.ts Bộ quy tắc dự phòng không gọi mạng, cho mọi method của AIProvider
└── prompts/
    ├── writing-generation.prompt.ts     Xây prompt sinh câu hỏi Sentence Writing
    ├── writing-evaluation.prompt.ts      Xây prompt chấm một câu trả lời
    ├── paragraph-generation.prompt.ts    Xây prompt sinh đề viết đoạn văn
    ├── paragraph-evaluation.prompt.ts     Xây prompt chấm một đoạn văn
    ├── quiz-generation.prompt.ts          Xây prompt sinh quiz trắc nghiệm
    └── weakness-analysis.prompt.ts        Xây prompt cho báo cáo chẩn đoán điểm yếu AI
```

**Được sử dụng bởi**: `writing.service.ts` (evaluateWriting), `learning.service.ts` (generateQuestions, tái dùng cho AI Writing), `paragraph.service.ts` (evaluateParagraph, generateParagraphPrompt), `analytics.service.ts` (analyzeWeakness), `quiz.service.ts` (generateQuiz), và route trực tiếp `/api/ai/evaluate-writing`.

### `src/modules/quiz/` (Grammar Quiz)

```text
quiz/
├── quiz.route.ts          /api/quiz: generate, :quizId/submit, history, history/:id, stats
├── quiz.controller.ts     Tầng HTTP mỏng
├── quiz.service.ts        Chia số câu theo thì, sinh bù nhiều vòng + lọc câu trùng, chấm điểm ở server, lịch sử, thống kê
├── quiz.utils.ts          Chuẩn hóa/so sánh câu (Jaccard), kế hoạch chia câu theo thì, xáo trộn
├── quiz.validation.ts     Zod: difficulty A1–C2, questionCount 10–50, answers
└── quiz-attempt.model.ts  Model QuizAttempt
```

## `client/src/` (frontend)

```text
client/src/
├── main.tsx                 Entry User Portal (mount <App/>)
├── App.tsx                   QueryClientProvider + AuthProvider(portal="user") + AppRoutes
├── index.css                  File gốc nạp Tailwind
├── context/
│   └── AuthContext.tsx        Context xác thực tham số hóa theo portal (xem 08-authentication-and-authorization.md)
├── services/
│   ├── api.ts                  Instance axios dùng chung, access token trong RAM, interceptor refresh
│   └── adminService.ts          Hàm wrapper có type cho mọi endpoint dành riêng cho Admin
├── types/
│   └── index.ts                 Bản mirror phía frontend của các shape response backend (đồng bộ thủ công, không sinh tự động)
├── pages/
│   └── RootRedirect.tsx          "/" → /dashboard nếu đã đăng nhập, ngược lại → /login
├── routes/
│   ├── AppRoutes.tsx              Cây <Routes> của User Portal (chủ đích không có route /admin nào)
│   ├── ProtectedRoute.tsx          Cổng xác thực cho route User
│   ├── UserRoute.tsx               Cổng phụ lồng bên trong ProtectedRoute (không kiểm tra vai trò)
│   └── AdminProtectedRoute.tsx     Cổng xác thực + kiểm tra vai trò cho route Admin
├── user/                        Mọi thứ chỉ dành cho User Portal
│   ├── layouts/UserLayout.tsx      Navbar + <Outlet/> + Footer
│   ├── components/                 Component dùng chung (ScoreBadge, ErrorViewer, PracticeResultPanel, ParagraphScorePanel, AttemptComparisonPanel, PronounceButton, MarkdownLite, XPLevelBadge, LearningTopicCard, UserNavbar, UserFooter)
│   └── pages/                       Home, SignIn, SignUp, Dashboard, PracticePage, QuestionBankPage, WritingQuestionPage, AnalyticsPage, ProfilePage, LearningHomePage, LearningTopicPage, LearningProgressPage, ParagraphWritingPage, ParagraphTopicPage, GrammarQuizPage
└── admin/                       Mọi thứ chỉ dành cho Admin Portal — một ứng dụng độc lập thứ hai
    ├── main.tsx                   Entry Admin Portal (QueryClientProvider riêng, AuthProvider(portal="admin") riêng, <Routes> riêng)
    ├── layouts/AdminLayout.tsx      Sidebar + Header + <Outlet/>
    ├── components/                  AdminSidebar, AdminHeader
    └── pages/                        AdminLoginPage, AdminOverviewPage, AdminUsersPage, AdminQuestionsPage, AdminParagraphTopicsPage, AdminLearningTopicsPage, AdminLevelsPage, AdminEvaluationsPage
```

**File**: `client/src/routes/AppRoutes.tsx`
**Vai trò**: định nghĩa mọi route truy cập được trong bundle User. Chủ đích không chứa route `/admin` nào (một quyết định có tài liệu, ảnh hưởng trực tiếp đến an toàn — xem [08-authentication-and-authorization.md](08-authentication-and-authorization.md) để hiểu bug mà cách này ngăn chặn).
**Được sử dụng bởi**: `App.tsx`.
**Liên quan đến**: `ProtectedRoute.tsx`, `UserRoute.tsx`, mọi file trong `user/pages/`.

**File**: `client/src/admin/main.tsx`
**Vai trò**: một ứng dụng React hoàn chỉnh thứ hai — `QueryClientProvider` riêng, `AuthProvider` riêng, cây `<Routes>` viết inline riêng (không tách thành file kiểu `AppRoutes` như bundle User).
**Được sử dụng bởi**: `admin.html` (entry build thứ hai của Vite).
**Liên quan đến**: `AdminProtectedRoute.tsx`, mọi file trong `admin/pages/` và `admin/layouts/`.

**File**: `client/src/services/api.ts`
**Vai trò**: nơi duy nhất trong ứng dụng giữ access token (`let accessToken` ở phạm vi module — không bao giờ dùng `localStorage`). Mọi lệnh gọi HTTP ở cả 2 portal đều đi qua đúng một instance `axios` này và các interceptor của nó.
**Được sử dụng bởi**: mọi trang/component gọi backend, `AuthContext.tsx`, `adminService.ts`.
**Liên quan đến**: [08-authentication-and-authorization.md](08-authentication-and-authorization.md).
