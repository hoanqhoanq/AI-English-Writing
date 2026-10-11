# 21 — Tổng kết hệ thống (dành cho người mới vào dự án)

> "Nếu tôi mới nhận project này hôm nay, tôi cần hiểu gì đầu tiên?"

## 1. Project dùng để làm gì?

Nền tảng luyện viết tiếng Anh cho người Việt, có AI (Gemini, với Groq/OpenRouter làm dự phòng) tự sinh đề luyện tập và tự động chấm bài, giải thích lỗi bằng tiếng Việt. Chi tiết: [01-system-overview.md](01-system-overview.md).

## 2. Các module chính?

`auth` (đăng nhập/đăng ký), `users`, `topics` (dữ liệu tham khảo Chủ đề/Ngữ pháp/CEFR), `writing` (Ngân hàng câu hỏi + chấm bài Sentence Writing), `ai` (engine AI dùng chung), `analytics` (thống kê + chẩn đoán AI), `paragraph` (Viết đoạn văn), `learning` (Writing Learning — 19 chủ đề + AI Writing), `quiz` (Grammar Quiz — trắc nghiệm do AI sinh). Xem [05-project-structure.md](05-project-structure.md).

## 3. Frontend nằm ở đâu?

`client/src/`. **Có 2 ứng dụng React độc lập trong cùng 1 project**: User Portal (`client/src/main.tsx` → `App.tsx`, phục vụ ở `/`) và Admin Portal (`client/src/admin/main.tsx`, phục vụ ở `/admin`) — build ra 2 bundle riêng bởi Vite (`client/vite.config.ts`). Đừng nhầm lẫn 2 cây thư mục `client/src/user/` và `client/src/admin/` với nhau — mỗi thư mục chỉ thuộc về đúng 1 portal.

## 4. Backend nằm ở đâu?

`src/`. Express + TypeScript, mọi domain nghiệp vụ nằm trong `src/modules/<tên>/`, luôn theo cấu trúc `route → controller → service → model`. Điểm khởi động: `src/server.ts` → `src/app.ts`.

## 5. Database nằm ở đâu?

MongoDB, kết nối qua biến môi trường `MONGODB_URI`. Nếu không có Mongo, phần lớn hệ thống **tự động** chạy được với dữ liệu mẫu trong bộ nhớ (`src/db/memoryStore.ts`) — trừ 3 module **Paragraph Writing**, **Writing Learning** và **Grammar Quiz** bắt buộc phải có Mongo. 14 model đầy đủ: [09-database-design.md](09-database-design.md).

## 6. AI nằm ở đâu?

`src/modules/ai/`. Một `aiService` duy nhất, thử lần lượt chuỗi **Gemini → Groq → OpenRouter** (`providers/gemini.provider.ts`, `groq.provider.ts`, `openrouter.provider.ts`; provider nào chưa có API key thì bị bỏ qua, thứ tự đổi được bằng `AI_PRIMARY_ORDER`), mỗi provider đúng 1 lần, provider nào thành công thì dừng; chỉ khi tất cả đều lỗi mới chuyển sang bộ quy tắc dự phòng không cần mạng (`providers/heuristic.provider.ts`). Prompt nằm riêng trong `src/modules/ai/prompts/`, mỗi loại tác vụ AI một file, dùng chung cho mọi provider. Đây là phần tài liệu chi tiết nhất — đọc [11-ai-system.md](11-ai-system.md) trước, rồi tới [12](12-ai-writing-evaluation.md)/[13](13-ai-paragraph-generation.md).

## 7. Authentication nằm ở đâu?

`src/modules/auth/` (backend), `client/src/context/AuthContext.tsx` (frontend, dùng chung cho cả 2 portal qua prop `portal`). JWT access token (RAM phía client, 15 phút) + refresh token (cookie HttpOnly, 30 ngày, hash lưu DB). User và Admin có **cookie và endpoint tách biệt hoàn toàn** — đừng bao giờ cho 2 portal dùng chung 1 endpoint đăng nhập, đây là quyết định thiết kế có chủ đích. Chi tiết: [08-authentication-and-authorization.md](08-authentication-and-authorization.md).

## 8. Chức năng quan trọng nhất?

Nộp một câu/đoạn văn để AI chấm — đây là chức năng lõi mọi module khác đều xoay quanh (kể cả Analytics, Learning Progress, Admin Evaluation History đều là "đọc lại" dữ liệu do chức năng này tạo ra).

## 9. Luồng submit bài?

```text
User viết câu trả lời → Submit
→ Backend lấy lại đáp án chuẩn (chỉ lúc này, không phải trước đó)
→ Gọi AI chấm (Gemini → Groq → OpenRouter, cuối cùng mới Heuristic)
→ (chấm câu) đối chiếu điểm tổng với 5 chỉ tiêu theo trọng số 40/20/20/10/10
→ Lưu WritingAttempt/ParagraphAttempt + cập nhật User (chỉ Sentence Writing mới cộng streak/tổng số)
→ Trả kết quả cho Frontend
→ Frontend tự làm mới Dashboard/Analytics ngay, không cần F5
```
Chi tiết đầy đủ + sơ đồ: [14-writing-workflow.md](14-writing-workflow.md).

