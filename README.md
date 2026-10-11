# AI English Writing

Nền tảng luyện viết tiếng Anh cho người Việt. AI tự sinh đề, tự chấm bài và giải thích lỗi bằng tiếng Việt.

## Chức năng chính

**Học viên**
- **Writing Learning**: 19 chủ đề (12 thì + 7 kỹ năng viết), học lý thuyết, xem ví dụ, luyện tập, theo dõi tiến độ (XP/Level).
- **Grammar Quiz**: AI sinh 10–50 câu trắc nghiệm theo thì/cấp độ/chủ đề, chấm ở server, có lịch sử và thống kê.
- **Luyện viết câu**: chọn từ ngân hàng câu hỏi hoặc để AI sinh đề; AI chấm theo 5 chỉ tiêu (ngữ pháp 40, từ vựng 20, ý nghĩa 20, cấu trúc 10, tự nhiên 10); nộp lại và so sánh các lần nộp.
- **Luyện viết đoạn văn**: AI sinh đề, chấm theo 7 tiêu chí, giữ lịch sử các lần sửa.
- **Thống kê**: điểm, lỗi thường gặp, thống kê Quiz, chẩn đoán điểm yếu bằng AI (chạy khi bấm nút).

**Quản trị viên**: quản lý người dùng, ngân hàng câu hỏi, đề đoạn văn, nội dung học, xem lịch sử chấm bài của mọi học viên, dashboard hệ thống.

## AI

Chuỗi failover **Gemini → Groq → OpenRouter → Heuristic**: thử lần lượt từng provider đã có API key (mỗi provider 1 lần), provider nào thành công thì dừng; chỉ khi tất cả lỗi mới dùng bộ quy tắc dự phòng không cần mạng. Giao diện chỉ hiển thị "Chế độ dự phòng" khi kết quả do bộ quy tắc này chấm. Chi tiết: [docs/system-documentation/11-ai-system.md](docs/system-documentation/11-ai-system.md).

## Công nghệ

- Backend: Node.js 18+, Express 5, TypeScript, Mongoose (MongoDB), Zod, JWT + refresh token (cookie HttpOnly).
- Frontend: React 19, Vite, Tailwind CSS 4, React Router, TanStack Query. Hai ứng dụng độc lập: User Portal (`/`) và Admin Portal (`/admin`).
- AI: Google Gemini (`@google/genai`), Groq và OpenRouter (API kiểu OpenAI, gọi bằng `fetch`).

## Chạy trên máy local

```bash
npm install                 # cài cả backend lẫn client (client là npm workspace)
cp .env.example .env        # rồi điền các biến bên dưới
npm run dev                 # build client một lần, sau đó chạy backend tự reload
```

Mở `http://localhost:<PORT>/` (User) và `http://localhost:<PORT>/admin` (Admin). `PORT` mặc định 3000.

Không có MongoDB thì hệ thống chạy với dữ liệu mẫu trong bộ nhớ, riêng Paragraph Writing, Writing Learning và Grammar Quiz cần MongoDB.

## Biến môi trường chính

| Biến | Ý nghĩa |
|---|---|
| `MONGODB_URI` | Chuỗi kết nối MongoDB (bỏ trống → dữ liệu trong bộ nhớ) |
| `JWT_SECRET`, `REFRESH_TOKEN_SECRET` | Secret ký token — **bắt buộc đổi ở production** |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Tạo tài khoản admin đầu tiên (bỏ trống → không tự tạo) |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Gemini (provider đầu chuỗi) |
| `GROQ_API_KEY`, `GROQ_MODEL` | Groq (dự phòng), model mặc định `openai/gpt-oss-20b` |
| `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | OpenRouter (dự phòng); model mặc định là model trả phí, cần credit hoặc đổi sang model miễn phí |
| `AI_PRIMARY_ORDER` | Thứ tự thử provider, mặc định `gemini,groq,openrouter` |

Thiếu API key nào thì provider đó bị bỏ qua; không có key nào thì chạy hoàn toàn bằng bộ quy tắc dự phòng. Danh sách đầy đủ (kèm `GROQ_REASONING_EFFORT`, `AI_EVALUATION_TEMPERATURE`, ...) trong [.env.example](.env.example) và [docs/system-documentation/20-deployment-and-runtime.md](docs/system-documentation/20-deployment-and-runtime.md).

## Scripts

| Lệnh | Việc thực hiện |
|---|---|
| `npm run dev` | Build client + chạy backend bằng `ts-node-dev` |
| `npm run build` | Build client + biên dịch backend sang `dist/` |
| `npm start` | Chạy `node dist/server.js` |
| `npm run lint` | Kiểm tra kiểu TypeScript (`tsc --noEmit`) |

## Triển khai

`deploy.sh`: `git pull` → `npm ci` → `npm run build` → PM2 (`npm start`). Một tiến trình Express phục vụ cả API lẫn hai bundle giao diện.

## Cấu trúc thư mục

```text
src/        Backend (Express + TypeScript): mỗi module trong src/modules/<tên>/ theo route → controller → service → model
client/     Frontend (React + Vite), 2 entry: User Portal và Admin Portal
docs/       Tài liệu hệ thống và Product Backlog
```

## Tài liệu

- [docs/system-documentation/](docs/system-documentation/) — 21 file: tổng quan, nghiệp vụ, kiến trúc, API, database, hệ thống AI, luồng dữ liệu, triển khai. Bắt đầu từ [21-system-summary.md](docs/system-documentation/21-system-summary.md).
- [docs/product-backlog.md](docs/product-backlog.md) — Product Backlog theo Scrum (40 hạng mục, 8 sprint).
- [docs/uml/AI-English-Writing-UML.drawio](docs/uml/AI-English-Writing-UML.drawio) — bộ sơ đồ UML (mở bằng draw.io), bản Word ở `docs/uml/word/`.
- [presentation/](presentation/) — slide bảo vệ đồ án và ghi chú thuyết trình.