## 10. Luồng AI?

```text
Service xây "context" (lấy câu hỏi/đề bài từ DB)
→ Gọi aiService.<method>()
→ aiService thử provider đầu chuỗi (mặc định Gemini)
→ Provider build prompt (string thuần, trong src/modules/ai/prompts/)
→ Gọi API của provider (Gemini SDK, hoặc fetch tới Groq/OpenRouter) → nhận JSON thô
→ Validate bằng Zod — sai shape thì thử lại (chấm bài/sinh đề đoạn văn: tối đa 3 lần) rồi coi là lỗi
→ Provider lỗi → thử provider kế tiếp; hết provider AI → HeuristicProvider (không gọi mạng)
→ Trả kết quả đã chuẩn hóa về Service (kèm tên provider đã xử lý)
```
Chi tiết đầy đủ: [11-ai-system.md](11-ai-system.md). **Không có RAG** trong hệ thống này — đừng giả định có.

## 11. Những file quan trọng nhất?

- `src/modules/ai/ai.service.ts` — trái tim của mọi tính năng AI: dựng chuỗi provider, failover, đối chiếu điểm chấm câu.
- `src/modules/ai/providers/gemini.provider.ts` — nơi thực sự gọi Gemini + parse + validate; cũng là nơi định nghĩa các Zod schema dùng chung.
- `src/modules/ai/providers/openai-compatible.provider.ts` — lớp cơ sở cho Groq/OpenRouter.
- `src/modules/quiz/quiz.service.ts` — sinh quiz nhiều vòng + chấm điểm ở server.
- `src/modules/writing/writing.service.ts` — luồng nộp bài + bảo vệ đáp án.
- `src/modules/auth/auth.service.ts` + `auth.controller.ts` — toàn bộ cơ chế đăng nhập 2 portal.
- `client/src/services/api.ts` — nơi duy nhất giữ access token, nơi xử lý tự động refresh khi hết hạn.
- `client/src/context/AuthContext.tsx` — trạng thái đăng nhập, dùng chung code nhưng tách dữ liệu theo `portal`.
- `client/src/routes/AppRoutes.tsx` — **tuyệt đối không thêm route `/admin` vào đây**.

## 12. Nếu muốn sửa AI thì bắt đầu từ đâu?

- Sửa **văn phong/tiêu chí chấm điểm/nội dung giải thích**: sửa đúng 1 file trong `src/modules/ai/prompts/`, không cần đụng gì khác.
- Sửa **field trả về** (thêm/bớt field JSON): phải sửa **2 chỗ cùng lúc** — phần mô tả JSON schema trong file prompt, **và** Zod schema tương ứng trong `gemini.provider.ts` (2 nơi này bắt buộc khớp nhau, không có cơ chế tự đồng bộ; Groq/OpenRouter dùng lại đúng các schema này).
- Sửa **cách chọn/thử model Gemini**: `gemini.provider.ts#generateJsonWithFallback`.
- Sửa **thứ tự hoặc bật/tắt provider**: đặt biến `AI_PRIMARY_ORDER` / các `*_API_KEY` trong `.env`, không cần sửa code.
- Thêm **provider mới**: xem [19-file-responsibility-map.md](19-file-responsibility-map.md) hàng "Đổi/thêm AI provider".
- Xem toàn bộ danh sách bàn giao file trong [19-file-responsibility-map.md](19-file-responsibility-map.md) trước khi sửa bất cứ gì liên quan AI.

## 13. Nếu muốn sửa giao diện thì bắt đầu từ đâu?

Xác định trước: đang sửa **User Portal** (`client/src/user/`) hay **Admin Portal** (`client/src/admin/`) — 2 cây độc lập, không dùng chung component (trừ một vài tiện ích thuần hiển thị nếu có, thực tế hiện tại 2 portal không share component nào). Route của User nằm ở `AppRoutes.tsx`; route của Admin nằm inline ngay trong `admin/main.tsx`.

## 14. Nếu muốn sửa database thì bắt đầu từ đâu?

Tìm đúng model trong `src/modules/<domain>/*.model.ts` (danh sách đầy đủ: [09-database-design.md](09-database-design.md)), sửa schema Mongoose. Nếu module đó có nhánh in-memory (kiểm tra bằng cách tìm `isMongoActive()` trong `*.service.ts` cùng thư mục), phải sửa **song song** cả interface `Memory*` tương ứng trong `src/db/memoryStore.ts` để 2 nhánh không lệch nhau — đây là nguồn lỗi dễ gặp nhất khi mở rộng schema trong dự án này.

---

Muốn tra cứu nhanh hơn theo tên chức năng cụ thể, dùng bảng ở [19-file-responsibility-map.md](19-file-responsibility-map.md) thay vì đọc lại toàn bộ 20 file còn lại.
